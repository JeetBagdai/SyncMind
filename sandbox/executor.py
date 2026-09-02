import os
import subprocess
import tempfile
import uuid
import shutil

class SandboxExecutor:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.workspace_dir = os.path.join(self.base_dir, "workspace")
        self.data_dir = os.path.join(os.path.dirname(self.base_dir), "data")
        os.makedirs(self.workspace_dir, exist_ok=True)
        
    def execute_python(self, code: str) -> dict:
        """
        Executes python code in an isolated workspace.
        Returns the stdout, stderr, and any newly generated files.
        """
        # Create a unique run folder to avoid conflicts
        run_id = str(uuid.uuid4())[:8]
        run_dir = os.path.join(self.workspace_dir, f"run_{run_id}")
        os.makedirs(run_dir, exist_ok=True)
        
        # Copy any uploaded/demo files to the sandbox so they can be referenced locally
        if os.path.exists(self.data_dir):
            for item in os.listdir(self.data_dir):
                s = os.path.join(self.data_dir, item)
                d = os.path.join(run_dir, item)
                if os.path.isfile(s):
                    shutil.copy2(s, d)
                elif os.path.isdir(s) and item == "uploads":
                    # Copy uploaded files into root of sandbox too
                    for up_item in os.listdir(s):
                        up_s = os.path.join(s, up_item)
                        up_d = os.path.join(run_dir, up_item)
                        if os.path.isfile(up_s):
                            shutil.copy2(up_s, up_d)
        
        script_path = os.path.join(run_dir, "agent_script.py")
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(code)
            
        import sys

        # Track file modification times before execution
        before_files = {}
        for root, dirs, files in os.walk(run_dir):
            for file in files:
                p = os.path.join(root, file)
                before_files[p] = os.path.getmtime(p)

        try:
            # Run the script with cwd set to the run_dir
            # This ensures any relative file writes stay in the run_dir
            process = subprocess.Popen(
                [sys.executable, "agent_script.py"],
                cwd=run_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = process.communicate(timeout=30)
            
            generated_files = []
            for root, dirs, files in os.walk(run_dir):
                for file in files:
                    # Ignore the agent script itself
                    if file == "agent_script.py" and root == run_dir:
                        continue
                        
                    src_path = os.path.join(root, file)
                    # Include if new file or modified
                    if src_path not in before_files or os.path.getmtime(src_path) > before_files[src_path]:
                        final_path = os.path.join(self.data_dir, "uploads", os.path.basename(file))
                        os.makedirs(os.path.dirname(final_path), exist_ok=True)
                        shutil.copy2(src_path, final_path)
                        generated_files.append(final_path)
                    
            return {
                "status": "success" if process.returncode == 0 else "error",
                "stdout": stdout,
                "stderr": stderr,
                "generated_files": generated_files,
                "run_dir": run_dir
            }
            
        except subprocess.TimeoutExpired:
            process.kill()
            return {
                "status": "error",
                "stdout": "",
                "stderr": "Timeout exceeded (30 seconds).",
                "generated_files": [],
                "run_dir": run_dir
            }
        except Exception as e:
            return {
                "status": "error",
                "stdout": "",
                "stderr": str(e),
                "generated_files": [],
                "run_dir": run_dir
            }

if __name__ == "__main__":
    executor = SandboxExecutor()
    code = """
import os
print("Hello from sandbox!")
with open("test.txt", "w") as f:
    f.write("This is a generated file.")
"""
    result = executor.execute_python(code)
    print("Result:", result)
