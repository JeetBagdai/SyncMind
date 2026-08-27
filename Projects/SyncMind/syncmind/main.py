from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import json
import base64
import os
from context import ContextStore

app = FastAPI()
store = ContextStore()

# Track all connected LAN clients for multi-user broadcasting
clients: list[WebSocket] = []

async def broadcast(message: dict):
    disconnected = []
    for client in clients:
        try:
            await client.send_text(json.dumps(message))
        except:
            disconnected.append(client)
    for c in disconnected:
        clients.remove(c)

@app.get("/download")
async def download_file(path: str):
    if os.path.exists(path):
        filename = os.path.basename(path)
        return FileResponse(path, filename=filename)
    return {"error": "File not found"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    
    # Send history to the newly connected user
    history = store.get_history(limit=50)
    await websocket.send_text(json.dumps({
        "type": "history",
        "messages": history
    }))
    
    try:
        while True:
            data = await websocket.receive_text()
            payload = json.loads(data)
            
            if payload.get("type") == "query":
                user_msg = payload.get("message")
                image_b64 = payload.get("image_b64") # Optional
                
                # Broadcast user message to ALL connected team members
                await broadcast({
                    "type": "message",
                    "message": {"role": "user", "content": user_msg}
                })
                
                # Callback to stream thoughts back to ALL team members
                async def stream_callback(msg_type: str, content: str):
                    await broadcast({
                        "type": msg_type,
                        "content": content
                    })
                    
                # Run the agent loop
                final_answer = await store.run_agent_loop(
                    user_prompt=user_msg, 
                    image_b64=image_b64, 
                    stream_callback=stream_callback
                )
                
                # Broadcast final AI message to ALL connected team members
                await broadcast({
                    "type": "message",
                    "message": {"role": "assistant", "content": final_answer}
                })
                
    except WebSocketDisconnect:
        if websocket in clients:
            clients.remove(websocket)
    except Exception as e:
        print(f"WebSocket Error: {e}")
        if websocket in clients:
            clients.remove(websocket)

# Mount static files for the dashboard
app.mount("/", StaticFiles(directory="static", html=True), name="static")