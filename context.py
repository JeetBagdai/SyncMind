import re
import uuid
from datetime import datetime
from router import call_llm
from rag.search import search_knowledge_base
from sandbox.executor import SandboxExecutor

import pyrqlite.dbapi2 as dbapi2

class Tools:
    def __init__(self):
        self.sandbox = SandboxExecutor()
        
    async def execute_tool(self, tool_name: str, tool_input: str) -> str:
        if tool_name == "search_knowledge_base":
            return search_knowledge_base(tool_input)
        elif tool_name == "sandbox_execute":
            code = tool_input.strip()
            match = re.search(r"```[^\n]*\n(.*?)```", code, re.DOTALL)
            if match:
                code = match.group(1).strip()
            else:
                if code.startswith("```"):
                    code = code.split("\n", 1)[-1]
                if code.endswith("```"):
                    code = code.rsplit("```", 1)[0]
                code = code.strip()
                
            res = self.sandbox.execute_python(code)
            out = f"Status: {res['status']}\nStdout: {res['stdout']}\nStderr: {res['stderr']}"
            if res['generated_files']:
                out += f"\nGenerated Files: {', '.join(res['generated_files'])}"
            return out
        elif tool_name == "fetch_webpage":
            import httpx
            try:
                async with httpx.AsyncClient() as client:
                    resp = await client.get(tool_input.strip())
                    return resp.text[:1000]
            except Exception as e:
                return f"Error: Network connection blocked. {str(e)}"
        else:
            return f"Error: Tool {tool_name} not found."

