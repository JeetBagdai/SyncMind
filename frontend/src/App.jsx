import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { marked } from 'marked'
import anime from 'animejs'
import gsap from 'gsap'
import ShaderBackground from './components/ShaderBackground'
import IntroVideo from './components/IntroVideo'
import { streamChat, chatEnabled } from './lib/chatProvider'

// ---- File type table -------------------------------------------------
// Sheet-with-a-folded-corner marks drawn in each format's own brand colour,
// the way Explorer shows them. These are our own drawings, not Microsoft's
// shipped icon assets - close enough to be recognised at a glance without
// bundling licensed artwork.
const FILE_TYPES = {
  docx: { label: 'Microsoft Word Document', color: '#2B579A', glyph: 'W' },
  doc:  { label: 'Microsoft Word Document', color: '#2B579A', glyph: 'W' },
  rtf:  { label: 'Rich Text Document', color: '#2B579A', glyph: 'W' },
  pptx: { label: 'Microsoft PowerPoint Presentation', color: '#C43E1C', glyph: 'P' },
  ppt:  { label: 'Microsoft PowerPoint Presentation', color: '#C43E1C', glyph: 'P' },
  xlsx: { label: 'Microsoft Excel Worksheet', color: '#217346', glyph: 'X' },
  xls:  { label: 'Microsoft Excel Worksheet', color: '#217346', glyph: 'X' },
  csv:  { label: 'Comma Separated Values', color: '#217346', glyph: 'CSV', small: true },
  pdf:  { label: 'PDF Document', color: '#D93025', glyph: 'PDF', small: true },
  md:   { label: 'Markdown Document', color: '#4A5568', glyph: 'MD', small: true },
  txt:  { label: 'Text Document', color: '#78716C', glyph: 'TXT', small: true },
  py:   { label: 'Python Script', color: '#3776AB', glyph: 'PY', small: true },
  js:   { label: 'JavaScript File', color: '#B59A15', glyph: 'JS', small: true },
  json: { label: 'JSON File', color: '#B59A15', glyph: '{ }', small: true },
  html: { label: 'HTML Document', color: '#C2410C', glyph: '<>', small: true },
  zip:  { label: 'Compressed Archive', color: '#B45309', glyph: 'ZIP', small: true },
  png:  { label: 'PNG Image', color: '#7C3AED', glyph: 'PNG', small: true },
  jpg:  { label: 'JPEG Image', color: '#7C3AED', glyph: 'JPG', small: true },
  jpeg: { label: 'JPEG Image', color: '#7C3AED', glyph: 'JPG', small: true },
}

// One shared drawing: page body, lighter folded corner, glyph on the spine.
function FileGlyph({ color, glyph, small }) {
  return (
    <svg viewBox="0 0 24 24" className="file-glyph" aria-hidden="true">
      <path
        d="M6.4 1.8h7.3L19.4 7.5V21a1.7 1.7 0 0 1-1.7 1.7H6.4A1.7 1.7 0 0 1 4.7 21V3.5a1.7 1.7 0 0 1 1.7-1.7Z"
        fill={color}
      />
      <path d="M13.7 1.8 19.4 7.5h-4.4a1.3 1.3 0 0 1-1.3-1.3Z" fill="#fff" fillOpacity="0.42" />
      <text
        x="12.1"
        y="17.4"
        textAnchor="middle"
        fill="#fff"
        fontSize={small ? 5.6 : 9}
        fontWeight="700"
        letterSpacing={small ? '0.2' : '0'}
      >
        {glyph}
      </text>
    </svg>
  )
}

function getFileMeta(filePath) {
  let parts = String(filePath).split('\\')
  if (parts.length === 1) parts = String(filePath).split('/')
  const fileName = parts.pop()
  const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : ''
  const type = FILE_TYPES[ext] || {
    label: ext ? ext.toUpperCase() + ' File' : 'File',
    color: '#71717A',
    glyph: ext ? ext.slice(0, 3).toUpperCase() : '?',
    small: true,
  }
  return { fileName, ext, typeLabel: type.label, color: type.color, icon: <FileGlyph {...type} /> }
}

// ---- Stored file records ---------------------------------------------
// Entries used to be bare path strings; they carry an added-at stamp now so
// the list can show a date. Legacy strings are kept readable (date unknown)
// rather than dropped.
function normalizeFiles(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map((f) => (typeof f === 'string' ? { path: f, addedAt: null } : f))
    .filter((f) => f && typeof f.path === 'string')
}

function formatFileDate(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}  ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ---- Agent log entry types -------------------------------------------
// accent is an "r g b" triple so one rule can drive the node, rail dot and
// label chip; the icon is what the agent was doing at that step.
const THOUGHT_TYPES = {
  action: {
    label: 'Action',
    accent: '96 165 250',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
        <path strokeLinecap="round" strokeLinejoin="round" d="m9 6 7 6-7 6" />
      </svg>
    ),
  },
  observation: {
    label: 'Observation',
    accent: '52 211 153',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
        <circle cx="12" cy="12" r="2.6" />
      </svg>
    ),
  },
  status: {
    label: 'Status',
    accent: '192 132 252',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="8.5" />
        <path strokeLinecap="round" d="M12 11v5.2M12 7.9v.1" />
      </svg>
    ),
  },
  default: {
    label: 'Log',
    accent: '161 161 170',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
}

// A real folder rather than a line glyph: back panel, a sheet inside, and a
// front flap that tips open. The parts are animated from CSS (see .folder-ic).
function FolderIcon() {
  return (
    <svg viewBox="0 0 24 24" className="folder-ic" aria-hidden="true">
      <path
        className="fi-back"
        d="M2.6 6.4A1.8 1.8 0 0 1 4.4 4.6h4.1c.5 0 .96.2 1.3.55l1.35 1.35h8.45a1.8 1.8 0 0 1 1.8 1.8v9.3a1.8 1.8 0 0 1-1.8 1.8H4.4a1.8 1.8 0 0 1-1.8-1.8Z"
      />
      <rect className="fi-sheet" x="6.9" y="6.4" width="10.2" height="7.4" rx="1.1" />
      <path
        className="fi-front"
        d="M2.6 10.1h18.75v7.5a1.8 1.8 0 0 1-1.8 1.8H4.4a1.8 1.8 0 0 1-1.8-1.8Z"
      />
    </svg>
  )
}

