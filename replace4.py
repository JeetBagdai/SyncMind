import sys
import re

path = 'C:\\Users\\Jeet\\Desktop\\Projects\\SyncMind\\syncmind\\frontend\\src\\App.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove backdrop
content = content.replace('{sidebarOpen && <div className="sb-backdrop" onClick={() => setSidebarOpen(false)} />}', '')

# 2. State definition
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
    if (editGroupTitle.trim()) {
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, group: editGroupTitle.trim() } : c)))
    }
    setEditingGroupId(null)
  }"""

# Check if old state exists
if 'const [editingChatId' in content:
    # Replace old state block
    start_state = content.find('  const [editingChatId')
    end_state = content.find('  // The UI reveal is chained', start_state)
    if end_state != -1:
        content = content[:start_state] + state_replacement + "\n\n" + content[end_state:]
else:
    # Insert after cmdkIndex
    cmdk_idx = content.find('const [cmdkIndex, setCmdkIndex] = useState(0)')
    if cmdk_idx != -1:
        cmdk_end = content.find('\n', cmdk_idx) + 1
        content = content[:cmdk_end] + "\n" + state_replacement + "\n" + content[cmdk_end:]

# 3. renderChatRow replacement
start_render = content.find('  const renderChatRow =')
# Maybe we have ONE_DAY before it
one_day_idx = content.find('  const ONE_DAY')
if one_day_idx != -1 and one_day_idx < start_render:
    start_render = one_day_idx

end_render = content.find('  return (', start_render)

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
  )

"""

if start_render != -1 and end_render != -1:
    content = content[:start_render] + render_replacement + content[end_render:]

# 4. Layout replacement
start_layout = content.find('<div className="sb-section">\n            <span>Chats</span>')
end_layout = content.find('        </aside>', start_layout)

layout_replacement = """{Object.entries(groupedChats).map(([groupName, chats]) => (
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
          )}
"""

if start_layout != -1 and end_layout != -1:
    content = content[:start_layout] + layout_replacement + content[end_layout:]

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("SUCCESS")
