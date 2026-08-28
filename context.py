import json
import re
import uuid
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
        else:
            return f"Error: Tool {tool_name} not found."

class ContextStore:
    def __init__(self):
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
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS chats (
                    id TEXT PRIMARY KEY,
                    title TEXT NOT NULL,
                    category TEXT NOT NULL,
                    is_pinned INTEGER DEFAULT 0,
                    owner_id TEXT NOT NULL DEFAULT 'TEAM',
                    updated_at TEXT NOT NULL
                )
            """)
            try:
                cursor.execute("ALTER TABLE chats ADD COLUMN owner_id TEXT NOT NULL DEFAULT 'TEAM'")
            except Exception:
                pass
                
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS messages_v2 (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    chat_id TEXT NOT NULL,
                    role TEXT NOT NULL,
                    content TEXT NOT NULL,
                    timestamp TEXT NOT NULL
                )
            """)

    # --- Chat Management ---
    def create_chat(self, title="New Chat", category="Recents", owner_id="TEAM"):
        if not self.db_active: return str(uuid.uuid4())
        chat_id = str(uuid.uuid4())
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO chats (id, title, category, is_pinned, owner_id, updated_at)
                    VALUES (?, ?, ?, 0, ?, ?)
                """, (chat_id, title, category, owner_id, datetime.now().isoformat()))
        except Exception as e:
            print(f"DB Insert Chat Error: {e}")
        return chat_id
        
    def get_all_chats(self, owner_id="TEAM"):
        if not self.db_active: return []
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("SELECT id, title, category, is_pinned, updated_at FROM chats WHERE owner_id = ? ORDER BY is_pinned DESC, updated_at DESC", (owner_id,))
                rows = cursor.fetchall()
                result = []
                for r in rows:
                    if isinstance(r, dict):
                        result.append({"id": r['id'], "title": r['title'], "category": r['category'], "is_pinned": bool(r['is_pinned']), "updated_at": r['updated_at']})
                    else:
                        result.append({"id": r[0], "title": r[1], "category": r[2], "is_pinned": bool(r[3]), "updated_at": r[4]})
                return result
        except Exception as e:
            print(f"DB Select Chats Error: {e}")
            return []

    def update_chat(self, chat_id, title=None, category=None, is_pinned=None):
        if not self.db_active: return
        try:
            with self.conn.cursor() as cursor:
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
                
                if not updates: return
                
                updates.append("updated_at = ?")
                params.append(datetime.now().isoformat())
                params.append(chat_id)
                
                query = f"UPDATE chats SET {', '.join(updates)} WHERE id = ?"
                cursor.execute(query, tuple(params))
        except Exception as e:
            print(f"DB Update Chat Error: {e}")

    def delete_chat(self, chat_id):
        if not self.db_active: return
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("DELETE FROM chats WHERE id = ?", (chat_id,))
                cursor.execute("DELETE FROM messages_v2 WHERE chat_id = ?", (chat_id,))
        except Exception as e:
            print(f"DB Delete Chat Error: {e}")

    def touch_chat(self, chat_id):
        if not self.db_active: return
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("UPDATE chats SET updated_at = ? WHERE id = ?", (datetime.now().isoformat(), chat_id))
        except Exception as e:
            pass

    # --- Message Management ---
    def add_message(self, chat_id: str, role: str, content: str):
        if not self.db_active: return
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("""
                    INSERT INTO messages_v2 (chat_id, role, content, timestamp)
                    VALUES (?, ?, ?, ?)
                """, (chat_id, role, content, datetime.now().isoformat()))
            self.touch_chat(chat_id)
            
            # If this is the first user message, generate a title automatically
            if role == "user":
                with self.conn.cursor() as cursor:
                    cursor.execute("SELECT COUNT(*) FROM messages_v2 WHERE chat_id = ? AND role = 'user'", (chat_id,))
                    count_res = cursor.fetchone()
                    count = count_res['COUNT(*)'] if isinstance(count_res, dict) else count_res[0]
                    if count == 1:
                        title = (content[:27] + "...") if len(content) > 30 else content
                        self.update_chat(chat_id, title=title)
        except Exception as e:
            print(f"DB Insert Message Error: {e}")

    def get_history(self, chat_id: str, limit=15):
        if not self.db_active: return []
        try:
            with self.conn.cursor() as cursor:
                cursor.execute("""
                    SELECT role, content FROM messages_v2
                    WHERE chat_id = ?
                    ORDER BY id DESC LIMIT ?
                """, (chat_id, limit))
                rows = cursor.fetchall()
                rows_list = list(rows)
                rows_list.reverse()
                
                result = []
                for r in rows_list:
                    if isinstance(r, dict):
                        result.append({"role": r['role'], "content": r['content']})
                    else:
                        result.append({"role": r[0], "content": r[1]})
                return result
        except Exception as e:
            print(f"DB Select Error: {e}")
            return []

    async def run_agent_loop(self, chat_id: str, user_prompt: str, image_b64: str = None, stream_callback=None):
        self.add_message(chat_id, "user", user_prompt)
        
        system_prompt = """You are SyncMind, an advanced air-gapped Enterprise AI Workbench running on a distributed swarm.
You have access to the following tools:
1. search_knowledge_base: Searches internal company manuals (SOPs, reports). Input: a search query string.
2. sandbox_execute: Executes Python code in a secure local sandbox. You can use this for calculations, or using python-docx / python-pptx to generate deliverables. Input: Python code. (Tip: For python-pptx bullets, use `tf = slide.placeholders[1].text_frame; tf.clear(); p = tf.add_paragraph(); p.text = '...'; p.font.size = Pt(16)` to avoid API errors and text overflow).

CRITICAL RULE: DO NOT generate, create, or save any files using sandbox_execute unless the user EXPLICITLY asks for a file, script, spreadsheet, or document. If they just ask a question, answer it directly in text.

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

        max_iterations = 5
        
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
            
            action_match = re.search(r"Action:\s*(.*?)\n", response)
            action_input_match = re.search(r"Action Input:\s*(.*?)(?=\nThought:|\nFinal Answer:|$)", response, re.DOTALL)
            final_answer_match = re.search(r"Final Answer:\s*(.*)", response, re.DOTALL)
            
            if action_match and action_input_match:
                action = action_match.group(1).strip()
                action_input = action_input_match.group(1).strip()
                
                if stream_callback:
                    await stream_callback("action", f"Running Tool: {action}\nInput:\n{action_input}")
                
                observation = self.tools.execute_tool(action, action_input)
                
                if stream_callback:
                    await stream_callback("observation", f"Result:\n{observation}")
                    
                messages.append({"role": "user", "content": f"Observation: {observation}"})
                
            elif final_answer_match:
                final_text = final_answer_match.group(1).strip()
                self.add_message(chat_id, "assistant", final_text)
                return final_text
            else:
                self.add_message(chat_id, "assistant", response)
                return response
                
        fallback = "Agent reached maximum iteration limit."
        self.add_message(chat_id, "assistant", fallback)
        return fallback