// ---- Conversation helpers ----
const newId = () => `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
const blankConv = () => ({ id: newId(), title: 'New chat', messages: [], createdAt: Date.now() })

// Title a chat from its first user message, the way Claude does.
function deriveTitle(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return 'New chat'
  return clean.length > 40 ? clean.slice(0, 40).trimEnd() + '…' : clean
}

export default function App() {
  const [activeTab, setActiveTab] = useState('chat-view')
  // Agent Log and Workspace get the wide rectangular nav; Chat keeps the pill.
  const navWide = activeTab !== 'chat-view'

  // ---- Conversations (multi-chat + history) ----
  // Every launch opens on a fresh chat (so the welcome screen greets the
  // user), with previous conversations kept below it in the sidebar.
  const [deviceId] = useState(() => {
    let id = localStorage.getItem('syncmind_device_id')
    if (!id) {
      id = Date.now().toString(36) + '_' + Math.random().toString(36).slice(2)
      localStorage.setItem('syncmind_device_id', id)
    }
    return id
  })

  const [conversations, setConversations] = useState([])
  // null -> falls through to conversations[0], the fresh chat created above
  const [activeConvId, setActiveConvId] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [navHidden, setNavHidden] = useState(false)

  // ---- Theme (dark default, 'Warm Porcelain' light) ----
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('syncmind_theme') || 'dark' } catch { return 'dark' }
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('syncmind_theme', theme) } catch { /* ignore */ }
  }, [theme])

  const activeConv = conversations.find((c) => c.id === activeConvId) || conversations[0]
  const messages = activeConv ? activeConv.messages : []

  // Writes messages into the active conversation (accepts value or updater)
  const setMessages = useCallback((updater) => {
    setConversations((prev) => {
      const targetId = (prev.find((c) => c.id === activeConvId) || prev[0])?.id
      return prev.map((c) =>
        c.id === targetId
          ? { ...c, messages: typeof updater === 'function' ? updater(c.messages) : updater }
          : c
      )
    })
  }, [activeConvId])
  // Writes streamed text into the trailing assistant message of a
  // conversation, creating it on the first token.
  const writeStream = useCallback((convId, text, done = false) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c
        const msgs = [...c.messages]
        const last = msgs[msgs.length - 1]
        if (last && last.role === 'assistant' && last.streaming) {
          msgs[msgs.length - 1] = { ...last, content: text, streaming: !done }
        } else {
          msgs.push({ role: 'assistant', content: text, streaming: !done })
        }
        return { ...c, messages: msgs }
      })
    )
  }, [])

  const [thoughts, setThoughts] = useState([])
  const [files, setFiles] = useState([])
  const [userInput, setUserInput] = useState('')
  const [isIntroFinished, setIsIntroFinished] = useState(false)
  const [introPlaying, setIntroPlaying] = useState(true)
  const [showAttachMenu, setShowAttachMenu] = useState(false)
  const [selectedModel, setSelectedModel] = useState('Auto')
  const [showModelMenu, setShowModelMenu] = useState(false)
  const modelMenuRef = useRef(null)
  const modelPopoverRef = useRef(null)
  const [attachedFile, setAttachedFile] = useState(null)
  const [isThinking, setIsThinking] = useState(false) // TEMP: HF demo

  const [networkLog, setNetworkLog] = useState([])
  const [swarmStatus, setSwarmStatus] = useState(null)

  useEffect(() => {
    if (activeTab === 'network-view') {
      fetch('/api/network-log').then(r => r.json()).then(setNetworkLog).catch(() => {})
      const interval = setInterval(() => {
        fetch('/api/network-log').then(r => r.json()).then(setNetworkLog).catch(() => {})
      }, 2000)
      return () => clearInterval(interval)
    }
    if (activeTab === 'swarm-view') {
      fetch('/api/swarm-status').then(r => r.json()).then(setSwarmStatus).catch(() => {})
      const interval = setInterval(() => {
        fetch('/api/swarm-status').then(r => r.json()).then(setSwarmStatus).catch(() => {})
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [activeTab])

  // ---- Command palette (⌘K) ----
  const [cmdkOpen, setCmdkOpen] = useState(false)
  const [cmdkQuery, setCmdkQuery] = useState('')
  const [cmdkIndex, setCmdkIndex] = useState(0)

  // ---- Chat renaming state ----
  // ---- Chat renaming & grouping state ----
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
      fetch(`/api/chats/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ category: editGroupTitle.trim() })
      }).catch(()=>null)
    }
    setEditingGroupId(null)
  }

  // The UI reveal is chained off the welcome animation below, so the
  // headline lands before the chat bubble appears instead of racing it.

  const wsRef = useRef(null)
  const chatHistoryRef = useRef(null)
  const thoughtLogRef = useRef(null)
  const fileInputRef = useRef(null)
  const attachMenuRef = useRef(null)
  const attachPopoverRef = useRef(null)

  // Refs powering the nav segment indicator, welcome reveal & message reveal
  const segRefs = useRef({})
  const segIndicatorRef = useRef(null)
  const segGroupRef = useRef(null)
  const navBarRef = useRef(null)
  const navSettledWidth = useRef(0)
  const wsRowRefs = useRef([])
  const wsRevealed = useRef(0)
  const alItemRefs = useRef([])
  const alRevealed = useRef(0)
  const segAnimated = useRef(false)
  const welcomeRef = useRef(null)
  const msgRefs = useRef([])

  // Close attach menu on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      // The popover lives outside the toggle's wrapper, so it must be checked
      // too - otherwise mousedown on "Attach file" closed the menu before the
      // click landed and the file dialog never opened.
      const inToggle = attachMenuRef.current && attachMenuRef.current.contains(event.target)
      const inPopover = attachPopoverRef.current && attachPopoverRef.current.contains(event.target)
      if (!inToggle && !inPopover) setShowAttachMenu(false)
      
      const inModel = modelMenuRef.current && modelMenuRef.current.contains(event.target)
      const inModelPopover = modelPopoverRef.current && modelPopoverRef.current.contains(event.target)
      if (!inModel && !inModelPopover) setShowModelMenu(false)
    }
    if (showAttachMenu || showModelMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showAttachMenu, showModelMenu])

  const addThought = useCallback((type, content) => {
    setThoughts((prev) => [...prev, { type, content }])

    // Same "Generated Files:" parsing as original appendThought
    if (type === 'observation' && content.includes('Generated Files:')) {
      const filesLine = content.split('\n').find((l) => l.startsWith('Generated Files:'))
      if (filesLine) {
        const paths = filesLine.replace('Generated Files: ', '').split(', ')
        setFiles((prev) => {
          const known = new Set(prev.map((f) => f.path))
          const added = paths
            .map((p) => p.trim())
            .filter((p) => p && !known.has(p))
            .map((p) => ({ path: p, addedAt: Date.now() }))
          return added.length ? [...prev, ...added] : prev
        })
      }
    }
  }, [])

  // ---- Register global reset hook on mount ----
  useEffect(() => {
    window.clearSyncMindMemory = () => {
      localStorage.removeItem('syncmind_thoughts')
      localStorage.removeItem('syncmind_files')
      setThoughts([])
      setFiles([])
    }
  }, [])

  // ---- WebSocket connection ----
  useEffect(() => {
    if (!activeConvId) return;
    let reconnectTimer;
    
    function connect() {
      const ws = new WebSocket(`ws://${window.location.host}/ws/${activeConvId}`)
      wsRef.current = ws

      ws.onclose = () => {
        reconnectTimer = setTimeout(connect, 2000);
      }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'history') {
        setIsThinking(false)
        setMessages(data.messages.map((m) => ({ role: m.role, content: m.content })))
      } else if (data.type === 'message') {
        if (data.message.role === 'assistant') setIsThinking(false)
        setMessages((prev) => [...prev, { role: data.message.role, content: data.message.content }])
      } else if (['thought', 'action', 'observation', 'status'].includes(data.type)) {
        addThought(data.type, data.content)
      }
      }
    }
    connect();

    return () => {
      clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
      wsRef.current = null;
    }
  }, [addThought, activeConvId])

  // Keep activeConvId valid (first load / after deletes)
  useEffect(() => {
    if (activeConv && activeConv.id !== activeConvId) setActiveConvId(activeConv.id)
  }, [activeConv, activeConvId])

  // ---- Load conversations from API & Migrate old local chats ----
  useEffect(() => {
    const loadChats = async () => {
      // One-time migration for old local chats
      try {
        const local = JSON.parse(localStorage.getItem('syncmind_conversations') || 'null')
        if (Array.isArray(local) && local.length > 0) {
          for (const c of local) {
            await fetch('/api/chats', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ id: c.id, title: c.title || 'Local Chat', owner_id: deviceId })
            }).catch(()=>null)
          }
          localStorage.removeItem('syncmind_conversations')
        }
      } catch (e) {}

      // Fetch from API
      try {
          const [teamRes, personalRes] = await Promise.all([
            fetch('/api/chats?owner_id=TEAM'),
            fetch(`/api/chats?owner_id=${deviceId}`)
          ])
          const teamChats = await teamRes.json()
          const personalChats = await personalRes.json()
    
          const formatChat = (c, owner) => {
            let defaultGroup = owner === 'TEAM' ? 'Team Workspace' : 'Personal Workspace'
            return {
              id: c.id,
              title: c.title,
              group: (c.category && c.category !== 'Recents') ? c.category : defaultGroup,
              pinned: c.is_pinned,
              messages: [],
              owner_id: owner
            }
          }
    
          const allChats = [
            ...teamChats.map(c => formatChat(c, 'TEAM')),
            ...personalChats.map(c => formatChat(c, deviceId))
          ]
          
          if (allChats.length === 0) {
            await newChat('PERSONAL')
          } else {
            setConversations(allChats)
            setActiveConvId(allChats[0].id)
          }
      } catch (e) {
          console.error("Failed to load chats", e)
      }
    }
    loadChats()
  }, [deviceId])



  // ---- Auto-scroll chat ----
  // stickToBottom stays true while the reader is at the end; it flips off the
  // moment they scroll up so we never yank them away from what they're reading.
  const stickToBottom = useRef(true)
  const lastScrollTop = useRef(0)

  const scrollToBottom = useCallback((smooth = true) => {
    const el = chatHistoryRef.current
    if (!el) return
    if (smooth && typeof el.scrollTo === 'function') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }
    // Direct assignment always runs: smooth scrolling is animation-frame
    // driven and can stall, so this guarantees we land at the end.
    el.scrollTop = el.scrollHeight
  }, [])

  // Bubbles animate in, so their height keeps growing for ~1s after mount.
  // Re-pin on a short timed schedule (timers, unlike rAF/ResizeObserver,
  // keep firing in background tabs) so we settle at the true bottom.
  useEffect(() => {
    if (!stickToBottom.current) return
    scrollToBottom(true)
    const timers = [60, 160, 320, 550, 850].map((ms) =>
      setTimeout(() => {
        if (stickToBottom.current && chatHistoryRef.current) {
          chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight
        }
      }, ms)
    )
    return () => timers.forEach(clearTimeout)
  }, [messages, isThinking, scrollToBottom])

  // Messages animate in (height grows after mount) — keep pinned to the end
  // while that settles, and hide the nav bar once the reader moves down.
  useEffect(() => {
    const el = chatHistoryRef.current
    if (!el) return

    const ro = new ResizeObserver(() => {
      if (stickToBottom.current) el.scrollTop = el.scrollHeight
    })
    if (el.firstElementChild) ro.observe(el.firstElementChild)

    const onScroll = () => {
      const dist = el.scrollHeight - el.scrollTop - el.clientHeight
      stickToBottom.current = dist < 80

      const y = el.scrollTop
      if (y < 40) setNavHidden(false)
      else if (y > lastScrollTop.current + 6) setNavHidden(true)
      else if (y < lastScrollTop.current - 6) setNavHidden(false)
      lastScrollTop.current = y
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      ro.disconnect()
      el.removeEventListener('scroll', onScroll)
    }
  }, [activeTab, activeConv?.id])

  // Always start a chat pinned to the newest message
  useEffect(() => {
    stickToBottom.current = true
    setNavHidden(false)
    scrollToBottom(false)
  }, [activeConv?.id, scrollToBottom])

  useEffect(() => {
    if (thoughtLogRef.current) {
      thoughtLogRef.current.scrollTop = thoughtLogRef.current.scrollHeight
    }
  }, [thoughts])

  // ---- Slide the light pill under the active nav segment ----
  const moveSegIndicator = useCallback((animate = true) => {
    const btn = segRefs.current[activeTab]
    const ind = segIndicatorRef.current
    if (!btn || !ind) return

    // Snapping uses set(), not a zero-duration to(): a tween still renders on
    // the next tick, so back-to-back snaps let an older one write its stale
    // position last and strand the pill. set() applies synchronously.
    if (!animate) {
      gsap.set(ind, { x: btn.offsetLeft, width: btn.offsetWidth })
      return
    }
    gsap.to(ind, {
      x: btn.offsetLeft,
      width: btn.offsetWidth,
      duration: 0.5,
      ease: 'power3.out',
      overwrite: 'auto',
    })
  }, [activeTab])

  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      moveSegIndicator(segAnimated.current)
      segAnimated.current = true
    })
    return () => cancelAnimationFrame(raf)
  }, [activeTab, moveSegIndicator])

  // Snap into place once the intro reveals the bar, and on resize
  useEffect(() => {
    if (isIntroFinished) moveSegIndicator(false)
  }, [isIntroFinished, moveSegIndicator])

  useEffect(() => {
    const onResize = () => {
      moveSegIndicator(false)
      // The pill/rectangle both size off the viewport, so the cached width
      // used as the animation's starting point has to follow a resize.
      if (navBarRef.current && !navBarRef.current.style.width) {
        navSettledWidth.current = navBarRef.current.getBoundingClientRect().width
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [moveSegIndicator])

  // Second line of defence for the indicator. The segments change width when
  // the phone breakpoint swaps their labels for icons, and the resize handler
  // above can measure before that new layout exists; the observer fires after
  // layout, so between them the pill can't be left stranded off the active
  // tab. Both paths snap synchronously, so running twice costs nothing.
  useEffect(() => {
    const el = segGroupRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => moveSegIndicator(false))
    ro.observe(el)
    return () => ro.disconnect()
  }, [moveSegIndicator])

  // ---- Nav bar: pill on Chat, full-width rectangle on the other views ----
  // Both states are content/viewport sized, so `width` can't be transitioned
  // in CSS. We measure the outgoing width before React's class flip settles
  // and tween from it to the new natural width, then hand sizing back to CSS.
  useLayoutEffect(() => {
    const el = navBarRef.current
    if (!el) return

    const from = navSettledWidth.current
    const to = el.getBoundingClientRect().width

    if (!from || Math.abs(from - to) < 1) {
      navSettledWidth.current = to
      return
    }

    const settle = () => {
      // Hand sizing back to CSS so the bar keeps tracking the viewport.
      el.style.width = ''
      navSettledWidth.current = el.getBoundingClientRect().width
    }

    const tween = gsap.fromTo(
      el,
      { width: from },
      { width: to, duration: 0.62, ease: 'power3.inOut', onComplete: settle }
    )

    return () => {
      // An inline width only survives here if the tween was interrupted — a
      // fast second click, or a backgrounded tab whose ticker never ran. Take
      // the width actually on screen as the next tween's start, and drop the
      // stale inline value. A finished tween has already settled itself, so
      // this must not re-measure: that would overwrite the start width with
      // the incoming state's target and the next tween would have nothing to
      // travel.
      const onScreen = parseFloat(el.style.width) || 0
      tween.kill()
      if (onScreen) {
        el.style.width = ''
        navSettledWidth.current = onScreen
      }
    }
  }, [navWide])

  // ---- Command palette (⌘K) open/close ----
  const openCmdk = useCallback(() => {
    setCmdkQuery('')
    setCmdkIndex(0)
    setCmdkOpen(true)
  }, [])

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        if (cmdkOpen) setCmdkOpen(false)
        else openCmdk()
      } else if (e.key === 'Escape') {
        setCmdkOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [cmdkOpen, openCmdk])

  // ---- Welcome headline, then the chat bubble ----
  // The chat view unmounts when you leave the tab, so the words come back
  // hidden (.wr-word starts at opacity 0) and have to be revealed again on
  // every entry - a once-per-session guard here left the headline missing
  // for the rest of the session. The chat bubble is revealed from
  // onComplete so the two are sequenced rather than animating together.
  useEffect(() => {
    if (introPlaying) return

    const words = welcomeRef.current && welcomeRef.current.querySelectorAll('.wr-word')
    if (activeTab !== 'chat-view' || !words || !words.length) {
      setIsIntroFinished(true)   // nothing to play - reveal straight away
      return
    }

    gsap.fromTo(
      words,
      { opacity: 0, y: 42, scale: 0.94, filter: 'blur(16px)' },
      {
        opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
        duration: 1.05, ease: 'power3.out', stagger: 0.09, delay: 0.15,
        onComplete: () => setIsIntroFinished(true),
      }
    )

    // Failsafe: if the tab is throttled and onComplete never fires, the
    // headline and UI must still appear rather than staying hidden forever.
    const failsafe = setTimeout(() => {
      gsap.set(words, { opacity: 1, y: 0, scale: 1, filter: 'none' })
      setIsIntroFinished(true)
    }, 2600)
    return () => clearTimeout(failsafe)
  }, [activeTab, introPlaying])

  // ---- Smooth blur-to-clarity reveal for each new chat message ----
  useEffect(() => {
    const el = msgRefs.current[messages.length - 1]
    if (!el) return
    gsap.fromTo(
      el,
      { opacity: 0, y: 26, scale: 0.965, filter: 'blur(10px)' },
      {
        opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
        duration: 0.8, ease: 'power3.out',
        onComplete: () => { el.style.filter = '' },
      }
    )
  }, [messages.length])

  // ---- Workspace rows: staggered blur-to-clarity entry ----
  // Layout effect so the rows are hidden before the browser paints; without
  // it the list flashes in at full opacity and then animates from nothing.
  useLayoutEffect(() => {
    if (activeTab !== 'workspace-view') {
      wsRevealed.current = 0
      return
    }
    wsRowRefs.current.length = files.length
    const rows = wsRowRefs.current.filter(Boolean)
    // On entry every row is new; while the tab is already open only the file
    // that just landed animates, so the settled list doesn't restage itself.
    const fresh = rows.slice(wsRevealed.current)
    if (!fresh.length) return
    wsRevealed.current = rows.length

    gsap.fromTo(
      fresh,
      { opacity: 0, y: 10, filter: 'blur(8px)' },
      {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: 0.55, ease: 'power3.out', stagger: 0.045,
        onComplete: () => fresh.forEach((el) => { el.style.filter = '' }),
      }
    )
  }, [activeTab, files.length])

  // ---- Agent log entries: same staggered entry as the workspace rows ----
  // Steps arrive one at a time while the agent works, so only the new ones
  // animate; revisiting the tab replays the whole stream from the top.
  useLayoutEffect(() => {
    if (activeTab !== 'thought-view') {
      alRevealed.current = 0
      return
    }
    alItemRefs.current.length = thoughts.length
    const items = alItemRefs.current.filter(Boolean)
    const fresh = items.slice(alRevealed.current)
    if (!fresh.length) return
    alRevealed.current = items.length

    gsap.fromTo(
      fresh,
      { opacity: 0, x: -12, filter: 'blur(8px)' },
      {
        opacity: 1, x: 0, filter: 'blur(0px)',
        duration: 0.5, ease: 'power3.out', stagger: 0.05,
        onComplete: () => fresh.forEach((el) => { el.style.filter = '' }),
      }
    )
  }, [activeTab, thoughts.length])

  // ---- Chat management ----
  async function newChat(ownerType) {
    const owner = ownerType === 'TEAM' ? 'TEAM' : deviceId
    try {
        const res = await fetch('/api/chats', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ title: 'New Chat', category: 'Recents', owner_id: owner })
        })
        const data = await res.json()
        const fresh = {
          id: data.id,
          title: 'New Chat',
          messages: [],
          pinned: false,
          group: owner === 'TEAM' ? 'Team Workspace' : 'Personal Workspace',
          owner_id: owner
        }
        setConversations((prev) => [fresh, ...prev])
        setActiveConvId(fresh.id)
        setUserInput('')
        setActiveTab('chat-view')
        setThoughts([])
        setFiles([])
        if (window.innerWidth < 768) setSidebarOpen(false)
    } catch (e) {
        console.error("Failed to create chat", e)
    }
  }

  function selectChat(id) {
    if (id !== activeConvId) {
      setThoughts([])
      setFiles([])
    }
    setActiveConvId(id)
    setActiveTab('chat-view')
  }

  function togglePin(id, e) {
    if (e) e.stopPropagation()
    const conv = conversations.find(c => c.id === id)
    if (conv) {
      const newPinned = !conv.pinned
      setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: newPinned } : c)))
      fetch(`/api/chats/${id}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ is_pinned: newPinned })
      }).catch(()=>null)
    }
  }

  function toggleChatPrivacy(id, ownerType) {
    const owner = ownerType === 'TEAM' ? 'TEAM' : deviceId
    const newGroup = owner === 'TEAM' ? 'Team Workspace' : 'Personal Workspace'
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, owner_id: owner, group: newGroup } : c)))
    fetch(`/api/chats/${id}`, {
      method: 'PUT',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ owner_id: owner, category: newGroup })
    }).catch(()=>null)
  }

  function deleteChat(id, e) {
    if (e) e.stopPropagation()
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id)
      if (id === activeConvId && next.length > 0) setActiveConvId(next[0].id)
      return next
    })
    fetch(`/api/chats/${id}`, { method: 'DELETE' }).catch(()=>null)
  }

  function handleTabClick(targetId) {
    if (targetId === activeTab) return
    setActiveTab(targetId)
  }

  function handleSubmit(e) {
    e.preventDefault()
    const text = userInput.trim()
    if (!text && !attachedFile) return

    let fullMessage = text
    if (attachedFile) {
      fullMessage = text ? `${text}\n\n[Attached File: ${attachedFile.name}]` : `[Attached File: ${attachedFile.name}]`
    }

    // === Direct local-model path ============================
    // Talks to Ollama straight from the browser so chat renders without
    // the FastAPI backend running. chatEnabled() is always true now that
    // the only provider is local, so this path always wins over the
    // WebSocket below - gate it differently if the backend should answer.
    if (chatEnabled()) {
      const nextHistory = [...messages, { role: 'user', content: fullMessage }]
      // Write messages + auto-title the chat from its first user message
      setConversations((prev) => {
        const targetId = (prev.find((c) => c.id === activeConvId) || prev[0])?.id
        return prev.map((c) =>
          c.id === targetId
            ? {
                ...c,
                messages: nextHistory,
                title: c.messages.length === 0 ? deriveTitle(fullMessage) : c.title,
              }
            : c
        )
      })
      setUserInput('')
      setAttachedFile(null)
      setShowAttachMenu(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      setIsThinking(true)

      const convId = (activeConv && activeConv.id) || null
      // Coalesce tokens into ~40ms frames: a setState per token would
      // thrash React when a fast provider streams hundreds a second.
      let pending = null
      let lastFlush = 0
      let timer = null
      const flush = () => {
        timer = null
        if (pending === null) return
        lastFlush = Date.now()
        writeStream(convId, pending)
        pending = null
      }

      streamChat(nextHistory, {
        onToken: (visibleSoFar) => {
          setIsThinking(false)          // first token replaces the dots
          pending = visibleSoFar
          const since = Date.now() - lastFlush
          if (since >= 40) flush()
          else if (!timer) timer = setTimeout(flush, 40 - since)
        },
      })
        .then((full) => {
          if (timer) clearTimeout(timer)
          pending = null
          writeStream(convId, full || '_(no content)_', true)
        })
        .catch((err) => {
          if (timer) clearTimeout(timer)
          pending = null
          writeStream(convId, `⚠️ ${err.message}`, true)
        })
        .finally(() => setIsThinking(false))
      return
    }
    // === END TEMP ============================================

    if (!wsRef.current) return

    if (attachedFile) {
      const formData = new FormData()
      formData.append('file', attachedFile)
      const targetConvId = activeConvId || (conversations[0] && conversations[0].id)
      fetch(`/api/upload/${targetConvId}`, {
        method: 'POST',
        body: formData
      }).catch(err => console.error("Upload error:", err))
    }

    setIsThinking(true);
      wsRef.current.send(JSON.stringify({ type: 'query', message: fullMessage, model: selectedModel }))
    setUserInput('')
    setAttachedFile(null)
    setShowAttachMenu(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Anime.js press feedback for buttons with the "interactive-el" role
  function handlePressStart(e) {
    anime({ targets: e.currentTarget, scale: 0.95, duration: 100, easing: 'easeOutQuad' })
  }
  function handlePressEnd(e) {
    anime({ targets: e.currentTarget, scale: 1, duration: 200, easing: 'easeOutElastic(1, .5)' })
  }

  const tabs = [
    {
      id: 'chat-view',
      label: 'Chat',
      description: 'Interact with SyncMind Assistant',
      icon: (
        <svg className="ic-chat" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9">
          <path className="ic-chat-bubble" strokeLinecap="round" strokeLinejoin="round"
            d="M21 11.7c0 4.2-4 7.6-9 7.6a10.3 10.3 0 0 1-3.35-.55L3.9 20.4l1.5-3.65A7.2 7.2 0 0 1 3 11.7C3 7.5 7 4.1 12 4.1s9 3.4 9 7.6Z" />
          <circle className="ic-chat-d1" cx="8.4" cy="11.7" r="0.95" fill="currentColor" stroke="none" />
          <circle className="ic-chat-d2" cx="12" cy="11.7" r="0.95" fill="currentColor" stroke="none" />
          <circle className="ic-chat-d3" cx="15.6" cy="11.7" r="0.95" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      id: 'thought-view',
      label: 'Agent Log',
      description: 'Live thought stream & reasoning',
      icon: (
        <svg className="ic-log" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9">
          <path className="ic-log-page" strokeLinecap="round" strokeLinejoin="round"
            d="M13.6 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8.4L13.6 3Z" />
          <path className="ic-log-l1" strokeLinecap="round" d="M8.6 12.6h6.8" />
          <path className="ic-log-l2" strokeLinecap="round" d="M8.6 16.1h4.4" />
        </svg>
      ),
    },
    {
      id: 'workspace-view',
      label: 'Workspace',
      description: 'Generated documents & artifacts',
      icon: (
        <svg className="ic-basket" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9">
          <path className="ic-basket-handle" strokeLinecap="round" strokeLinejoin="round" d="M8.6 8.4 12 3.6l3.4 4.8" />
          <path className="ic-basket-body" strokeLinecap="round" strokeLinejoin="round"
            d="M3.4 8.4h17.2l-1.5 9.3a2.4 2.4 0 0 1-2.4 2h-9.4a2.4 2.4 0 0 1-2.4-2L3.4 8.4Z" />
        </svg>
      ),
    },
    {
      id: 'swarm-view',
      label: 'Swarm Status',
      description: 'Cluster nodes and task distribution',
      icon: (
        <svg className="ic-swarm" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9">
          <rect x="2" y="4" width="20" height="6" rx="2" />
          <rect x="2" y="14" width="20" height="6" rx="2" />
          <circle cx="6" cy="7" r="1" fill="currentColor" stroke="none" />
          <circle cx="6" cy="17" r="1" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      id: 'network-view',
      label: 'Network Proof',
      description: 'Air-gapped isolation intercept log',
      icon: (
        <svg className="ic-network" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
        </svg>
      ),
    },
  ]

  // ---- Command palette results (depends on `tabs`, so computed here) ----
  const cmdkResults = tabs.filter((t) => {
    const q = cmdkQuery.trim().toLowerCase()
    if (!q) return true
    return t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
  })

  function selectResult(tab) {
    if (tab) setActiveTab(tab.id)
    setCmdkOpen(false)
  }

  function handleCmdkKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCmdkIndex((i) => Math.min(i + 1, cmdkResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCmdkIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      selectResult(cmdkResults[cmdkIndex])
    }
  }

  // ---- Sidebar chat lists ----
  const pinnedChats = conversations.filter((c) => c.pinned)
  const otherChats = conversations.filter((c) => !c.pinned)

  const groupedChats = {}
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

  return (
    <div className="h-[100dvh] w-full flex flex-col antialiased relative">
      <ShaderBackground theme={theme} />

      {introPlaying && <IntroVideo onDone={() => setIntroPlaying(false)} />}

      {/* ---- Sidebar (chat history) ---- */}
      
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sb-head">
          <button className="sb-brand" onClick={() => { setActiveTab('chat-view'); setSidebarOpen(false) }}>
            <img className="brand-logo" src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'} alt="SyncMind" />
            <span className="nav-wordmark">SyncMind</span>
          </button>
          <button className="sb-close" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="flex gap-2 w-full px-3 mb-2 mt-4">
          <button className="sb-new flex-1 text-xs justify-center gap-1.5" style={{padding: '10px 12px'}} onClick={() => newChat('TEAM')}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Team</span>
          </button>
          <button className="sb-new flex-1 text-xs justify-center gap-1.5" style={{padding: '10px 12px'}} onClick={() => newChat('PERSONAL')}>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span>Personal</span>
          </button>
        </div>

        <nav className="sb-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`sb-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => { setActiveTab(tab.id); setSidebarOpen(false) }}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {pinnedChats.length > 0 && (
          <>
            <div className="sb-section">
              <span>Pinned</span>
              <span className="sb-count">{pinnedChats.length}</span>
            </div>
            <div className="sb-pinned-box">{pinnedChats.map(renderChatRow)}</div>
          </>
        )}

        <div className="sb-list mt-2 flex flex-col gap-4">
          {Object.entries(groupedChats).map(([groupName, chats]) => (
            <div key={groupName}>
              <div className="sb-section group relative flex items-center justify-between mb-1">
                <span className="font-semibold text-white/90">{groupName}</span>
                <span className="sb-count">{chats.length}</span>
                {chats.length > 0 && (
                   <button className="absolute right-8 opacity-0 group-hover:opacity-100 hover:text-white transition-opacity" onClick={(e) => startGroupEdit(chats[0], e)}>
                     <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15.2 5.2l3.5 3.5M9 11.5V15h3.5l9.5-9.5-3.5-3.5L9 11.5z"/></svg>
                   </button>
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                {chats.map(renderChatRow)}
              </div>
            </div>
          ))}
          {otherChats.length === 0 && <div className="sb-empty">No other chats</div>}
        </div>
      </aside>

      {/* Floating Segmented Navigation Bar — top center */}
      <aside
        ref={navBarRef}
        className={`fixed top-6 left-1/2 -translate-x-1/2 z-40 nav-bar ${
          isIntroFinished ? 'nav-in' : 'nav-out'
        } ${navHidden ? 'nav-away' : ''} ${navWide ? 'nav-wide' : ''}`}
      >
        <div className="nav-side">
        {/* Sidebar toggle */}
        <button className="nav-menu" onClick={() => setSidebarOpen(p => !p)} aria-label="Toggle sidebar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>

        {/* Brand logo */}
        <button className="nav-logo" onClick={() => setActiveTab('chat-view')} aria-label="SyncMind home">
          <img src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'} alt="SyncMind" />
        </button>

        <span className="nav-sep"></span>
        </div>

        <div className="nav-side">
        {/* Segmented control */}
        <div className="seg-group" ref={segGroupRef}>
          <span ref={segIndicatorRef} className="seg-indicator"></span>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                ref={(el) => { segRefs.current[tab.id] = el }}
                onClick={() => handleTabClick(tab.id)}
                className={`seg ${isActive ? 'active' : ''}`}
                title={tab.description}
              >
                {/* label on desktop, icon on phones - CSS swaps them */}
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        <span className="nav-sep"></span>

        {/* Theme toggle */}
        <button
          className="nav-menu"
          onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
          title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path strokeLinecap="round" d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />
            </svg>
          )}
        </button>
        </div>
      </aside>

      {/* Command Palette Overlay */}
      {cmdkOpen && (
        <div className="cmdk-overlay" onClick={() => setCmdkOpen(false)}>
          <div className="cmdk-panel" onClick={(e) => e.stopPropagation()}>
            <input
              autoFocus
              className="cmdk-input"
              placeholder="Jump to a view…"
              value={cmdkQuery}
              onChange={(e) => { setCmdkQuery(e.target.value); setCmdkIndex(0) }}
              onKeyDown={handleCmdkKeyDown}
            />
            <div className="cmdk-list">
              {cmdkResults.length === 0 && (
                <div className="cmdk-empty">No matching views</div>
              )}
              {cmdkResults.map((tab, i) => (
                <button
                  key={tab.id}
                  className={`cmdk-item ${i === cmdkIndex ? 'active' : ''}`}
                  onMouseEnter={() => setCmdkIndex(i)}
                  onClick={() => selectResult(tab)}
                >
                  <span className="cmdk-ic">{tab.icon}</span>
                  <span className="cmdk-item-label">{tab.label}</span>
                  <span className="cmdk-item-desc">{tab.description}</span>
                </button>
              ))}
            </div>
            <div className="cmdk-foot">
              <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
              <span><kbd>↵</kbd> select</span>
              <span><kbd>esc</kbd> close</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative z-10">
        {/* Chat View */}
        {activeTab === 'chat-view' && (() => {
          const isCentered = messages.length === 0 && userInput.trim() === ''
          return (
            <div className="h-full flex flex-col relative overflow-hidden">
              <div
                id="chat-history"
                ref={chatHistoryRef}
                className={`flex-1 overflow-y-auto px-3 sm:px-6 pt-28 transition-all duration-500 ${
                  isCentered ? 'pb-32' : 'pb-28'
                }`}
              >
                {/* Centered, readable conversation column */}
                <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      ref={(el) => { msgRefs.current[i] = el }}
                      className={`max-w-[95%] sm:max-w-[85%] md:max-w-[80%] rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 markdown-body ${
                        msg.role === 'user' ? 'bubble-user self-end' : 'bubble-ai self-start'
                      }`}
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(msg.content || '') + (msg.streaming ? '<span class="stream-caret"></span>' : ''),
                      }}
                    />
                  ))}

                  {/* TEMP: loading indicator */}
                  {isThinking && (
                    <div className="flex self-start px-5 py-6 items-center justify-center">
                      <div className="pulsing-circle" />
                    </div>
                  )}
                </div>
              </div>

              {/* Chat Bubble Pill Container */}
              <div className={`glass-pill-container ${isCentered ? 'centered' : 'docked'}`}>
                <div
                  className={`text-center transition-all duration-500 overflow-hidden pointer-events-none ${
                    isCentered
                      ? 'opacity-100 max-h-32 mb-8 transform translate-y-0'
                      : 'opacity-0 max-h-0 mb-0 transform -translate-y-4'
                  }`}
                >
                  <div className="welcome-reveal-wrapper">
                    <h1
                      ref={welcomeRef}
                      className="welcome-reveal-text text-3xl sm:text-4xl md:text-5xl font-extralight tracking-wide text-amber-50 my-0"
                    >
                      <span className="wr-word">Welcome</span>{' '}
              <span className="wr-word">to</span>{' '}
                      <span className="wr-word">Syncmind</span>
                    </h1>
                    
                    {/* SIH DEMO SCENARIOS */}
                    <div className="mt-8 flex flex-wrap justify-center gap-2 sm:gap-3 pointer-events-auto" style={{ opacity: isIntroFinished ? 1 : 0, transition: 'opacity 1s ease' }}>
                      <button type="button" onClick={() => {
                        setUserInput("Generate a bar chart comparing regional downtime using sample_data.csv and save it as a PNG file.");
                      }} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 rounded-full text-white/80 text-xs sm:text-sm transition-colors cursor-pointer border border-white/5">
                        Demo A: Analytics
                      </button>
                      
                      <button type="button" onClick={() => {
                        setUserInput("Write a python script that calculates the pressure drop of water flowing at 10 m/s through a 50m pipe with a diameter of 0.2m.");
                      }} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 rounded-full text-white/80 text-xs sm:text-sm transition-colors cursor-pointer border border-white/5">
                        Demo B: Python Script
                      </button>
                      
                      <button type="button" onClick={() => {
                        setUserInput("Read sample_report.pdf, extract all the key anomalies, and write a 1-page summary report in Word format.");
                      }} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-white/20 rounded-full text-white/80 text-xs sm:text-sm transition-colors cursor-pointer border border-white/5">
                        Demo C: Multimodal
                      </button>

                      <button type="button" onClick={() => {
                        setUserInput("Can you fetch the latest news from bbc.com for me?");
                      }} className="px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 hover:bg-red-500/30 rounded-full text-white/80 text-xs sm:text-sm transition-colors cursor-pointer border border-red-500/20">
                        Demo D: Test Air-Gap
                      </button>
                    </div>
                  </div>
                </div>

                {/* Floating Attach File Box above the chat bubble */}
                {showAttachMenu && (
                  <div ref={attachPopoverRef} className="mb-2 pl-3 flex items-center z-50 attach-menu-popover">
                    <button
                      type="button"
                      onClick={() => {
                        // Fire the picker in the same tick as the click so the
                        // browser still counts it as a user gesture.
                        fileInputRef.current?.click()
                        setShowAttachMenu(false)
                      }}
                      className="attach-btn group"
                    >
                      <div className="attach-btn-ic">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </div>
                      <span>Attach file</span>
                    </button>
                  </div>
                )}

                {/* Hidden file input — persists outside the popover */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setAttachedFile(e.target.files[0])
                    }
                  }}
                />

                  <div className="relative w-full">
                    {/* Floating Model Menu */}
                    {showModelMenu && (
                      <div ref={modelPopoverRef} className="absolute right-6 bottom-full mb-2 w-40 bg-[#1e1e1e] border border-white/10 rounded-xl shadow-2xl p-1.5 z-[9999] flex flex-col pointer-events-auto">
                        {['Auto', 'qwen2.5:7b', 'qwen2.5-coder:7b', 'llava'].map(m => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => { setSelectedModel(m); setShowModelMenu(false); }}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${selectedModel === m ? 'bg-white/10 text-white font-medium' : 'text-white/60 hover:bg-white/5 hover:text-white/90'}`}
                          >
                            {m === 'Auto' ? 'Auto Select (Swarm)' : m}
                          </button>
                        ))}
                      </div>
                    )}

                    <form
                      id="chat-form"
                  onSubmit={handleSubmit}
                  className={`glass-pill flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 shadow-2xl chat-bubble-intro ${
                    isIntroFinished ? 'revealed' : ''
                  }`}
                >
                  {/* + Button */}
                  <div className="relative shrink-0 flex items-center" ref={attachMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowAttachMenu((prev) => !prev)}
                      className={`plus-btn ${showAttachMenu ? 'open' : ''}`}
                      title="Attach options"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>

                  {/* Team/Personal Toggle */}
                  <div className="shrink-0 flex items-center bg-white/5 rounded-full p-0.5 border border-white/5 shadow-inner">
                    <button
                      type="button"
                      onClick={() => toggleChatPrivacy(activeConv?.id, 'TEAM')}
                      className={`px-3 py-1.5 rounded-full text-[11.5px] font-medium transition-colors ${activeConv?.owner_id === 'TEAM' ? 'bg-[#292929] text-white shadow shadow-black/20' : 'text-white/40 hover:text-white/70'}`}
                    >
                      Team
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleChatPrivacy(activeConv?.id, 'PERSONAL')}
                      className={`px-3 py-1.5 rounded-full text-[11.5px] font-medium transition-colors ${activeConv?.owner_id !== 'TEAM' ? 'bg-[#292929] text-white shadow shadow-black/20' : 'text-white/40 hover:text-white/70'}`}
                    >
                      Personal
                    </button>
                  </div>

                  {/* Attached File Chip (if any) */}
                  {attachedFile && (
                    <div className="file-chip">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      <span className="max-w-[120px] truncate">{attachedFile.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setAttachedFile(null)
                          if (fileInputRef.current) fileInputRef.current.value = ''
                        }}
                        className="file-chip-x"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  <input
                    id="user-input"
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="pill-input"
                    placeholder="Ask a question, query the SOP, or request a Python script..."
                    autoComplete="off"
                  />
                  {/* Model Selector */}
                  <div className="relative shrink-0 flex items-center pr-2" ref={modelMenuRef}>
                    <button
                      type="button"
                      onClick={() => setShowModelMenu(p => !p)}
                      className={`text-[11.5px] font-medium tracking-wide flex items-center gap-1 transition-colors ${showModelMenu ? 'text-white' : 'text-white/70 hover:text-white'}`}
                    >
                      {selectedModel === 'Auto' ? 'Auto Select' : selectedModel}
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  <button
                    type="submit"
                    onMouseDown={handlePressStart}
                    onMouseUp={handlePressEnd}
                    className="send-btn"
                    aria-label="Send"
                    title="Send"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </form>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Thought Stream View */}
        {activeTab === 'thought-view' && (
          <div className="al-view">
            <section className="al-panel">
              <header className="al-head">
                <span className={`al-head-ic ${isThinking ? 'busy' : ''}`}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                    <path pathLength="1" strokeLinecap="round" strokeLinejoin="round"
                      d="M2.5 12h3.3l2-4.6 3.1 9.2 2.6-6.3 1.5 3.4h2.2" />
                    <circle cx="20.4" cy="13.7" r="1.5" fill="currentColor" stroke="none" />
                  </svg>
                </span>
                <div className="al-head-txt">
                  <h2 className="al-title">Agent Thought Stream</h2>
                  <p className="al-sub">
                    {thoughts.length === 0
                      ? 'Idle · no steps recorded'
                      : `${thoughts.length} step${thoughts.length === 1 ? '' : 's'} · in order of execution`}
                  </p>
                </div>
              </header>

              <div id="thought-log" className="al-stream" ref={thoughtLogRef}>
                {thoughts.length === 0 ? (
                  <div className="al-empty">
                    <div className="al-empty-ic">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                        <path pathLength="1" strokeLinecap="round" strokeLinejoin="round"
                          d="M2.5 12h4l2-5 3 10 2.5-6 1.6 3.6h6" />
                      </svg>
                    </div>
                    <h3 className="al-empty-title">Agent initialised and standing by</h3>
                    <p className="al-empty-sub">
                      Every action it takes, what it observes back, and its status
                      updates will stream here as it works.
                    </p>
                  </div>
                ) : (
                  <ol className="al-list">
                    {[...thoughts].reverse().map((t, index) => {
                      const i = thoughts.length - 1 - index
                      const type = THOUGHT_TYPES[t.type] || THOUGHT_TYPES.default
                      return (
                        <li
                          key={i}
                          ref={(el) => { alItemRefs.current[i] = el }}
                          className="al-item"
                          style={{ '--al-accent': type.accent }}
                        >
                          <span className="al-node">{type.icon}</span>
                          <div className="al-body">
                            <div className="al-meta">
                              <span className="al-type">{type.label}</span>
                              <span className="al-step">Step {i + 1}</span>
                            </div>
                            <pre className="al-text">{t.content}</pre>
                          </div>
                        </li>
                      )
                    })}
                  </ol>
                )}
              </div>
            </section>
          </div>
        )}

        {/* Workspace View */}
        {activeTab === 'workspace-view' && (
          <div className="ws-view">
            <section className="ws-panel">
              <header className="ws-head">
                <span className="ws-head-ic"><FolderIcon /></span>
                <div className="ws-head-txt">
                  <h2 className="ws-title">Generated Deliverables</h2>
                  <p className="ws-sub">
                    {files.length === 0
                      ? 'Local storage · empty'
                      : `${files.length} item${files.length === 1 ? '' : 's'} · stored locally`}
                  </p>
                </div>
              </header>

              {/* id kept for the backend: it wraps both states so the node is
                  always in the DOM, not only once files exist */}
              <div id="file-grid" className="ws-body">
              {files.length === 0 ? (
                <div className="ws-empty">
                  <div className="ws-empty-ic">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M4 7.5A1.5 1.5 0 0 1 5.5 6h3.2a1.5 1.5 0 0 1 1.06.44l1.24 1.24H18.5A1.5 1.5 0 0 1 20 9.18v8.32A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z" />
                    </svg>
                  </div>
                  <h3 className="ws-empty-title">This folder is empty</h3>
                  <p className="ws-empty-sub">
                    Documents, decks, spreadsheets and scripts the agent generates
                    are stored here.
                  </p>
                </div>
              ) : (
                <div className="ws-table" role="table">
                  <div className="ws-cols" role="row">
                    <span role="columnheader">Name</span>
                    <span className="ws-cell-date" role="columnheader">Date created</span>
                    <span className="ws-cell-type" role="columnheader">Type</span>
                    <span />
                  </div>

                  <div className="ws-rows">
                    {files.map((file, i) => {
                      const meta = getFileMeta(file.path)
                      return (
                        <div
                          key={file.path}
                          ref={(el) => { wsRowRefs.current[i] = el }}
                          className="ws-row"
                          role="row"
                          title={file.path}
                        >
                          <span className="ws-cell ws-cell-name" role="cell">
                            <span className="ws-row-ic">{meta.icon}</span>
                            <span className="ws-row-name">{meta.fileName}</span>
                          </span>
                          <span className="ws-cell ws-cell-date" role="cell">
                            {formatFileDate(file.addedAt)}
                          </span>
                          <span className="ws-cell ws-cell-type" role="cell">
                            {meta.typeLabel}
                          </span>
                          <a
                            href={`/download?path=${encodeURIComponent(file.path)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="ws-row-dl"
                            title={`Download ${meta.fileName}`}
                            aria-label={`Download ${meta.fileName}`}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v11m0 0 4-4m-4 4-4-4M5 19h14" />
                            </svg>
                          </a>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              </div>
            </section>
          </div>
        )}

        {/* Swarm View */}
        {activeTab === 'swarm-view' && (
          <div className="ws-view">
            <section className="ws-panel">
              <header className="ws-head">
                <span className="ws-head-ic">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9">
                    <rect x="2" y="4" width="20" height="6" rx="2" />
                    <rect x="2" y="14" width="20" height="6" rx="2" />
                    <circle cx="6" cy="7" r="1" fill="currentColor" stroke="none" />
                    <circle cx="6" cy="17" r="1" fill="currentColor" stroke="none" />
                  </svg>
                </span>
                <div className="ws-head-txt">
                  <h2 className="ws-title">Swarm Status</h2>
                  <p className="ws-sub">Live health and task distribution across Ollama nodes</p>
                </div>
              </header>
              <div className="ws-body">
                <div className="ws-table ws-table-swarm" role="table">
                  <div className="ws-cols" role="row">
                    <span role="columnheader">Node</span>
                    <span className="ws-cell-date" role="columnheader">Status</span>
                    <span className="ws-cell-type" role="columnheader">Model</span>
                    <span role="columnheader">Last Task</span>
                  </div>
                  <div className="ws-rows">
                    {swarmStatus?.nodes?.map((node, i) => (
                      <div key={node.node} className="ws-row" role="row">
                          <span className="ws-cell ws-cell-name" role="cell">
                            <span className="ws-row-name">{node.name || node.node}</span>
                          </span>
                        <span className="ws-cell ws-cell-date" role="cell" style={{ color: node.status === 'idle' ? '#52D399' : '#C084FC' }}>
                          {node.status}
                        </span>
                        <span className="ws-cell ws-cell-type" role="cell">
                          {node.model || 'none'}
                        </span>
                        <span className="ws-cell" role="cell">
                          {node.last_task || 'none'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Network Proof View */}
        {activeTab === 'network-view' && (
          <div className="ws-view">
            <section className="ws-panel">
              <header className="ws-head">
                <span className="ws-head-ic">
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.9">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                  </svg>
                </span>
                <div className="ws-head-txt">
                  <h2 className="ws-title">Network Intercept Log</h2>
                  <p className="ws-sub">Air-gap enforcement monitor</p>
                </div>
              </header>
              <div className="ws-body">
                <div className="ws-table ws-table-network" role="table">
                  <div className="ws-cols" role="row">
                    <span role="columnheader">Timestamp</span>
                    <span className="ws-cell-name" role="columnheader">URL</span>
                    <span className="ws-cell-type" role="columnheader">Status</span>
                  </div>
                  <div className="ws-rows">
                    {networkLog?.map((log, i) => (
                      <div key={i} className="ws-row" role="row">
                        <span className="ws-cell" role="cell" style={{ width: '180px', opacity: 0.6 }}>
                          {log.timestamp}
                        </span>
                        <span className="ws-cell ws-cell-name" role="cell" style={{ fontFamily: 'monospace', opacity: 0.9 }}>
                          {log.url}
                        </span>
                        <span className="ws-cell ws-cell-type" role="cell" style={{ color: log.status.includes('BLOCKED') ? '#ef4444' : '#52D399', fontWeight: 600 }}>
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  )
}