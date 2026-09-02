import httpx
import asyncio
import re

# Tier 1 = Most Powerful (RTX 4050, etc.)
# Tier 2 = Medium (Mid-Spec Laptops)
# Tier 3 = Low Power (e.g. 940MX, Integrated graphics)
OLLAMA_NODES = {
    "http://127.0.0.1:11434": {
        "tier": 1, 
        "name": "Node 1 (RTX 4050)", 
        "max_capability": 3 # 3=Heavy, 2=Mid, 1=Light
    },
    # "http://192.168.1.15:11434": {
    #     "tier": 2, 
    #     "name": "Node 2 (Mid-Spec)", 
    #     "max_capability": 2 
    # },
    # "http://192.168.1.22:11434": {
    #     "tier": 3, 
    #     "name": "Node 3 (940MX)", 
    #     "max_capability": 1
    # }
}

# Dynamic tracking
node_active = {node: 0 for node in OLLAMA_NODES}
node_last_task = {node: "NONE" for node in OLLAMA_NODES}
node_models = {node: "NONE" for node in OLLAMA_NODES}
node_requests = {node: 0 for node in OLLAMA_NODES} # lifetime requests handled

TEXT_MODEL = "qwen2.5:7b" 
VISION_MODEL = "llava"
CODER_MODEL = "qwen2.5-coder:7b"
LIGHT_MODEL = "qwen2.5:1.5b" # Light model specifically for weak nodes

# Map models to their required capability tier
MODEL_TIERS = {
    VISION_MODEL: 3, # Heavy
    CODER_MODEL: 3,  # Heavy
    TEXT_MODEL: 2,   # Mid
    LIGHT_MODEL: 1   # Light
}

def classify_task(prompt: str, has_image: bool):
    """
    Intelligently classifies the task based on prompt keywords and image presence.
    Returns (model, task_type, reason, sys_prompt_modifier).
    """
    if has_image:
        return VISION_MODEL, "VISION", "Image attached", None

    prompt_lower = prompt.lower()
    
    # Check for basic greetings or very short queries to offload to the 940MX / weak nodes!
    light_keywords = ["hello", "hi", "hey", "ping", "test", "thanks", "good"]
    if len(prompt.split()) < 5 and any(kw in prompt_lower for kw in light_keywords):
        return LIGHT_MODEL, "GREETING", "Short/Basic query detected", "You are a helpful assistant. Keep your answer brief."

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

async def get_available_node(model: str):
    """
    Tiered Capability Routing:
    1. Filters nodes to ensure they have enough GPU capability for the model.
    2. Prefers IDLE nodes.
    3. Always prioritizes the lowest Tier (Most Powerful) node available to ensure max speed.
    4. If all capable nodes are busy, queues on the most powerful capable node with the fewest active tasks.
    """
    required_capability = MODEL_TIERS.get(model, 3) # default to heavy if unknown
    
    # Step 1: Filter capable nodes
    capable_nodes = [n for n in OLLAMA_NODES if OLLAMA_NODES[n]["max_capability"] >= required_capability]
    
    if not capable_nodes:
        # Fallback: if no node is capable enough (e.g. only 940MX is online), we MUST route it to the best available
        # Pick the most powerful node currently alive regardless of capability
        capable_nodes = list(OLLAMA_NODES.keys())
        
    # Step 2: Look for IDLE capable nodes
    idle_capable = [n for n in capable_nodes if node_active[n] == 0]
    
    if idle_capable:
        # Step 3: Sort by Tier (1 is best) to guarantee we use the RTX 4050 if it's sitting empty!
        idle_capable.sort(key=lambda x: OLLAMA_NODES[x]["tier"])
        return idle_capable[0]
        
    # Step 4: All capable nodes are busy. 
    # Pick the capable node with the fewest active tasks, breaking ties by choosing the most powerful tier.
    capable_nodes.sort(key=lambda x: (node_active[x], OLLAMA_NODES[x]["tier"]))
    return capable_nodes[0]

async def call_llm(messages: list, use_vision: bool = False, temperature: float = 0.2, stream_callback=None, stop: list = None, requested_model: str = "Auto") -> str:
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
    
    # Override if user explicitly selected a model
    if requested_model and requested_model != "Auto":
        model = requested_model
        task_type = "MANUAL_OVERRIDE"
        reason = "User explicitly selected this model"
    
    # If there's a system modifier, inject it into the first system message
    if sys_modifier and messages and messages[0]["role"] == "system":
        new_messages = []
        for i, m in enumerate(messages):
            if i == 0 and m["role"] == "system":
                new_messages.append({"role": "system", "content": m["content"] + "\n\n" + sys_modifier})
            else:
                new_messages.append(dict(m))
        messages = new_messages

    node = await get_available_node(model)
    node_name = OLLAMA_NODES[node]["name"]
    
    # Update status for Swarm UI
    node_active[node] += 1
    node_last_task[node] = task_type
    node_models[node] = model
    node_requests[node] += 1
    
    if stream_callback:
        # Show off the load balancing and intelligent routing in the UI
        await stream_callback("status", f"Swarm: Routed to {node_name} | Task: {task_type} | Model: {model} ({reason})")
        
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
        return f"Error communicating with swarm node {node_name} ({model}): {str(e)}"
    finally:
        # Free up the node once generation is complete
        node_active[node] -= 1
