@echo off
echo ===================================================
echo      SyncMind System Utility: Deep Clean
echo ===================================================
echo.
echo Cleaning out chats, agent logs, workspaces, and uploads...

python -c "import os, shutil, pyrqlite.dbapi2 as dbapi2; conn = dbapi2.connect(host='127.0.0.1', port=4001); c = conn.cursor(); c.execute('DELETE FROM messages_v2'); c.execute('DELETE FROM chats'); print('--> Database: Cleared all chats and agent logs.')"

python -c "import os, shutil; ws='sandbox/workspace'; [shutil.rmtree(os.path.join(ws, d)) for d in os.listdir(ws) if os.path.isdir(os.path.join(ws, d))] if os.path.exists(ws) else None; print('--> Sandbox: Cleared all workspace runs.')"

python -c "import os, shutil; up='data/uploads'; [os.remove(os.path.join(up, f)) if os.path.isfile(os.path.join(up, f)) else shutil.rmtree(os.path.join(up, f)) for f in os.listdir(up)] if os.path.exists(up) else None; print('--> Uploads: Cleared all temporary uploads.')"

echo.
echo NOTE: If old chats still appear in the UI, it means your browser has cached them.
echo Open the browser console (F12) and run: clearSyncMindMemory() or just refresh the page.
echo.
pause
