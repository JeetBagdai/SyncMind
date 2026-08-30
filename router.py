import httpx
import asyncio
import random
import re

# List of all laptops in the swarm. Add team IP addresses here.
OLLAMA_NODES = [
    "http://127.0.0.1:11434",
    # e.g., "http://192.168.1.15:11434",
    # e.g., "http://192.168.1.22:11434",
]

# Track which laptops are currently processing a heavy query
# Values can be: "idle", "busy", etc.
node_status = {node: "idle" for node in OLLAMA_NODES}
# Track what is currently running on the node for the UI Swarm Status
node_last_task = {node: "NONE" for node in OLLAMA_NODES}
node_models = {node: "NONE" for node in OLLAMA_NODES}
node_requests = {node: 0 for node in OLLAMA_NODES}

TEXT_MODEL = "qwen2.5:7b" 
VISION_MODEL = "llava"
CODER_MODEL = "qwen2.5-coder:7b"

def classify_task(prompt: str, has_image: bool):
    """
    Intelligently classifies the task based on prompt keywords and image presence.
    Returns (model, task_type, reason, sys_prompt_modifier).
    """
    if has_image:
        return VISION_MODEL, "VISION", "Image attached", None

    prompt_lower = prompt.lower()
    
    code_keywords = ["write", "fix", "debug", "code", "function", "script", "python", "error", "bug", "compile", "class", "loop", "algorithm"]
    if any(re.search(r'\b' + kw + r'\b', prompt_lower) for kw in code_keywords):
        return CODER_MODEL, "CODING", "Code-related keywords detected", None
        
    doc_keywords = ["summarize", "report", "extract", "findings", "approval", "note", "draft", "review", "meeting", "minutes", "inspection", "manual", "sop", "procedure"]
    if any(re.search(r'\b' + kw + r'\b', prompt_lower) for kw in doc_keywords):
        return TEXT_MODEL, "DOCUMENT", "Document-related keywords detected", "You are an expert technical writer and document reviewer. Format your output clearly and formally for enterprise use."
        
    calc_keywords = ["calculate", "compute", "estimate", "formula", "units", "pressure", "flow", "temperature", "efficiency"]
    if any(re.search(r'\b' + kw + r'\b', prompt_lower) for kw in calc_keywords):
        return TEXT_MODEL, "CALCULATION", "Calculation/Math keywords detected", "You are an expert engineer. Be extremely precise with calculations, formulas, and units. Show your step-by-step mathematical reasoning."
        
    return TEXT_MODEL, "GENERAL", "Default task classification", None

async def get_available_node():
    """Returns an idle node from the swarm. If all busy, falls back to a random node."""
    idle_nodes = [node for node, status in node_status.items() if status == "idle"]
    if idle_nodes:
        return random.choice(idle_nodes)
    return random.choice(OLLAMA_NODES) 

async def call_llm(messages: list, use_vision: bool = False, temperature: float = 0.2, stream_callback=None, stop: list = None) -> str:
    """
    Routes the request to the smartest available node in the Ollama swarm.
    """
    # Extract the TRUE user prompt (ignore ReAct tool observations)
    user_prompt = ""
    for msg in reversed(messages):
        if msg["role"] == "user" and not msg["content"].startswith("Observation:"):
            user_prompt = msg["content"]
            break
            
    # Intelligent model selection
    model, task_type, reason, sys_modifier = classify_task(user_prompt, use_vision)
    
    # If there's a system modifier, inject it into the first system message
    if sys_modifier and messages and messages[0]["role"] == "system":
        # Create a deep copy to avoid modifying the original list for subsequent loops
        new_messages = []
        for i, m in enumerate(messages):
            if i == 0 and m["role"] == "system":
                new_messages.append({"role": "system", "content": m["content"] + "\n\n" + sys_modifier})
            else:
                new_messages.append(dict(m))
        messages = new_messages

    node = await get_available_node()
    
    # Update status for Swarm UI
    node_status[node] = "busy"
    node_last_task[node] = task_type
    node_models[node] = model
    node_requests[node] += 1
    
    if stream_callback:
        # Show off the load balancing and intelligent routing in the UI
        await stream_callback("status", f"Swarm: Routed to {node} | Task: {task_type} | Model: {model} ({reason})")
        
    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {
            "temperature": temperature
        }
    }
    
    if stop:
        payload["options"]["stop"] = stop

    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            response = await client.post(
                f"{node}/api/chat",
                json=payload
            )
            response.raise_for_status()
            result = response.json()
            return result["message"]["content"]
    except Exception as e:
        print(f"Swarm Error on {node}: {e}")
        return f"Error communicating with swarm node {node} ({model}): {str(e)}"
    finally:
        # Free up the node once generation is complete
        node_status[node] = "idle"
