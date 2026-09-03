@echo off
setlocal
echo ===================================================
echo   SyncMind Pre-requisite Installer for Fresh Systems
echo ===================================================
echo.

:: Check for winget
where winget >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] 'winget' is not installed or accessible. 
    echo Please install Python 3.10+ and Ollama manually, then run this script again.
    pause
    exit /b
)

:: Install Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [1/4] Python not found. Installing Python...
    winget install --id Python.Python.3.11 --exact --source winget --accept-package-agreements --accept-source-agreements
    echo Python installed. Please restart this script or your terminal to refresh PATH variables.
    pause
    exit /b
) else (
    echo [1/4] Python is already installed.
)

:: Install Ollama
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [2/4] Ollama not found. Installing Ollama...
    winget install Ollama -e --accept-package-agreements --accept-source-agreements
    echo Ollama installed. Please restart this script or your terminal to refresh PATH variables.
    pause
    exit /b
) else (
    echo [2/4] Ollama is already installed.
)

:: Install Python Requirements
echo.
echo [3/4] Installing Python requirements from requirements.txt...
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies.
    pause
    exit /b
)

:: Pull Ollama Models
echo.
echo [4/4] Downloading required AI models (This may take a while depending on internet speed)...
ollama pull qwen2.5:7b
ollama pull qwen2.5-coder:7b
ollama pull qwen2.5:1.5b

echo.
echo ===================================================
echo   SUCCESS! All libraries and tools are installed.
echo   You can now run your node start script (e.g. start_node2_worker.bat)
echo ===================================================
pause
