with open("context.py", "r", encoding="utf-8") as f:
    content = f.read()

old_func = """    def get_all_chats(self, owner_id="TEAM"):
        with self.conn.cursor() as cursor:
            cursor.execute(
                "SELECT id, title, category, is_pinned, updated_at FROM chats WHERE owner_id = ? ORDER BY is_pinned DESC, updated_at DESC", 
                (owner_id,)
            )"""

new_func = """    def get_all_chats(self, owner_id="TEAM"):
        with self.conn.cursor() as cursor:
            if owner_id == "TEAM_CENTRAL":
                cursor.execute(
                    "SELECT id, title, category, is_pinned, updated_at FROM chats WHERE owner_id LIKE 'TEAM_%' OR owner_id = 'TEAM' ORDER BY is_pinned DESC, updated_at DESC"
                )
            else:
                cursor.execute(
                    "SELECT id, title, category, is_pinned, updated_at FROM chats WHERE owner_id = ? ORDER BY is_pinned DESC, updated_at DESC", 
                    (owner_id,)
                )"""

content = content.replace(old_func, new_func)

with open("context.py", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated context.py")
