import sys

path = 'C:\\Users\\Jeet\\Desktop\\Projects\\SyncMind\\syncmind\\frontend\\src\\App.jsx'
with open(path, 'r', encoding='utf-8') as f:
    text = f.read()

start = text.find('const renderChatRow = (c) => (')
end = text.find('return (', start)

if start == -1 or end == -1:
    print('TARGET NOT FOUND')
    sys.exit(1)

target = text[start:end]

replacement = """const ONE_DAY = 24 * 60 * 60 * 1000
  const todayChats = otherChats.filter(c => Date.now() - (c.createdAt || Date.now()) < ONE_DAY)
  const olderChats = otherChats.filter(c => Date.now() - (c.createdAt || Date.now()) >= ONE_DAY)

  const renderChatRow = (c) => (
      <button
        key={c.id}
        className={`sb-chat group ${c.id === activeConv?.id ? 'active' : ''}`}
        onClick={() => selectChat(c.id)}
        title={c.title}
      >
        {editingChatId === c.id ? (
          <input 
            autoFocus 
            value={editTitle} 
            onChange={e => setEditTitle(e.target.value)} 
            onBlur={(e) => submitRename(c.id, e)} 
            onKeyDown={e => e.key === 'Enter' && submitRename(c.id, e)}
            className="sb-chat-title bg-black/40 border border-white/20 px-1 py-0.5 rounded outline-none text-white flex-1" 
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="sb-chat-title">{c.title}</span>
        )}
        
        {editingChatId !== c.id && (
          <span className="sb-act opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => startRename(c, e)} title="Rename chat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11.5V15h3.5l9.5-9.5-3.5-3.5L9 11.5z" />
            </svg>
          </span>
        )}
        
        <span
          className={`sb-act ${c.pinned ? 'on' : ''}`}
          onClick={(e) => togglePin(c.id, e)}
          title={c.pinned ? 'Unpin chat' : 'Pin chat'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 4h6l-1 6 3 3H7l3-3-1-6zM12 13v7" />
          </svg>
        </span>
        <span className="sb-act" onClick={(e) => deleteChat(c.id, e)} title="Delete chat">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </span>
      </button>
  )

  """

text = text.replace(target, replacement)

list_target = """          <div className="sb-section">
            <span>Chats</span>
            <span className="sb-count">{otherChats.length}</span>
          </div>
  
          <div className="sb-list">
            {otherChats.length === 0 && <div className="sb-empty">No other chats</div>}
            {otherChats.map(renderChatRow)}
          </div>"""
          
list_replacement = """          {todayChats.length > 0 && (
            <>
              <div className="sb-section">
                <span>Today</span>
                <span className="sb-count">{todayChats.length}</span>
              </div>
              <div className="sb-list">
                {todayChats.map(renderChatRow)}
              </div>
            </>
          )}

          {olderChats.length > 0 && (
            <>
              <div className="sb-section">
                <span>Previous 7 Days</span>
                <span className="sb-count">{olderChats.length}</span>
              </div>
              <div className="sb-list">
                {olderChats.map(renderChatRow)}
              </div>
            </>
          )}

          {otherChats.length === 0 && (
            <div className="sb-list">
              <div className="sb-empty">No other chats</div>
            </div>
          )}"""
          
text = text.replace(list_target, list_replacement)

with open(path, 'w', encoding='utf-8') as f:
    f.write(text)
print('SUCCESS')
