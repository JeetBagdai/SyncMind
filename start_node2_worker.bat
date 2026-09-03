@echo off
echo ===================================================
echo   SyncMind Swarm - NODE 2 (WORKER / MID-SPEC)
echo ===================================================

echo ===================================================
echo   Verifying System Dependencies...
echo ===================================================
ollama --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Ollama is not installed! Node 1 and 2 require Ollama to run the AI engine.
    echo Please download and install it from https://ollama.com, then run this script again.
    pause
    exit /b
)
python -c "import uvicorn, fastapi, httpx" >nul 2>&1
if errorlevel 1 (
    echo [INITIAL SETUP] Missing Python packages detected. Installing from requirements.txt...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Failed to install Python dependencies. Please ensure Python is installed and in PATH.
        pause
        exit /b
    )
)

echo This laptop acts as a Database Replica and adds its CPU/GPU to the AI Inference pool.
echo.
set /p MASTER_IP="Enter the IP address of the Master Laptop (e.g., 192.168.1.5): "
echo.

echo [1/2] Joining Distributed Database Cluster...
start "SyncMind DB - Replica" cmd /k ".\rqlite\rqlited.exe -node-id node2 -http-addr 0.0.0.0:4001 -raft-addr 0.0.0.0:4002 -join http://%MASTER_IP%:4001 ~\rqlite_data2"
timeout /t 2 /nobreak >nul

echo [2/3] Booting Ollama AI Engine (Compute sharing)...
start "SyncMind AI - Worker Node" cmd /k "set OLLAMA_HOST=0.0.0.0&& ollama serve"
timeout /t 2 /nobreak >nul

echo [3/3] Booting FastAPI Web Server...
start "SyncMind - Web Server" cmd /k "uvicorn main:app --host 0.0.0.0 --port 3000"

echo.
