@echo off
echo ===================================================
echo   SyncMind Swarm - NODE 1 (MASTER / HIGH-SPEC)
echo   Hardware: Ryzen 7 8845HS, 16GB RAM, RTX 4050
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

echo This is the powerhouse. It runs the Web Server, the Master Database, and the heavy AI models.
echo.

echo [1/3] Booting Rqlite Database (Leader)...
start "SyncMind DB - Leader" cmd /k ".\rqlite\rqlited.exe -node-id node1 -http-addr 0.0.0.0:4001 -raft-addr 0.0.0.0:4002 ~\rqlite_data"
timeout /t 2 /nobreak >nul

echo [2/3] Booting Ollama AI Engine (GPU Inference)...
start "SyncMind AI - GPU Node" cmd /k "set OLLAMA_HOST=0.0.0.0&& ollama serve"
timeout /t 2 /nobreak >nul

echo [3/3] Booting FastAPI Web Server...
start "SyncMind - Web Server" cmd /k "uvicorn main:app --host 0.0.0.0 --port 3000"

echo.
