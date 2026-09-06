import httpx
import asyncio
from datetime import datetime
from urllib.parse import urlparse

# We'll patch httpx.AsyncClient to track all requests
original_send = httpx.AsyncClient.send

network_log = []
MAX_LOGS = 50

# Allow localhost/127.0.0.1 and Ollama swarm nodes.
# Ollama nodes will be dynamically loaded from router.py, but for isolation we'll just parse them.
from router import OLLAMA_NODES

def is_allowed_destination(url):
    parsed = urlparse(str(url))
    host = parsed.hostname
    
    if host in ["127.0.0.1", "localhost", "0.0.0.0"]:
        return True
        
    for node in OLLAMA_NODES:
        if host in node:
            return True
            
    return False

def add_log_entry(url, method, status):
    global network_log
    entry = {
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "url": str(url),
        "method": method,
        "status": status
    }
    network_log.insert(0, entry)
    if len(network_log) > MAX_LOGS:
        network_log = network_log[:MAX_LOGS]

async def patched_send(self, request, *args, **kwargs):
    url = request.url
    method = request.method
    
    if is_allowed_destination(url):
        add_log_entry(url, method, "(internal access call)")
        return await original_send(self, request, *args, **kwargs)
    else:
        add_log_entry(url, method, "BLOCKED (Air-Gapped Policy)")
        # In a real air-gapped system, it wouldn't even have DNS, but we hard-block it here
        # so it acts as proof of isolation.
        raise httpx.ConnectError(f"Air-Gapped Isolation Error: Outbound connection to {url} blocked by SyncMind Sovereign Policy.")

def install_network_monitor():
    httpx.AsyncClient.send = patched_send
    print("Network monitor installed. External calls are now blocked.")
