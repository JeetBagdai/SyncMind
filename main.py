from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, Form, Body
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import json
import base64
import os
import shutil
from context import ContextStore
from document_processor import DocumentProcessor
from rag.search import add_document_to_rag
from network_monitor import install_network_monitor, network_log
import router

# Install the air-gap monitor before anything else starts
install_network_monitor()

app = FastAPI()
store = ContextStore()

# Track all connected LAN clients: dict mapping chat_id -> list of websockets
clients_by_chat = {}

async def broadcast(chat_id: str, message: dict):
    if chat_id not in clients_by_chat:
        return
    disconnected = []
    for client in clients_by_chat[chat_id]:
        try:
            await client.send_text(json.dumps(message))
        except:
            disconnected.append(client)
    for c in disconnected:
        clients_by_chat[chat_id].remove(c)

@app.get("/api/chats")
def get_chats(owner_id: str = "TEAM"):
    return store.get_all_chats(owner_id=owner_id)

@app.post("/api/chats")
def create_chat(body: dict = Body(default={})):
    title = body.get("title", "New Chat")
    category = body.get("category", "Recents")
    owner_id = body.get("owner_id", "TEAM")
    chat_id = store.create_chat(title=title, category=category, owner_id=owner_id, chat_id=body.get("id"))
    return {"id": chat_id}

@app.put("/api/chats/{chat_id}")
def update_chat(chat_id: str, body: dict = Body(...)):
    store.update_chat(
        chat_id=chat_id, 
        title=body.get("title"), 
        category=body.get("category"), 
        is_pinned=body.get("is_pinned")
    )
    return {"status": "ok"}

@app.delete("/api/chats/{chat_id}")
def delete_chat(chat_id: str):
    store.delete_chat(chat_id)
    return {"status": "ok"}

@app.post("/api/upload/{chat_id}")
async def upload_file(chat_id: str, file: UploadFile = File(...)):
    """Uploads a file, processes it through OCR/extraction, and adds to RAG context."""
    os.makedirs("data/uploads", exist_ok=True)
    file_path = os.path.join("data/uploads", file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    extracted_text = await DocumentProcessor.process_file(file_path)
    if extracted_text and not extracted_text.startswith("Error"):
        add_document_to_rag(extracted_text, filename=file.filename, chat_id=chat_id)
        
    return {"filename": file.filename, "path": file_path, "status": "processed"}

@app.get("/api/network-log")
def get_network_log():
    """Returns the rolling log of intercepted network calls to prove air-gapped isolation."""
    return network_log

@app.get("/api/swarm-status")
def get_swarm_status():
    """Returns the current status of all nodes in the Ollama swarm."""
    nodes = []
    for node in router.OLLAMA_NODES:
        nodes.append({
            "node": node,
            "name": router.OLLAMA_NODES[node]["name"],
            "status": "busy" if router.node_active[node] > 0 else "idle",
            "active_tasks": router.node_active[node],
            "last_task": router.node_last_task[node],
            "model": router.node_models[node],
            "requests": router.node_requests[node]
        })
    return {"nodes": nodes}

@app.get("/download")
async def download_file(path: str):
    if os.path.exists(path):
        filename = os.path.basename(path)
        return FileResponse(path, filename=filename)
    return {"error": "File not found"}

@app.websocket("/ws/{chat_id}")
async def websocket_endpoint(websocket: WebSocket, chat_id: str):
    await websocket.accept()
    if chat_id not in clients_by_chat:
        clients_by_chat[chat_id] = []
    clients_by_chat[chat_id].append(websocket)
    
    # Send history to the newly connected user
    history = store.get_history(chat_id, limit=50)
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
                image_b64 = payload.get("image_b64")
                
                # Broadcast user message to ALL connected team members in this chat
                await broadcast(chat_id, {
                    "type": "message",
                    "message": {"role": "user", "content": user_msg}
                })
                
                async def stream_callback(msg_type: str, content: str):
                    await broadcast(chat_id, {
                        "type": msg_type,
                        "content": content
                    })
                    
                requested_model = payload.get("model", "Auto")
                final_answer = await store.run_agent_loop(
                    chat_id=chat_id,
                    user_prompt=user_msg, 
                    image_b64=image_b64, 
                    stream_callback=stream_callback,
                    requested_model=requested_model
                )
                
                await broadcast(chat_id, {
                    "type": "message",
                    "message": {"role": "assistant", "content": final_answer}
                })
                
    except WebSocketDisconnect:
        if chat_id in clients_by_chat and websocket in clients_by_chat[chat_id]:
            clients_by_chat[chat_id].remove(websocket)
    except Exception as e:
        print(f"WebSocket Error: {e}")
        if chat_id in clients_by_chat and websocket in clients_by_chat[chat_id]:
            clients_by_chat[chat_id].remove(websocket)

# Mount static files for the dashboard
app.mount("/", StaticFiles(directory="static", html=True), name="static")