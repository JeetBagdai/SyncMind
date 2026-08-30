document.addEventListener('DOMContentLoaded', () => {

    
    // --- IDENTITY (SOFT AUTH) ---
    if (!localStorage.getItem('syncmind_device_id')) {
        localStorage.setItem('syncmind_device_id', 'user_' + crypto.randomUUID());
    }
    window.deviceId = localStorage.getItem('syncmind_device_id');
    window.currentWorkspaceMode = localStorage.getItem('syncmind_workspace') || 'TEAM';
    
    window.setWorkspaceMode = function(mode) {
        window.currentWorkspaceMode = mode;
        localStorage.setItem('syncmind_workspace', mode);
        
        // Update UI Toggle
        const indicator = document.getElementById('workspace-indicator');
        const teamBtn = document.getElementById('mode-team-btn');
        const soloBtn = document.getElementById('mode-solo-btn');
        if (mode === 'TEAM') {
            indicator.style.transform = 'translateX(0)';
            teamBtn.classList.replace('text-zinc-400', 'text-white');
            soloBtn.classList.replace('text-white', 'text-zinc-400');
        } else {
            indicator.style.transform = 'translateX(100%)';
            soloBtn.classList.replace('text-zinc-400', 'text-white');
            teamBtn.classList.replace('text-white', 'text-zinc-400');
        }
        
        // Reload
        window.currentChatId = null;
        window.history.pushState({}, '', window.location.pathname);
        if (window.ws) window.ws.close();
        document.getElementById('chat-history').innerHTML = '';
        window.loadChats();
    };

    // --- MULTI-CHAT STATE ---
    window.currentChatId = new URLSearchParams(window.location.search).get('chat_id');
    
    
    window.loadChats = async function() {
        try {
            const ownerId = window.currentWorkspaceMode === 'TEAM' ? 'TEAM' : window.deviceId;
            const res = await fetch(`/api/chats?owner_id=${ownerId}`);
            const chats = await res.json();
            renderSidebar(chats);
            
            if (!window.currentChatId) {
                if (chats.length > 0) {
                    navigateToChat(chats[0].id);
                } else {
                    createNewChat();
                }
            }
        } catch (e) {
            console.error('Failed to load chats', e);
        }
    };
    
    window.createNewChat = async function() {
        const res = await fetch('/api/chats', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({title: 'New Chat', owner_id: window.currentWorkspaceMode === 'TEAM' ? 'TEAM' : window.deviceId})
        });
        const data = await res.json();
        navigateToChat(data.id);
    };
    
    window.navigateToChat = function(chatId) {
        window.history.pushState({}, '', `?chat_id=${chatId}`);
        window.currentChatId = chatId;
        document.getElementById('chat-history').innerHTML = '';
        if (window.ws) window.window.ws.close();
        window.loadChats();
        window.connectWebSocket();
    };

    window.updateChatMeta = async function(id, updates) {
        await fetch(`/api/chats/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(updates)
        });
        window.loadChats();
    };
    
    window.deleteChat = async function(id) {
        await fetch(`/api/chats/${id}`, { method: 'DELETE' });
        if (window.currentChatId === id) {
            window.currentChatId = null;
            window.history.pushState({}, '', window.location.pathname);
        }
        window.loadChats();
    };

    function renderSidebar(chats) {
        const pinnedList = document.getElementById('pinned-chats-list');
        const recentList = document.getElementById('recent-chats-list');
        const groupsContainer = document.getElementById('dynamic-groups-container');
        const pinnedContainer = document.getElementById('pinned-chats-container');
        
        pinnedList.innerHTML = '';
        recentList.innerHTML = '';
        groupsContainer.innerHTML = '';
        
        let hasPinned = false;
        let groups = {};
        
        chats.forEach(chat => {
            const el = createSidebarItem(chat);
            
            if (chat.is_pinned) {
                pinnedList.appendChild(el);
                hasPinned = true;
            } else if (chat.category && chat.category !== 'Recents') {
                if (!groups[chat.category]) groups[chat.category] = [];
                groups[chat.category].push(el);
            } else {
                recentList.appendChild(el);
            }
        });
        
        pinnedContainer.classList.toggle('hidden', !hasPinned);
        
        for (const [category, items] of Object.entries(groups)) {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'mt-4';
            groupDiv.innerHTML = `<div class="px-2 text-xs font-semibold text-zinc-500 mb-1 flex items-center justify-between group cursor-pointer">${category}</div>`;
            const listDiv = document.createElement('div');
            listDiv.className = 'space-y-0.5';
            items.forEach(i => listDiv.appendChild(i));
            groupDiv.appendChild(listDiv);
            groupsContainer.appendChild(groupDiv);
        }
    }
    
    function createSidebarItem(chat) {
        const wrapper = document.createElement('div');
        wrapper.className = 'flex flex-col gap-1 w-full';
        
        const div = document.createElement('div');
        const isActive = chat.id === window.currentChatId;
        div.className = `group flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'}`;
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'truncate flex-1 text-sm';
        titleSpan.textContent = chat.title || 'New Chat';
        titleSpan.onclick = () => navigateToChat(chat.id);
        
        const actionsDiv = document.createElement('div');
        actionsDiv.className = `flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'opacity-100' : ''}`;
        
        const pinBtn = document.createElement('button');
        pinBtn.className = 'p-1 hover:text-white';
        pinBtn.innerHTML = chat.is_pinned ? '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>' : '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>';
        pinBtn.title = chat.is_pinned ? "Unpin" : "Pin";
        pinBtn.onclick = (e) => { e.stopPropagation(); updateChatMeta(chat.id, {is_pinned: !chat.is_pinned}); };
        
        // Inline Edit UI (Title & Category)
        const editDiv = document.createElement('div');
        editDiv.className = 'hidden flex-col gap-2 mt-1 px-2 py-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-inner';
        
        const titleInput = document.createElement('input');
        titleInput.type = 'text';
        titleInput.className = 'w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-zinc-500';
        titleInput.placeholder = 'Chat Title';
        titleInput.value = chat.title || 'New Chat';
        
        const catInput = document.createElement('input');
        catInput.type = 'text';
        catInput.className = 'w-full bg-zinc-950 border border-zinc-700 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-zinc-500';
        catInput.placeholder = 'Category (blank = Recents)';
        catInput.value = chat.category === 'Recents' ? '' : chat.category;
        
        const editBtnsRow = document.createElement('div');
        editBtnsRow.className = 'flex items-center justify-end gap-2 mt-1';
        
        const saveBtn = document.createElement('button');
        saveBtn.className = 'px-3 py-1 text-xs uppercase tracking-wider font-bold text-emerald-400 bg-emerald-950/30 hover:bg-emerald-900/50 rounded transition-colors';
        saveBtn.textContent = 'Save';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'px-3 py-1 text-xs uppercase tracking-wider font-bold text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors';
        cancelBtn.textContent = 'Cancel';
        
        editBtnsRow.appendChild(cancelBtn);
        editBtnsRow.appendChild(saveBtn);
        
        editDiv.appendChild(titleInput);
        editDiv.appendChild(catInput);
        editDiv.appendChild(editBtnsRow);
        
        // Inline Delete UI
        const delDiv = document.createElement('div');
        delDiv.className = 'hidden items-center justify-between mt-1 px-3 py-2 bg-red-950/30 border border-red-900/50 rounded-lg text-xs text-red-400';
        delDiv.innerHTML = '<span class="font-medium">Delete chat?</span><div class="flex gap-2"><button id="yesBtn" class="px-2 py-1 bg-red-900/50 hover:bg-red-800/80 text-white rounded font-bold transition-colors">Yes</button><button id="noBtn" class="px-2 py-1 hover:bg-zinc-800 hover:text-zinc-300 text-zinc-400 rounded transition-colors">No</button></div>';
        
        // Options Button (Opens Edit UI)
        const optBtn = document.createElement('button');
        optBtn.className = 'p-1 hover:text-white';
        optBtn.title = "Edit Title & Category";
        optBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path></svg>';
        
        // Delete Button (Opens Delete UI)
        const delBtn = document.createElement('button');
        delBtn.className = 'p-1 hover:text-red-400';
        delBtn.title = "Delete Chat";
        delBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>';
        
        // Wiring Options
        optBtn.onclick = (e) => {
            e.stopPropagation();
            editDiv.classList.remove('hidden');
            editDiv.classList.add('flex');
            delDiv.classList.add('hidden');
            delDiv.classList.remove('flex');
            titleInput.focus();
        };
        
        saveBtn.onclick = (e) => {
            e.stopPropagation();
            updateChatMeta(chat.id, {
                title: titleInput.value.trim() || 'New Chat',
                category: catInput.value.trim() || 'Recents'
            });
        };
        
        cancelBtn.onclick = (e) => {
            e.stopPropagation();
            editDiv.classList.add('hidden');
            editDiv.classList.remove('flex');
            titleInput.value = chat.title || 'New Chat';
            catInput.value = chat.category === 'Recents' ? '' : chat.category;
        };
        
        const onEnter = (e) => {
            if (e.key === 'Enter') saveBtn.click();
            if (e.key === 'Escape') cancelBtn.click();
        };
        titleInput.onkeydown = onEnter;
        catInput.onkeydown = onEnter;
        
        // Wiring Delete
        delBtn.onclick = (e) => {
            e.stopPropagation();
            delDiv.classList.remove('hidden');
            delDiv.classList.add('flex');
            editDiv.classList.add('hidden');
            editDiv.classList.remove('flex');
        };
        
        delDiv.querySelector('#yesBtn').onclick = (e) => {
            e.stopPropagation();
            deleteChat(chat.id);
        };
        
        delDiv.querySelector('#noBtn').onclick = (e) => {
            e.stopPropagation();
            delDiv.classList.add('hidden');
            delDiv.classList.remove('flex');
        };
        
        actionsDiv.appendChild(pinBtn);
        actionsDiv.appendChild(optBtn);
        actionsDiv.appendChild(delBtn);
        
        div.appendChild(titleSpan);
        div.appendChild(actionsDiv);
        
        wrapper.appendChild(div);
        wrapper.appendChild(editDiv);
        wrapper.appendChild(delDiv);
        
        return wrapper;
    }
    
    document.getElementById('new-chat-btn').addEventListener('click', createNewChat);

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
    window.ws = null;
    window.connectWebSocket = function() {
        if (!window.currentChatId) return;
        const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
        window.ws = new WebSocket(`${proto}//${window.location.host}/ws/${window.currentChatId}`);
        window.ws.onmessage = window.handleSocketMessage;
    };
    
    window.stopProcessing = function() {
        if (window.ws) {
            window.ws.close();
            appendThought('status', 'User forcefully interrupted the process.');
            const stopBtn = document.getElementById('stop-btn');
            const sendBtn = document.getElementById('send-btn');
            if (stopBtn) { stopBtn.classList.add('hidden'); stopBtn.style.display = 'none'; }
            if (sendBtn) { sendBtn.classList.remove('hidden'); sendBtn.style.display = 'flex'; }
                }
    };
    
    const chatHistory = document.getElementById('chat-history');
    const thoughtLog = document.getElementById('thought-log');
    const fileGrid = document.getElementById('file-grid');
    const chatForm = document.getElementById('chat-form');
    const userInput = document.getElementById('user-input');

    const scrollBtn = document.getElementById('scroll-bottom-btn');
    if (scrollBtn && chatHistory) {
        chatHistory.addEventListener('scroll', () => {
            // Check if user is scrolled up more than 100px from the bottom
            const isNearBottom = chatHistory.scrollHeight - chatHistory.clientHeight <= chatHistory.scrollTop + 100;
            if (!isNearBottom) {
                scrollBtn.classList.remove('hidden');
                setTimeout(() => scrollBtn.classList.remove('opacity-0'), 10);
            } else {
                scrollBtn.classList.add('opacity-0');
                setTimeout(() => { if (scrollBtn.classList.contains('opacity-0')) scrollBtn.classList.add('hidden') }, 300);
            }
        });

        scrollBtn.addEventListener('click', () => {
            chatHistory.scrollTo({
                top: chatHistory.scrollHeight,
                behavior: 'smooth'
            });
        });
    }


    let generatedFiles = new Set();

    // ==== LOCALSTORAGE PERSISTENCE ====
    // Load thoughts from local storage
    let storedThoughts = JSON.parse(localStorage.getItem('syncmind_thoughts') || '[]');
    storedThoughts.forEach(t => appendThought(t.type, t.content, false));
    
    // Load files from local storage
    let storedFiles = JSON.parse(localStorage.getItem('syncmind_files') || '[]');
    storedFiles.forEach(f => addFileToWorkspace(f, false));

    // Clear memory button (optional hook if they want to clear it)
    window.clearSyncMindMemory = () => {
        localStorage.removeItem('syncmind_thoughts');
        localStorage.removeItem('syncmind_files');
    };

    // Modified appendThought to save to local storage
    const originalAppendThought = appendThought;
    appendThought = function(type, content, save = true) {
        originalAppendThought(type, content);
        if (save) {
            let thoughts = JSON.parse(localStorage.getItem('syncmind_thoughts') || '[]');
            thoughts.push({type, content});
            localStorage.setItem('syncmind_thoughts', JSON.stringify(thoughts));
        }
    };

    // Modified addFileToWorkspace to save to local storage
    const originalAddFileToWorkspace = addFileToWorkspace;
    addFileToWorkspace = function(filePath, save = true) {
        originalAddFileToWorkspace(filePath);
        if (save) {
            let files = JSON.parse(localStorage.getItem('syncmind_files') || '[]');
            if (!files.includes(filePath)) {
                files.push(filePath);
                localStorage.setItem('syncmind_files', JSON.stringify(files));
            }
        }
    };
    // ===================================


    function appendMessage(role, content) {
        const div = document.createElement('div');
        div.className = `message-enter max-w-3xl rounded-xl p-5 ${role === 'user' ? 'bg-zinc-800/80 self-end ml-12' : 'bg-transparent border border-zinc-800 self-start mr-12'} markdown-body`;
        
        
        // Use marked.js to render markdown
                // Split content and UI logic
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = marked.parse(content);
        div.appendChild(contentDiv);
        
        if (role === 'user') {
            const editBtn = document.createElement('button');
            editBtn.className = "text-xs text-zinc-500 hover:text-zinc-300 mt-2 flex items-center gap-1 transition-colors";
            editBtn.innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg> Edit`;
            
            // Build the inline edit container
            const editContainer = document.createElement('div');
            editContainer.className = 'hidden flex-col gap-3 mt-2 w-full min-w-[60vw] max-w-full lg:min-w-[700px]';
            
            const textarea = document.createElement('textarea');
            textarea.className = 'w-full bg-zinc-900 text-zinc-200 rounded-lg p-3 text-sm border border-zinc-700 outline-none resize-y min-h-[250px] font-sans';
            textarea.value = content;
            
            const btnRow = document.createElement('div');
            btnRow.className = 'flex justify-end gap-2';
            
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'px-4 py-1.5 rounded-full text-sm font-medium bg-zinc-700 text-zinc-200 hover:bg-zinc-600 transition-colors';
            cancelBtn.textContent = 'Cancel';
            
            const sendBtn = document.createElement('button');
            sendBtn.className = 'px-4 py-1.5 rounded-full text-sm font-medium bg-white text-black hover:bg-gray-200 transition-colors';
            sendBtn.textContent = 'Send';
            
            btnRow.appendChild(cancelBtn);
            btnRow.appendChild(sendBtn);
            editContainer.appendChild(textarea);
            editContainer.appendChild(btnRow);
            
            div.appendChild(editBtn);
            div.appendChild(editContainer);
            
            editBtn.onclick = () => {
                contentDiv.classList.add('hidden');
                editBtn.classList.add('hidden');
                editContainer.classList.remove('hidden');
                editContainer.classList.add('flex');
                textarea.focus();
            };
            
            cancelBtn.onclick = () => {
                editContainer.classList.add('hidden');
                editContainer.classList.remove('flex');
                contentDiv.classList.remove('hidden');
                editBtn.classList.remove('hidden');
                textarea.value = content; // Reset text
            };
            
            sendBtn.onclick = () => {
                const newText = textarea.value.trim();
                if (!newText) return;
                
                // Close edit UI
                cancelBtn.click();
                
                // Stop any current process
                window.stopProcessing();
                
                // Clear previous thought log and local storage on new task
                const thoughtLog = document.getElementById('thought-log');
                if (thoughtLog) thoughtLog.innerHTML = '';
                localStorage.removeItem('syncmind_thoughts');
                
                // Show stop button, hide send button in main UI
                const mainStopBtn = document.getElementById('stop-btn');
                const mainSendBtn = document.getElementById('send-btn');
                if (mainStopBtn) { mainStopBtn.classList.remove('hidden'); mainStopBtn.style.display = 'flex'; }
                if (mainSendBtn) { mainSendBtn.classList.add('hidden'); mainSendBtn.style.display = 'none'; }
                
                // Send the new query
                window.ws.send(JSON.stringify({ type: "query", message: newText }));
            };
        }

        
        chatHistory.appendChild(div);
        
        // Only auto-scroll if already near bottom
        const isScrolledToBottom = chatHistory.scrollHeight - chatHistory.clientHeight <= chatHistory.scrollTop + 100;
        if (isScrolledToBottom) {
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }

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
            const filesLine = content.split('\n').find(l => l.startsWith('Generated Files:'));
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

        // Properly extract filename handling both forward and backward slashes (regex fixed)
        let parts = filePath.split('\\'); if(parts.length === 1) parts = filePath.split('/'); const fileName = parts.pop();
        const ext = fileName.split('.').pop().toLowerCase();
        
        let icon = '<svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>';
        let bgStyle = 'bg-zinc-800 text-zinc-400 border-zinc-700';
        let typeLabel = ext.toUpperCase() + ' FILE';
        
        if (ext === 'docx' || ext === 'doc') {
            // Word Icon (Blue, W)
            icon = '<svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z" fill="#1e3a8a" stroke="none"/><path d="M7 8l2 8 3-5 3 5 2-8" stroke="#60a5fa" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            bgStyle = 'bg-blue-900/20 text-blue-400 border-blue-800/50';
            typeLabel = 'WORD DOCUMENT';
        } else if (ext === 'pptx' || ext === 'ppt') {
            // PowerPoint Icon (Orange, P/Chart)
            icon = '<svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z" fill="#7c2d12" stroke="none"/><path d="M8 8h4a3 3 0 010 6H8V8z" fill="#fb923c" stroke="none"/><path d="M8 18v-4" stroke="#fb923c" stroke-linecap="round"/></svg>';
            bgStyle = 'bg-orange-900/20 text-orange-400 border-orange-800/50';
            typeLabel = 'POWERPOINT PRESENTATION';
        } else if (ext === 'csv' || ext === 'xlsx') {
            // Excel Icon (Green, X)
            icon = '<svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z" fill="#064e3b" stroke="none"/><path d="M8 8l8 8M16 8l-8 8" stroke="#34d399" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            bgStyle = 'bg-emerald-900/20 text-emerald-400 border-emerald-800/50';
            typeLabel = 'EXCEL SPREADSHEET';
        } else if (ext === 'py') {
            icon = '<svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 3H5a2 2 0 00-2 2v4m18 0V5a2 2 0 00-2-2h-4m0 18h4a2 2 0 002-2v-4M5 21h4" stroke-linecap="round"/><circle cx="12" cy="12" r="3"/></svg>';
            bgStyle = 'bg-yellow-900/20 text-yellow-400 border-yellow-800/50';
            typeLabel = 'PYTHON SCRIPT';
        }

        const card = document.createElement('div');
        card.className = 'p-5 border border-zinc-800 bg-zinc-900/50 rounded-xl flex flex-col gap-4 hover:border-zinc-600 transition-colors shadow-lg';
        card.innerHTML = `
            <div class="flex items-start gap-4">
                <div class="w-12 h-12 rounded-lg flex items-center justify-center border ${bgStyle}">
                    ${icon}
                </div>
                <div class="flex flex-col flex-1 min-w-0 justify-center h-12">
                    <div class="truncate text-sm font-medium text-zinc-200 leading-tight" title="${fileName}">${fileName}</div>
                    <div class="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-1">${typeLabel}</div>
                </div>
            </div>
            <a href="/download?path=${encodeURIComponent(filePath)}" target="_blank" class="luxury-button text-center py-2 text-xs rounded text-zinc-300 w-full mt-2 block hover:bg-zinc-800 transition-colors">Download File</a>
        `;
        
        fileGrid.appendChild(card);
        
        // Animate card entry
        anime({
            targets: card,
            scale: [0.95, 1],
            opacity: [0, 1],
            translateY: [10, 0],
            duration: 600,
            easing: 'easeOutExpo'
        });
    }

    window.handleSocketMessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'history') {
            if (data.messages.length === 0) {
                chatHistory.innerHTML = '<div class="flex flex-col items-center justify-center h-full text-zinc-500 mt-32"><svg class="w-16 h-16 mb-4 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg><div class="text-xl font-medium text-zinc-300">Welcome to SyncMind</div><div class="text-sm mt-2 text-zinc-400">How can I help you today?</div></div>';
            } else {
                data.messages.forEach(msg => appendMessage(msg.role, msg.content));
            }
        } 
        else if (data.type === 'message') {
            appendMessage(data.message.role, data.message.content);
            const sb = document.getElementById('stop-btn');
            const snd = document.getElementById('send-btn');
            if (sb) { sb.classList.add('hidden'); sb.style.display = 'none'; }
            if (snd) { snd.classList.remove('hidden'); snd.style.display = 'flex'; }
        }
        else if (['thought', 'action', 'observation', 'status'].includes(data.type)) {
            appendThought(data.type, data.content);
        }
    };

    chatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = userInput.value.trim();
        if (!text) return;
        
        // Clear previous thought log and local storage on new task
        thoughtLog.innerHTML = '';
        localStorage.removeItem('syncmind_thoughts');
        
        // Show stop button, hide send
        const stopBtn = document.getElementById('stop-btn');
        if (stopBtn) { stopBtn.classList.remove('hidden'); stopBtn.style.display = 'flex'; }
        const sndBtnSubmit = document.getElementById('send-btn'); if (sndBtnSubmit) { sndBtnSubmit.classList.add('hidden'); sndBtnSubmit.style.display = 'none'; }
        
        window.ws.send(JSON.stringify({ type: "query", message: text }));
        userInput.value = '';
    });

    // Initialize WebSocket after all handlers are defined
    window.setWorkspaceMode(window.currentWorkspaceMode);
});


// --- Swarm and Network Monitoring ---

async function fetchSwarmStatus() {
    try {
        const res = await fetch('/api/swarm-status');
        const data = await res.json();
        const grid = document.getElementById('swarm-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        data.nodes.forEach(node => {
            const isBusy = node.status === 'busy';
            const color = isBusy ? 'text-yellow-400' : 'text-green-400';
            const border = isBusy ? 'border-yellow-900/50' : 'border-zinc-800';
            
            grid.innerHTML += `
                <div class="p-4 rounded-lg bg-black border ${border}">
                    <div class="flex justify-between items-center mb-2">
                        <div class="font-mono text-sm text-zinc-300 truncate w-3/4">${node.node}</div>
                        <div class="text-xs font-bold ${color}">${node.status.toUpperCase()}</div>
                    </div>
                    <div class="text-xs text-zinc-500">Model: <span class="text-zinc-300">${node.model}</span></div>
                    <div class="text-xs text-zinc-500">Last Task: <span class="text-zinc-300">${node.last_task}</span></div>
                    <div class="text-xs text-zinc-500">Requests: <span class="text-zinc-300">${node.requests}</span></div>
                </div>
            `;
        });
    } catch (e) {
        console.error("Error fetching swarm status", e);
    }
}

async function fetchNetworkLog() {
    try {
        const res = await fetch('/api/network-log');
        const logs = await res.json();
        const tbody = document.getElementById('network-log-body');
        if (!tbody) return;
        
        tbody.innerHTML = '';
        logs.forEach(log => {
            const color = log.status.includes('BLOCKED') ? 'text-red-400' : 'text-green-400';
            tbody.innerHTML += `
                <tr class="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                    <td class="py-2 text-zinc-500">${log.timestamp}</td>
                    <td class="py-2 text-zinc-300">${log.method}</td>
                    <td class="py-2 text-zinc-300 truncate max-w-xs" title="${log.url}">${log.url}</td>
                    <td class="py-2 text-right ${color} font-bold">${log.status}</td>
                </tr>
            `;
        });
    } catch (e) {
        console.error("Error fetching network log", e);
    }
}

// Poll every 5 seconds
setInterval(fetchSwarmStatus, 5000);
setInterval(fetchNetworkLog, 5000);
// Initial fetch
fetchSwarmStatus();
fetchNetworkLog();


// --- File Upload Logic ---
const fileUpload = document.getElementById('file-upload');
if (fileUpload) {
    fileUpload.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file || !window.currentChatId) return;
        
        const userInput = document.getElementById('user-input');
        const oldPlaceholder = userInput.placeholder;
        userInput.placeholder = "Uploading & processing document (OCR)... Please wait.";
        userInput.disabled = true;
        
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const res = await fetch(`/api/upload/${window.currentChatId}`, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            // Add a visual indicator to the chat that a file was uploaded
            const chatHistory = document.getElementById('chat-history');
            const fileMsg = document.createElement('div');
            fileMsg.className = "p-3 mb-2 rounded border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-400 flex items-center gap-2";
            fileMsg.innerHTML = `<svg class="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg> Document uploaded and processed into RAG context: <span class="text-white">${data.filename}</span>`;
            chatHistory.appendChild(fileMsg);
            chatHistory.scrollTop = chatHistory.scrollHeight;
            
        } catch (err) {
            console.error("Upload error", err);
            alert("Error uploading file.");
        } finally {
            userInput.placeholder = oldPlaceholder;
            userInput.disabled = false;
            e.target.value = ''; // reset
        }
    });
}

// --- Demo Scripts ---
window.runDemo = async function(demoId) {
    if (!window.currentChatId) {
        alert("Please select or create a chat session first.");
        return;
    }
    
    // Switch to Chat tab
    document.querySelector('.tab-btn[data-target="chat-view"]').click();
    
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    
    if (demoId === 'A') {
        userInput.value = "Load the sample_report.pdf, read its contents via RAG, and draft a formal approval note as a Word (.docx) file summarizing the findings.";
    } else if (demoId === 'B') {
        userInput.value = "Write a python script in the sandbox to read sample_data.csv, compute the mean, max, and min for each numeric column, and save the output as an Excel (.xlsx) file. I need the Excel file.";
    } else if (demoId === 'C') {
        userInput.value = "Analyze the sample_diagram.png using the vision model and extract all labels and equipment tags.";
    }
    
    setTimeout(() => {
        sendBtn.click();
    }, 500);
};
