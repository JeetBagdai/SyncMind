document.addEventListener('DOMContentLoaded', () => {
    // ---- UI & Animations ----
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Tab Switching with GSAP
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-target');
            
            // Highlight active tab
            tabBtns.forEach(b => {
                b.classList.remove('text-white', 'border-b-2', 'border-white');
                b.classList.add('text-zinc-400');
            });
            btn.classList.add('text-white', 'border-b-2', 'border-white');
            btn.classList.remove('text-zinc-400');

            // Animate out current
            const current = document.querySelector('.tab-content.active');
            if (current && current.id !== targetId) {
                gsap.to(current, {
                    opacity: 0,
                    duration: 0.2,
                    onComplete: () => {
                        current.classList.remove('active');
                        // Animate in new
                        const target = document.getElementById(targetId);
                        target.classList.add('active');
                        gsap.fromTo(target, 
                            { opacity: 0, y: 10 }, 
                            { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
                        );
                    }
                });
            }
        });
    });

    // Anime.js for micro-interactions (Button click)
    const buttons = document.querySelectorAll('.interactive-el');
    buttons.forEach(btn => {
        btn.addEventListener('mousedown', () => {
            anime({
                targets: btn,
                scale: 0.95,
                duration: 100,
                easing: 'easeOutQuad'
            });
        });
        btn.addEventListener('mouseup', () => {
            anime({
                targets: btn,
                scale: 1,
                duration: 200,
                easing: 'easeOutElastic(1, .5)'
            });
        });
    });


    // ---- WebSocket & Agent Logic ----
    const ws = new WebSocket(`ws://${window.location.host}/ws`);
    
    const chatHistory = document.getElementById('chat-history');
    const thoughtLog = document.getElementById('thought-log');
    const fileGrid = document.getElementById('file-grid');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');

    let generatedFiles = new Set();

    function appendMessage(role, content) {
        const div = document.createElement('div');
        div.className = `message-enter max-w-3xl rounded-xl p-5 ${role === 'user' ? 'bg-zinc-800/80 self-end ml-12' : 'bg-transparent border border-zinc-800 self-start mr-12'} markdown-body`;
        
        // Use marked.js to render markdown
        div.innerHTML = marked.parse(content);
        
        chatHistory.appendChild(div);
        chatHistory.scrollTop = chatHistory.scrollHeight;

        // Animate message entry
        anime({
            targets: div,
            opacity: [0, 1],
            translateY: [15, 0],
            duration: 400,
            easing: 'easeOutCubic'
        });
    }

    function appendThought(type, content) {
        const div = document.createElement('div');
        let style = 'border-zinc-800 bg-zinc-900/30 text-zinc-400';
        
        if (type === 'action') style = 'border-blue-900/50 bg-blue-900/10 text-blue-300';
        if (type === 'observation') style = 'border-emerald-900/50 bg-emerald-900/10 text-emerald-300';
        if (type === 'status') style = 'border-purple-900/50 bg-purple-900/10 text-purple-300';

        div.className = `p-3 border rounded whitespace-pre-wrap ${style}`;
        div.textContent = `[${type.toUpperCase()}]\n${content}`;
        
        thoughtLog.appendChild(div);
        thoughtLog.scrollTop = thoughtLog.scrollHeight;
        
        // If we see a file generation in the observation, add it to workspace
        if (type === 'observation' && content.includes('Generated Files:')) {
            const filesLine = content.split('\\n').find(l => l.startsWith('Generated Files:'));
            if (filesLine) {
                const paths = filesLine.replace('Generated Files: ', '').split(', ');
                paths.forEach(p => addFileToWorkspace(p.trim()));
            }
        }
    }

    function addFileToWorkspace(filePath) {
        if (generatedFiles.has(filePath)) return;
        generatedFiles.add(filePath);

        // Clear empty state
        if (generatedFiles.size === 1) {
            fileGrid.innerHTML = '';
        }

        const fileName = filePath.split('/').pop().split('\\\\').pop();
        
        const card = document.createElement('div');
        card.className = 'p-4 border border-zinc-800 bg-zinc-900/50 rounded-lg flex flex-col gap-3 hover:border-zinc-600 transition-colors';
        card.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded bg-zinc-800 flex items-center justify-center text-xl text-zinc-400">📄</div>
                <div class="truncate text-sm font-medium" title="${fileName}">${fileName}</div>
            </div>
            <a href="/download?path=${encodeURIComponent(filePath)}" target="_blank" class="luxury-button text-center py-2 text-xs rounded text-zinc-300">Download</a>
        `;
        
        fileGrid.appendChild(card);
        
        // Animate card entry
        anime({
            targets: card,
            scale: [0.9, 1],
            opacity: [0, 1],
            duration: 500,
            easing: 'easeOutExpo'
        });
    }

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'history') {
            data.messages.forEach(msg => appendMessage(msg.role, msg.content));
        } 
        else if (data.type === 'message') {
            appendMessage(data.message.role, data.message.content);
        }
        else if (['thought', 'action', 'observation', 'status'].includes(data.type)) {
            appendThought(data.type, data.content);
        }
    };

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = userInput.value.trim();
        if (!text) return;
        
        ws.send(JSON.stringify({ type: "query", message: text }));
        userInput.value = '';
    });
});
