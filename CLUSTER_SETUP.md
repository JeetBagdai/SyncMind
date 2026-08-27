# Distributed Swarm Setup Guide

To run the SyncMind Workbench in its fully distributed, peer-to-peer mode (Smart Load Balancing + Raft Consensus Database), you need to start the underlying engines on your local network.

## 1. Start the Inference Swarm (Ollama)
Ollama handles the GPU processing. We use a custom Python Smart Router to load-balance queries across all available laptops in the swarm.

**On EVERY laptop in your network:**
1. Install [Ollama](https://ollama.com/).
2. Pull the required model:
   ```bash
   ollama pull qwen2.5:1.5b
   ```
3. **CRITICAL:** You must start Ollama so it listens to the network, not just localhost. 
   - **Windows (PowerShell):** `$env:OLLAMA_HOST="0.0.0.0"; ollama serve`
   - **Mac/Linux:** `OLLAMA_HOST=0.0.0.0 ollama serve`

*Note: Once started, make sure you add each laptop's local IP address to the `OLLAMA_NODES` list inside `router.py`!*

## 2. Start the Raft Database (rqlite)
rqlite provides a distributed version of SQLite. This ensures all laptops share the exact same chat history, even if one laptop shuts down.

**On Laptop 1 (The Leader):**
1. Download the [rqlite release](https://github.com/rqlite/rqlite/releases).
2. Start the first node:
   ```bash
   rqlited -node-id node1 ~/node1
   ```
*(This starts the database API on `http://localhost:4001`)*

**On Laptop 2 and Laptop 3 (The Followers):**
1. Start the node and tell it to join Laptop 1 (replace `<LAPTOP_1_IP>` with Laptop 1's actual IP):
   ```bash
   rqlited -node-id node2 -join http://<LAPTOP_1_IP>:4001 ~/node2
   ```

## 3. Run the SyncMind Workbench
Once the Ollama Swarm and rqlite cluster are running, start our FastAPI application on the leader laptop:
```bash
uvicorn main:app --host 0.0.0.0 --port 3000
```

Now, anyone on the Wi-Fi can navigate to `http://<LAPTOP_IP>:3000` and utilize the full power of the distributed GPU swarm and Raft database!
