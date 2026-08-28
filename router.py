import httpx
import asyncio
import random

# List of all laptops in the swarm. Add team IP addresses here.
OLLAMA_NODES = [
    "http://127.0.0.1:11434",
    # e.g., "http://192.168.1.15:11434",
    # e.g., "http://192.168.1.22:11434",
]

# Track which laptops are currently processing a heavy query
node_status = {node: "idle" for node in OLLAMA_NODES}

TEXT_MODEL = "qwen2.5:7b" 
VISION_MODEL = "llava"

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
    model = VISION_MODEL if use_vision else TEXT_MODEL
    node = await get_available_node()
    
    # Mark this node as busy so other concurrent requests go elsewhere
    node_status[node] = "busy"
    
    if stream_callback:
        # Show off the load balancing in the UI
        await stream_callback("status", f"Swarm Load Balancer: Routing compute task to {node} [Status: IDLE]")
        
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
