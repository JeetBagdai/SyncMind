@echo off
echo ===================================================
echo      SyncMind Enterprise AI Swarm - Startup Script
echo ===================================================
echo.
echo Make sure your laptop is PLUGGED IN and on PERFORMANCE MODE!
echo.

echo [1/3] Booting Raft Distributed Database (rqlite)...
start "SyncMind - Database" cmd /k ".\rqlite\rqlited.exe -node-id node1 ~\rqlite_data"
timeout /t 2 /nobreak >nul

echo [2/3] Booting AI Inference Engine (Ollama)...
start "SyncMind - AI Engine" cmd /k "set OLLAMA_HOST=0.0.0.0&& ollama serve"
timeout /t 2 /nobreak >nul

echo [3/3] Booting Web Server (FastAPI)...
start "SyncMind - Web Server" cmd /k "uvicorn main:app --host 0.0.0.0 --port 3000"

echo.
echo ===================================================
echo All systems are online! 
echo The UI is available at: http://localhost:3000
echo ===================================================
echo.
echo You can close this window. Do not close the 3 new windows that popped up until you are done.
pause
