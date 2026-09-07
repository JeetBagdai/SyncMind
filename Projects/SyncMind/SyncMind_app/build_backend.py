import os
import sys
import shutil
import subprocess

SRC_DIR = r"C:\Users\Jeet\Desktop\Projects\SyncMind\syncmind"
APP_DIR = r"C:\Users\Jeet\Desktop\Projects\SyncMind\SyncMind_app"
BACKEND_DIR = os.path.join(APP_DIR, "backend_src")

print("1. Creating backend_src directory...")
os.makedirs(BACKEND_DIR, exist_ok=True)

print("2. Copying Python files...")
files_to_copy = ["main.py", "router.py", "context.py", "document_processor.py", "requirements.txt"]
for f in files_to_copy:
    src_path = os.path.join(SRC_DIR, f)
    if os.path.exists(src_path):
        shutil.copy(src_path, os.path.join(BACKEND_DIR, f))

# Also copy 'rag' folder
rag_src = os.path.join(SRC_DIR, "rag")
rag_dst = os.path.join(BACKEND_DIR, "rag")
if os.path.exists(rag_src):
    if os.path.exists(rag_dst):
        shutil.rmtree(rag_dst)
    shutil.copytree(rag_src, rag_dst)

# Also copy 'sandbox' folder
sandbox_src = os.path.join(SRC_DIR, "sandbox")
sandbox_dst = os.path.join(BACKEND_DIR, "sandbox")
if os.path.exists(sandbox_src):
    if os.path.exists(sandbox_dst):
        shutil.rmtree(sandbox_dst)
    shutil.copytree(sandbox_src, sandbox_dst)

# Also copy 'rqlite' binaries (ignoring data)
rqlite_src = os.path.join(SRC_DIR, "rqlite")
rqlite_dst = os.path.join(BACKEND_DIR, "rqlite")
if not os.path.exists(rqlite_dst):
    os.makedirs(rqlite_dst)
for f in os.listdir(rqlite_src):
    if f.endswith(".exe"):
        shutil.copy(os.path.join(rqlite_src, f), os.path.join(rqlite_dst, f))

# Also copy 'static' folder for dashboard
static_src = os.path.join(SRC_DIR, "static")
static_dst = os.path.join(BACKEND_DIR, "static")
if os.path.exists(static_src):
    if os.path.exists(static_dst):
        shutil.rmtree(static_dst)
    shutil.copytree(static_src, static_dst)

print("3. Creating PyInstaller entry point...")
entry_point = """
import main
import uvicorn
import multiprocessing
import subprocess
import os
import sys

if __name__ == "__main__":
    multiprocessing.freeze_support()
    
    # Auto-spawn bundled rqlite daemon
    base_dir = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
    rqlited_path = os.path.join(base_dir, 'rqlite', 'rqlited.exe')
    data_dir = os.path.join(os.path.expanduser('~'), 'rqlite_data')
    try:
        subprocess.Popen([rqlited_path, '-node-id', 'node1', data_dir], 
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception as e:
        print(f"Warning: Failed to start rqlited.exe: {e}")

    uvicorn.run(main.app, host="0.0.0.0", port=8000, reload=False)
"""
with open(os.path.join(BACKEND_DIR, "run_server.py"), "w", encoding="utf-8") as f:
    f.write(entry_point)

print("4. Setting up virtual environment...")
subprocess.run([sys.executable, "-m", "venv", "venv"], cwd=BACKEND_DIR)
pip_exe = os.path.join(BACKEND_DIR, "venv", "Scripts", "pip.exe")
pyinstaller_exe = os.path.join(BACKEND_DIR, "venv", "Scripts", "pyinstaller.exe")

print("5. Installing dependencies...")
subprocess.run([pip_exe, "install", "-r", "requirements.txt"], cwd=BACKEND_DIR)
subprocess.run([pip_exe, "install", "pyinstaller"], cwd=BACKEND_DIR)

print("6. Building executable with PyInstaller...")
# We use --onedir", "--noconfirm to make startup faster and avoid extraction issues with large AI libraries
cmd = [
    pyinstaller_exe,
    "--name", "syncmind_backend",
    "--onedir", "--noconfirm",
    "--hidden-import", "passlib.handlers.bcrypt",
    "--add-data", f"rqlite;rqlite",
    "--add-data", f"rag;rag",
    "--add-data", f"static;static",
    "run_server.py"
]
subprocess.run(cmd, cwd=BACKEND_DIR)
print("Build Complete! The compiled backend is in SyncMind_app/backend_src/dist/syncmind_backend")
