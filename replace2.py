import sys
import re

path = 'C:\\Users\\Jeet\\Desktop\\Projects\\SyncMind\\syncmind\\frontend\\src\\App.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove backdrop
content = content.replace('{sidebarOpen && <div className="sb-backdrop" onClick={() => setSidebarOpen(false)} />}', '')

# 2. Add group editing state
state_target = """  // ---- Chat renaming state ----
  const [editingChatId, setEditingChatId] = useState(null)
  const [editTitle, setEditTitle] = useState('')

  const startRename = (c, e) => {
    e.stopPropagation()
    setEditingChatId(c.id)
    setEditTitle(c.title)
  }

  const submitRename = (id, e) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (editTitle.trim()) {
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: editTitle.trim() } : c)))
    }
    setEditingChatId(null)
  }"""

state_replacement = """  // ---- Chat renaming & grouping state ----
  const [editingChatId, setEditingChatId] = useState(null)
  const [editTitle, setEditTitle] = useState('')

  const [editingGroupId, setEditingGroupId] = useState(null)
  const [editGroupTitle, setEditGroupTitle] = useState('')

  const startRename = (c, e) => {
    e.stopPropagation()
    setEditingGroupId(null)
    setEditingChatId(c.id)
    setEditTitle(c.title)
  }

  const submitRename = (id, e) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (editTitle.trim()) {
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, title: editTitle.trim() } : c)))
    }
    setEditingChatId(null)
  }

  const startGroupEdit = (c, e) => {
    e.stopPropagation()
    setEditingChatId(null)
    setEditingGroupId(c.id)
    setEditGroupTitle(c.group || '')
  }

  const submitGroupEdit = (id, e) => {
    e?.preventDefault()
    e?.stopPropagation()
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, group: editGroupTitle.trim() } : c)))
    setEditingGroupId(null)
  }"""

if state_target in content:
    content = content.replace(state_target, state_replacement)
else:
    print("FAILED TO FIND STATE TARGET")
    sys.exit(1)

# 3. Update grouping logic and renderChatRow
render_target = """  const ONE_DAY = 24 * 60 * 60 * 1000
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
    )"""

render_replacement = """  const groupedChats = {}
  otherChats.forEach(c => {
    const g = c.group || 'Default'
    if (!groupedChats[g]) groupedChats[g] = []
    groupedChats[g].push(c)
  })

  const renderChatRow = (c) => (
      <button
        key={c.id}
        className={`sb-chat group ${c.id === activeConv?.id ? 'active' : ''}`}
        onClick={() => selectChat(c.id)}
        title={c.title}
      >
        {editingGroupId === c.id ? (
          <input 
            autoFocus 
            placeholder="Group name..."
            value={editGroupTitle} 
            onChange={e => setEditGroupTitle(e.target.value)} 
            onBlur={(e) => submitGroupEdit(c.id, e)} 
            onKeyDown={e => e.key === 'Enter' && submitGroupEdit(c.id, e)}
            className="sb-chat-title bg-black/40 border border-white/20 px-1 py-0.5 rounded outline-none text-white flex-1" 
            onClick={e => e.stopPropagation()}
          />
        ) : editingChatId === c.id ? (
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
        
        {editingChatId !== c.id && editingGroupId !== c.id && (
          <>
            <span className="sb-act opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => startRename(c, e)} title="Rename chat">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 11.5V15h3.5l9.5-9.5-3.5-3.5L9 11.5z" />
              </svg>
            </span>
            <span className="sb-act opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => startGroupEdit(c, e)} title="Change group">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </span>
          </>
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
    )"""

if render_target in content:
    content = content.replace(render_target, render_replacement)
else:
    print("FAILED TO FIND RENDER TARGET")
    sys.exit(1)

# 4. Update the sidebar layout rendering
layout_target = """          {todayChats.length > 0 && (
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

layout_replacement = """          {Object.entries(groupedChats).map(([groupName, chats]) => (
            <React.Fragment key={groupName}>
              <div className="sb-section">
                <span>{groupName}</span>
                <span className="sb-count">{chats.length}</span>
              </div>
              <div className="sb-list">
                {chats.map(renderChatRow)}
              </div>
            </React.Fragment>
          ))}
          {otherChats.length === 0 && (
            <div className="sb-list">
              <div className="sb-empty">No other chats</div>
            </div>
          )}"""

if layout_target in content:
    content = content.replace(layout_target, layout_replacement)
else:
    print("FAILED TO FIND LAYOUT TARGET")
    sys.exit(1)

# Also stop closing the sidebar on chat select so they can use it simultaneously easily
content = content.replace("setSidebarOpen(false)", "// setSidebarOpen(false)")
# wait, there's `onClick={() => setSidebarOpen(true)}` - we shouldn't replace all!
# We just want to remove the ones in newChat and selectChat, or we already removed the backdrop which is enough.
# Let's just write the content out now without blindly replacing setSidebarOpen
with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("SUCCESS")
