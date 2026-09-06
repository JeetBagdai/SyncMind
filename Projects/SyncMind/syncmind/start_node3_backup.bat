@echo off
echo ===================================================
echo   SyncMind Swarm - NODE 3 (BACKUP / LOW-SPEC)
echo   Hardware: i5 7th Gen, GeForce 940MX
echo ===================================================

echo ===================================================
echo   Verifying System Dependencies...
echo ===================================================
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

echo Note: The 940MX GPU is too weak to run Ollama efficiently.
echo Including it in the AI pool would severely bottleneck the entire team.
echo Therefore, this laptop is strictly configured as a HIGH-AVAILABILITY DATABASE NODE.
echo It ensures no chat logs or files are ever lost if the Master goes offline.
echo.
set /p MASTER_IP="Enter the IP address of the Master Laptop (e.g., 192.168.1.5): "
echo.

echo [1/2] Joining Distributed Database Cluster (Data Vault)...
start "SyncMind DB - Backup Data Vault" cmd /k ".\rqlite\rqlited.exe -node-id node3 -http-addr 0.0.0.0:4001 -raft-addr 0.0.0.0:4002 -join http://%MASTER_IP%:4001 ~\rqlite_data3"
timeout /t 2 /nobreak >nul

echo [2/2] Booting FastAPI Web Server...
start "SyncMind - Web Server" cmd /k "uvicorn main:app --host 0.0.0.0 --port 3000"

echo.
