import json
import re
from datetime import datetime
from router import call_llm
from rag.search import search_knowledge_base
from sandbox.executor import SandboxExecutor

import pyrqlite.dbapi2 as dbapi2

class ToolRegistry:
    def __init__(self):
        self.sandbox = SandboxExecutor()
        
    def execute_tool(self, tool_name: str, tool_input: str) -> str:
        if tool_name == "search_knowledge_base":
            return search_knowledge_base(tool_input)
        elif tool_name == "sandbox_execute":
            code = tool_input.strip()
            if code.startswith("```python"):
                code = code[9:]
            elif code.startswith("```"):
                code = code[3:]
            if code.endswith("```"):
                code = code[:-3]
                
            res = self.sandbox.execute_python(code.strip())
            out = f"Status: {res['status']}\nStdout: {res['stdout']}\nStderr: {res['stderr']}"
            if res['generated_files']:
                out += f"\nGenerated Files: {', '.join(res['generated_files'])}"
            return out
        else:
            return f"Error: Tool {tool_name} not found."

class ContextStore:
    def __init__(self):
        # Connect to local rqlite node (Raft distributed database)
        try:
            self.conn = dbapi2.connect(host='127.0.0.1', port=4001)
            self._init_db()
            self.db_active = True
        except Exception as e:
            print(f"WARNING: Could not connect to rqlite cluster on port 4001. Is rqlited running? Error: {e}")
            self.db_active = False
            
        self.tools = ToolRegistry()

    def _init_db(self):
        with self.conn.cursor() as cursor:
            # rqlite executes SQLite syntax but replicates it via Raft
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp TEXT NOT NULL
                )
            """)

    def add_message(self, role: str, content: str):
        if not self.db_active: return
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO messages (role, content, timestamp)
                    VALUES (?, ?, ?)
                """, (role, content, datetime.now().isoformat()))
        except Exception as e:
            print(f"DB Insert Error: {e}")

    def get_history(self, limit=15):
        if not self.db_active: return []
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("""
                    SELECT role, content FROM messages
                    ORDER BY id DESC LIMIT ?
                """, (limit,))
                rows = cursor.fetchall()
                # rows is a tuple of dicts or tuples depending on pyrqlite config
                # Let's handle it assuming tuples:
                rows_list = list(rows)
                rows_list.reverse()
                
                result = []
                for r in rows_list:
                    # pyrqlite returns dictionaries if column names are available, 
                    # but fallback to indexing if it returns tuples
                    if isinstance(r, dict):
                        result.append({"role": r['role'], "content": r['content']})
                    else:
                        result.append({"role": r[0], "content": r[1]})
                return result
        except Exception as e:
            print(f"DB Select Error: {e}")
            return []

    async def run_agent_loop(self, user_prompt: str, image_b64: str = None, stream_callback=None):
        """
        Executes a ReAct loop.
        stream_callback(type, content) is used to push thoughts/updates to the UI via WebSocket.
        """
        self.add_message("user", user_prompt)
        
        system_prompt = """You are SyncMind, an advanced air-gapped Enterprise AI Workbench running on a distributed swarm.
You have access to the following tools:
1. search_knowledge_base: Searches internal company manuals (SOPs, reports). Input: a search query string.
2. sandbox_execute: Executes Python code in a secure local sandbox. You can use this for calculations, or using python-docx / python-pptx to generate deliverables. Input: Python code.

Format your responses exactly like this:
Thought: I need to do X...
Action: tool_name
Action Input: tool input

If you have the final answer, format it like this:
Thought: I have the final answer.
Final Answer: The final response to the user.
"""

        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(self.get_history(limit=5)) 
        
        if image_b64:
            messages[-1]["images"] = [image_b64]
            use_vision = True
        else:
            use_vision = False

        max_iterations = 5
        
        for i in range(max_iterations):
            # The router now handles the status stream_callback to show load balancing
            response = await call_llm(messages, use_vision=use_vision, stream_callback=stream_callback)
            
            if stream_callback:
                await stream_callback("thought", response)
            
            messages.append({"role": "assistant", "content": response})
            
            action_match = re.search(r"Action:\s*(.*?)\n", response)
            action_input_match = re.search(r"Action Input:\s*(.*?)(?:\n|$)", response, re.DOTALL)
            final_answer_match = re.search(r"Final Answer:\s*(.*)", response, re.DOTALL)
            
            if final_answer_match:
                final_text = final_answer_match.group(1).strip()
                self.add_message("assistant", final_text)
                return final_text
                
            elif action_match and action_input_match:
                action = action_match.group(1).strip()
                action_input = action_input_match.group(1).strip()
                
                if stream_callback:
                    await stream_callback("action", f"Running Tool: {action}\nInput:\n{action_input}")
                
                observation = self.tools.execute_tool(action, action_input)
                
                if stream_callback:
                    await stream_callback("observation", f"Result:\n{observation}")
                    
                messages.append({"role": "user", "content": f"Observation: {observation}"})
            else:
                self.add_message("assistant", response)
                return response
                
        fallback = "Agent reached maximum iteration limit."
        self.add_message("assistant", fallback)
        return fallback