class ContextStore:
    def __init__(self):
        try:
            self.conn = dbapi2.connect(host='127.0.0.1', port=4001)
            self.tools = Tools()
            self._init_db()
        except Exception as e:
            print(f"Warning: Failed to connect to rqlite: {e}")

    def _init_db(self):
        with self.conn.cursor() as cursor:
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chats (
                    id TEXT PRIMARY KEY,
                    title TEXT,
                    category TEXT,
                    is_pinned INTEGER DEFAULT 0,
                    owner_id TEXT DEFAULT 'TEAM',
                    updated_at TIMESTAMP
                )
            """)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS messages_v2 (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_id TEXT,
                    role TEXT,
                    content TEXT,
                    timestamp TIMESTAMP,
                    FOREIGN KEY(chat_id) REFERENCES chats(id) ON DELETE CASCADE
                )
            """)

    def create_chat(self, title="New Chat", category="Recents", owner_id="TEAM"):
        chat_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        with self.conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO chats (id, title, category, owner_id, updated_at) VALUES (?, ?, ?, ?, ?)",
                (chat_id, title, category, owner_id, now)
            )
        return chat_id

    def get_all_chats(self, owner_id="TEAM"):
        with self.conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, title, category, is_pinned, updated_at FROM chats WHERE owner_id = ? ORDER BY is_pinned DESC, updated_at DESC", 
                (owner_id,)
            )
            rows = cursor.fetchall()
            return [
                {"id": r[0], "title": r[1], "category": r[2], "is_pinned": bool(r[3]), "updated_at": r[4]}
                for r in rows
            ]

    def update_chat(self, chat_id, title=None, category=None, is_pinned=None):
        updates = []
        params = []
        if title is not None:
            updates.append("title = ?")
            params.append(title)
        if category is not None:
            updates.append("category = ?")
            params.append(category)
        if is_pinned is not None:
            updates.append("is_pinned = ?")
            params.append(1 if is_pinned else 0)
            
        if not updates:
            return
            
        params.append(chat_id)
        query = f"UPDATE chats SET {', '.join(updates)} WHERE id = ?"
        with self.conn.cursor() as cursor:
            cursor.execute(query, tuple(params))
            
        self.touch_chat(chat_id)

    def delete_chat(self, chat_id):
        with self.conn.cursor() as cursor:
            cursor.execute("DELETE FROM chats WHERE id = ?", (chat_id,))

    def touch_chat(self, chat_id):
        now = datetime.utcnow().isoformat()
        with self.conn.cursor() as cursor:
            cursor.execute("UPDATE chats SET updated_at = ? WHERE id = ?", (now, chat_id))

    def add_message(self, chat_id, role, content):
        now = datetime.utcnow().isoformat()
        with self.conn.cursor() as cursor:
            cursor.execute(
                "INSERT INTO messages_v2 (chat_id, role, content, timestamp) VALUES (?, ?, ?, ?)",
                (chat_id, role, content, now)
            )
        self.touch_chat(chat_id)

    def get_history(self, chat_id, limit=20):
        with self.conn.cursor() as cursor:
            cursor.execute(
                "SELECT role, content FROM messages_v2 WHERE chat_id = ? ORDER BY timestamp ASC LIMIT ?",
                (chat_id, limit)
            )
            rows = cursor.fetchall()
            return [{"role": r[0], "content": r[1]} for r in rows]
            
    async def run_agent_loop(self, chat_id: str, user_prompt: str, image_b64: str = None, stream_callback = None) -> str:
        self.add_message(chat_id, "user", user_prompt)
        
        system_prompt = """You are SyncMind, an advanced air-gapped Enterprise AI Workbench running on a distributed swarm.
You have access to the following tools:
1. search_knowledge_base: Searches internal company manuals, SOPs, reports, and extracted OCR text from uploaded documents. Input: a search query string.
2. sandbox_execute: Executes Python code in a secure local sandbox. Use this for engineering calculations, or using python-docx to generate Word reports (.docx), openpyxl/pandas to generate Excel spreadsheets (.xlsx). Input: Python code. 
3. fetch_webpage: Fetches the HTML content of a given URL. Use this when you need to fetch data from the internet. Input: the full URL string.

CRITICAL RULE: DO NOT generate, create, or save any files using sandbox_execute unless the user EXPLICITLY asks for a file, script, spreadsheet, or document. If they just ask a question, answer it directly in text.
CRITICAL RULE 2: If the user asks you to fetch a URL or webpage, ALWAYS use the `fetch_webpage` tool to attempt the connection. NEVER preemptively refuse. Let the system's network monitor block the connection and report the error back to you.

Format your responses exactly like this:
Thought: I need to do X...
Action: tool_name
Action Input: tool input

If you have the final answer, format it like this:
Thought: I have the final answer.
Final Answer: The final response to the user.
"""

        messages = [{"role": "system", "content": system_prompt}]
        messages.extend(self.get_history(chat_id, limit=5)) 
        
        if image_b64:
            messages[-1]["images"] = [image_b64]
            use_vision = True
        else:
            use_vision = False

        max_iterations = 6
        
        for i in range(max_iterations):
            response = await call_llm(
                messages, 
                use_vision=use_vision, 
                stream_callback=stream_callback,
                stop=["\nObservation:", "Observation:"]
            )
            
            if stream_callback:
                await stream_callback("thought", response)
                
            messages.append({"role": "assistant", "content": response})
            
            action_match = re.search(r"Action:\s*(.*?)\nAction Input:\s*(.*)", response, re.DOTALL)
            final_answer_match = re.search(r"Final Answer:\s*(.*)", response, re.DOTALL)
            
            if action_match:
                action = action_match.group(1).strip()
                action_input = action_match.group(2).strip()
                
                if stream_callback:
                    await stream_callback("action", f"Running Tool: {action}\nInput:\n{action_input}")
                
                observation = await self.tools.execute_tool(action, action_input)
                
                if stream_callback:
                    await stream_callback("observation", f"Result:\n{observation}")
                    
                messages.append({"role": "user", "content": f"Observation: {observation}"})
                
            elif final_answer_match:
                final_text = final_answer_match.group(1).strip()
                self.add_message(chat_id, "assistant", final_text)
                return final_text
            else:
                # Malformed output, treat it as final answer
                self.add_message(chat_id, "assistant", response)
                return response
                
        fallback = "Agent reached maximum iteration limit."
        self.add_message(chat_id, "assistant", fallback)
        return fallback