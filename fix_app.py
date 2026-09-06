with open("frontend/src/App.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix 1: ws.onmessage
old_ws = """        if (data.type === 'history') {
          setIsThinking(false)
          setMessages(data.messages.map((m) => ({ role: m.role, content: m.content })))
        } else if (data.type === 'message') {
          if (data.message.role === 'assistant') setIsThinking(false)
          setMessages((prev) => [...prev, { role: data.message.role, content: data.message.content }])"""

new_ws = """        if (data.type === 'history') {
          setIsThinking(false)
          setMessages(data.messages.map((m) => ({ role: m.role, content: m.content, sender_name: m.sender_name })))
        } else if (data.type === 'message') {
          if (data.message.role === 'assistant') setIsThinking(false)
          setMessages((prev) => [...prev, { role: data.message.role, content: data.message.content, sender_name: data.message.sender_name }])"""

content = content.replace(old_ws, new_ws)

# Fix 2: handleSubmit
old_send = """    setIsThinking(true);
      wsRef.current.send(JSON.stringify({ type: 'query', message: fullMessage, model: selectedModel }))
    setUserInput('')"""

new_send = """    setIsThinking(true);
    const username = localStorage.getItem('syncmind_username') || 'Team Member';
    wsRef.current.send(JSON.stringify({ type: 'query', message: fullMessage, model: selectedModel, sender_name: username }))
    setUserInput('')"""

content = content.replace(old_send, new_send)

# Fix 3: Rendering the bubble
old_render = """                      <div
                        key={i}
                        ref={(el) => { msgRefs.current[i] = el }}
                        className={`max-w-[95%] sm:max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 markdown-body ${
                          msg.role === 'user' ? 'bubble-user self-end' : 'bubble-ai self-start'
                        }`}
                        dangerouslySetInnerHTML={{
                          __html: marked.parse(msg.content || '') + (msg.streaming ? '<span class="stream-caret"></span>' : ''),
                        }}
                      />"""

new_render = """                      <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end self-end' : 'items-start self-start'} max-w-[95%] sm:max-w-[85%] md:max-w-[80%]`}>
                        {msg.role === 'user' && msg.sender_name && (
                          <span className="text-[11px] text-white/50 mb-1 px-2 uppercase tracking-wider font-semibold opacity-70">{msg.sender_name}</span>
                        )}
                        <div
                          ref={(el) => { msgRefs.current[i] = el }}
                          className={`rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 markdown-body w-full ${
                            msg.role === 'user' ? 'bubble-user' : 'bubble-ai'
                          }`}
                          dangerouslySetInnerHTML={{
                            __html: marked.parse(msg.content || '') + (msg.streaming ? '<span class="stream-caret"></span>' : ''),
                          }}
                        />
                      </div>"""
content = content.replace(old_render, new_render)

with open("frontend/src/App.jsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed App.jsx")
