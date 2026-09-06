with open("main.py", "r") as f:
    content = f.read()

target = "from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form, Body"
new_target = "from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form, Body, BackgroundTasks\nimport psutil\nimport signal\nimport asyncio\nimport datetime"

if target in content:
    content = content.replace(target, new_target)
    with open("main.py", "w") as f:
        f.write(content)
    print("Fixed imports")
else:
    print("Could not find target")
