with open("main.py", "r") as f:
    content = f.read()

import_block = """import os
import shutil
import json"""
new_import_block = """import os
import shutil
import json
import asyncio
import datetime
from fastapi import BackgroundTasks
import psutil
import signal"""

if import_block in content:
    content = content.replace(import_block, new_import_block)

endpoint = """@app.post("/api/chats")"""
new_endpoint = """
async def scheduled_shutdown_task(target_time_str: str):
    print(f"Scheduled shutdown for {target_time_str}")
    # target_time_str is like "14:30"
    while True:
        now = datetime.datetime.now()
        current_time_str = now.strftime("%H:%M")
        if current_time_str == target_time_str:
            print("TIME REACHED! Initiating shutdown of all SyncMind processes...")
            
            # Find and kill all python processes that are part of this app
            current_pid = os.getpid()
            for proc in psutil.process_iter(['pid', 'name', 'cmdline']):
                try:
                    cmdline = proc.info.get('cmdline') or []
                    if proc.info['name'] in ['python.exe', 'python', 'python3'] and proc.info['pid'] != current_pid:
                        # Check if it's running our scripts
                        cmd_str = " ".join(cmdline).lower()
                        if "main.py" in cmd_str or "sandbox" in cmd_str or "syncmind" in cmd_str:
                            print(f"Killing related process: {proc.info['pid']}")
                            os.kill(proc.info['pid'], signal.SIGTERM)
                except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                    pass
            
            # Finally kill ourselves
            print(f"Killing master process: {current_pid}")
            os.kill(current_pid, signal.SIGTERM)
            break
        await asyncio.sleep(30) # Check every 30 seconds

@app.post("/api/system/schedule_shutdown")
def schedule_shutdown(background_tasks: BackgroundTasks, body: dict = Body(...)):
    time_str = body.get("time") # Expected format "HH:MM"
    if not time_str:
        return {"error": "Time is required"}
    background_tasks.add_task(scheduled_shutdown_task, time_str)
    return {"message": f"System scheduled to completely shut down at {time_str}"}

@app.post("/api/chats")"""

if endpoint in content:
    content = content.replace(endpoint, new_endpoint)
    with open("main.py", "w") as f:
        f.write(content)
    print("Added shutdown endpoint")
else:
    print("Could not find insertion point")
