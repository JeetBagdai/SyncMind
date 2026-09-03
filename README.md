# SyncMind: Product Overview & Technical Breakdown

## 1. General Product Overview

**SyncMind** is an advanced, enterprise-grade AI assistant platform designed to execute complex, multi-step tasks autonomously. Unlike standard conversational chatbots that simply return text, SyncMind operates as an **agentic system**. It is capable of writing, executing, and iterating on its own code in a secure sandbox to solve problems, analyze documents, process data, and generate tangible deliverables (like Word documents or Excel sheets).

The platform is designed with a strong emphasis on **transparency and collaboration**. Users can peer into the AI's "brain" in real-time to watch its reasoning and code execution. Furthermore, the platform supports seamless local-network collaboration, allowing entire teams to watch an agent solve a problem live, while also providing secure, isolated private workspaces for individual tasks.

---

## 2. In-Depth Feature & Functionality Breakdown

### A. The Agentic Sandbox (Code Execution Engine)
At the heart of SyncMind is its ability to take action. When faced with a complex task (e.g., "Analyze this PDF and generate a report"), the LLM does not just guess the answer—it writes a Python script to do the work.

*   **How it Works:** 
    1. The LLM outputs a special `<run_python>` tag containing the code it wants to execute.
    2. The backend (`sandbox/executor.py`) intercepts this tag and provisions a temporary, isolated workspace directory (e.g., `sandbox/workspace/run_a1b2c3/`).
    3. Any files the user uploaded are securely copied into this directory.
    4. The Python script is executed as a subprocess. 
    5. The engine captures the standard output (`stdout`), errors (`stderr`), and monitors the directory for any new files created by the script.
    6. This data is fed back to the LLM as an `<observation>`, allowing it to fix errors if the code crashed, or finalize its response if it succeeded.

### B. Real-Time Telemetry: Agent Log
SyncMind strips away the "black box" of AI. The **Agent Log** tab provides a retro-terminal interface that streams the AI's internal state machine live.

*   **How it Works:** The backend parses the LLM's raw stream and categorizes the tokens into `thought` (reasoning), `action` (code execution), and `observation` (system feedback). These state changes are blasted over a WebSocket connection to the frontend, which renders them sequentially. This allows users to audit exactly *how* the AI arrived at a conclusion.

### C. The Workspace (File Harvesting)
When the AI generates a deliverable (like an `.xlsx` data summary or a `.docx` approval note), users need a clean way to access it without digging through chat logs.

*   **How it Works:** After a sandbox execution finishes, the backend harvests any newly created files and broadcasts a `Generated Files:` payload over the WebSocket. The frontend listens for this payload and populates the **Workspace Tab**. This tab acts as a localized file explorer for the current chat session, providing direct HTTP `GET /download` links to retrieve the artifacts securely from the backend's sandbox directories.

### D. Team vs. Personal Workspaces (Network Isolation)
SyncMind natively supports LAN collaboration without requiring a cloud database. 

*   **Team Workspaces:** When a user clicks `+ Team`, the backend registers the chat with `owner_id = 'TEAM'`. When any user on the local network loads the app, the frontend fetches all TEAM chats. Because the WebSockets are bound dynamically to the `activeConvId`, multiple users can open the same Team chat and watch the AI's cursor stream live simultaneously.
*   **Personal Workspaces:** When a user clicks `+ Personal`, the frontend associates the chat with a unique, persistent `deviceId` (stored in the browser's `localStorage`). The backend strictly filters the `GET /api/chats` endpoint, ensuring that a user's browser only downloads Personal chats matching their exact `deviceId`. The WebSocket channels and resulting generated files are completely invisible to the rest of the network.

### E. Multimodal Capabilities
SyncMind is not limited to text. The frontend supports rich drag-and-drop file attachments.

*   **How it Works:** When a user attaches a file (Image, PDF, CSV, etc.) and hits send, the frontend fires a `POST /api/upload/{chat_id}` request. The backend stages this file. When the LLM processes the prompt, it can use Python libraries (`pdfplumber`, `pandas`, `PIL`, or OCR tools) inside the Sandbox to physically open, read, and interpret the user's files to achieve tasks like Document Intelligence or Visual Engineering extraction.

### F. The Frontend Architecture (UI/UX)
The UI is built in React using Vite and TailwindCSS, prioritizing a cinematic, high-performance user experience.

*   **Fluid Animations:** Powered by GSAP (GreenSock) and Anime.js, the UI features smooth staggered reveals, blurred entry transitions for new messages, and satisfying bouncy interactions for buttons.
*   **Dynamic Loading:** While the AI is processing its sandbox operations, a custom CSS `@keyframes` pulsing circle animation anchors the chat, providing immediate visual feedback that the swarm is actively computing.
*   **Responsive Sidebar:** A retractable sidebar manages the chat histories, organizing them cleanly into groups while allowing users to dynamically rename or pin important conversations.

---

## 3. The Execution Flow (Step-by-Step Example)

If a user clicks the **"Demo C: Multimodal Engineering"** button:
1. The frontend pre-fills the chat input with the exact prompt and sends a WebSocket `query` payload to `ws://[host]/ws/[chat_id]`.
2. The frontend activates the pulsing circle animation (`isThinking`).
3. The backend receives the prompt, injects the system context (CRITICAL RULES), and queries the LLM.
4. The LLM streams its initial `<thought>` process, which the backend routes to the Agent Log in the UI.
5. The LLM writes a Python script to analyze `sample_diagram.png` and generate an equipment list. It streams this inside an `<action>` block.
6. The backend suspends the LLM, runs the Python code in the Sandbox, and captures the resulting `.docx` file.
7. The backend sends the file paths to the frontend, which instantly updates the Workspace tab.
8. The LLM streams its final conversational response to the user, the pulsing circle disappears, and the user downloads their final document.

### G. Intelligent Swarm Routing
The backend employs a semantic load balancer (router.py) to classify incoming prompts and route them to the most capable model in the local Swarm network.
*   **GENERAL Tasks:** Routed to qwen2.5:7b.
*   **CODING Tasks:** Routed to qwen2.5-coder:7b (a specialized coding variant) for complex python execution.
*   **QUICK Tasks:** Routed to qwen2.5:1.5b for fast, lightweight responses.

### H. Robust File Tracking (mtime)
The executor.py sandbox uses a foolproof filesystem modification timestamp (mtime) tracker to capture generated files. By taking a snapshot of all file timestamps before execution and comparing them afterward, the backend accurately pushes overwritten or newly created files directly to the Workspace tab, completely avoiding name-collision bugs.

---

## 4. Installation & Quick Start

SyncMind now includes automated batch scripts for seamless zero-configuration setup and node clustering on Windows.

### First-Time Setup
Simply double-click the **`install_syncmind.bat`** file.
This script will automatically:
- Download and install Python (if missing)
- Setup an isolated Python Virtual Environment
- Install all backend dependencies (FastAPI, WebSockets, Pandas, etc.)
- Compile the Vite/React frontend into static assets
- Clean and prepare the SQLite database

### Starting the Cluster
You can launch individual nodes or the entire swarm depending on your hardware:

*   **`start_node1_master.bat`**: Boots the primary frontend server and the master backend node on `localhost:3000`. Run this on your main machine.
*   **`start_node2_worker.bat`**: Boot this on a secondary machine on your network to act as a worker node (handles code execution and AI tasks remotely).
*   **`start_node3_backup.bat`**: Boot this on a third machine to act as a failover/backup node.
*   **`start_swarm.bat`**: Run this on a powerful workstation to simulate a multi-node cluster locally for testing and development.
