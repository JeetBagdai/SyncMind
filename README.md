# SyncMind Enterprise Swarm

> **Self-Hosted, Air-Gapped Distributed AI Workbench for Enterprise**

SyncMind is a fully local, agentic AI workbench designed for refineries, PSUs, defense units, and government offices. It runs completely offline and utilizes a **distributed GPU swarm**, ensuring zero data leakage for highly confidential and sensitive knowledge work.

---

## The Problem

Refineries, PSUs, defence-linked manufacturing units, and government offices generate a lot of routine but sensitive knowledge work:
- Approval notes and board presentations
- Engineering calculations and code for internal tools
- Review of scanned drawings (P&IDs) and inspection reports

None of this can go through cloud AI assistants like Claude or Codex because the underlying data is highly classified. While open-weight models are incredibly powerful, there is currently no deployable, agentic assistant built on them that industrial users can seamlessly utilize without compromising security or requiring a massive, centralized supercomputer.

---

## The Solution

SyncMind provides a **self-hosted, air-gapped AI Swarm**. Instead of requiring a massive dedicated server, SyncMind pools the GPU resources of the team's existing laptops and workstations to perform heavy AI inference completely offline.

### Core Architecture

- **Smart Ollama Router (Swarm Load Balancing):** The backend dynamically tracks which laptops on the network are busy or idle, distributing heavy AI calculations across the team's GPUs in real-time.
- **Raft Consensus Database (rqlite):** Uses a distributed, masterless database. All connected laptops share the exact same context, multi-session chat history, and files, ensuring high availability even if a node disconnects.
- **ReAct Agent Loop:** SyncMind plans multi-step work, autonomously deciding when to search internal documents or execute code to solve complex queries.
- **Code Execution Sandbox:** A secure Python subprocess that allows the LLM to write code, execute it locally, and generate real physical deliverables (Excel, Word, Scripts) for the user to download.
- **Dual Workspace Modes (Team & Personal):** Provides users the ability to seamlessly toggle between shared collaborative 'Team' sessions and isolated 'Personal' sessions synced to their unique device ID.
- **Sleek Enterprise UI:** A modern, popup-free Tailwind interface supporting multi-chat sessions, dynamic categories, pinned conversations, and inline prompt editing.

---

## Quick Start (Demo Deployment)

To deploy the SyncMind Swarm for a demo, ensure all laptops are connected to the same local network.

### 1. Launch the Swarm (Leader Node)
On the primary machine, simply double-click the `start_swarm.bat` script. This will automatically:
1. Boot the **rqlite** distributed database.
2. Boot the **Ollama** AI inference engine (bound to the local network).
3. Boot the **FastAPI** Web Server.

### 2. Join the Swarm (Follower Nodes)
On any other team laptops, run:
1. `OLLAMA_HOST=0.0.0.0 ollama serve` (Donates their GPU to the swarm)
2. Add their IP address to the `OLLAMA_NODES` list inside `router.py`.

The UI will be accessible to anyone on the network at `http://<LEADER_IP>:3000`.

---

## License

MIT
