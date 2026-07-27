// src/pages/Chatbot.jsx
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { Send, Trash2, Bot, User, Loader, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getToken } from '../services/auth'
import { sendChatMessage } from '../services/api'
import './Chatbot.css'

const GROQ_API_KEY  = import.meta.env.VITE_GROQ_API_KEY || ''
const FUNCTIONS_URL = import.meta.env.VITE_CLOUD_FUNCTIONS_BASE_URL || ''

const SYSTEM_PROMPT = `You are an AI Tutor for BNM Institute of Technology (BNMIT), Bangalore, India.
You help students and faculty with:
- Engineering and technology subjects (CS, ECE, Mechanical, Civil, etc.)
- Programming, algorithms, data structures, DBMS, OS, and related topics
- Exam preparation, study strategies, and concept explanations
- Academic schedule and attendance queries

Rules:
- Keep responses clear, concise, and technically accurate
- When explaining complex topics, break them into simple steps with examples
- Use real-world engineering examples where possible
- Be encouraging and constructive in feedback
- If asked about something outside engineering/education scope, gently redirect
- Respond in the same language the student writes in (English or any Indian language)
- Format responses with bullet points or numbered lists when explaining steps or procedures
- IMPORTANT: Do NOT use any markdown formatting. No **bold**, no *italic*, no __underline__, no # headings, no === underlines. Plain text only. Use dashes (-) for bullet points and numbers for lists.`

async function groqDirect(messages, userRole) {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: `${SYSTEM_PROMPT}\nCurrent user role: ${userRole}` },
        ...messages.slice(-10).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content })),
      ],
      max_tokens: 512,
      temperature: 0.7,
    }),
  })
  if (!res.ok) throw new Error(`Groq error ${res.status}`)
  const data = await res.json()
  return data.choices[0]?.message?.content || 'I could not generate a response.'
}

const SUGGESTED = [
  'Explain time complexity of binary search',
  'What is process scheduling in OS?',
  'How do I prepare for DBMS exam?',
  'Explain normalization with an example',
  'What are the SOLID principles in OOP?',
]

export default function Chatbot() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Namaste! 🙏 I'm your BNMIT AI Tutor. I can help you with engineering subjects, programming concepts, exam prep, and more. What would you like to learn today?`,
    },
  ])
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text) => {
    const content = (text || input).trim()
    if (!content || loading) return
    setInput('')

    const userMsg = { role: 'user', content }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)

    try {
      let reply
      if (FUNCTIONS_URL) {
        // Use deployed Cloud Function when URL is configured
        const token = await getToken()
        const history = [...messages, userMsg].slice(-10)
        const data = await sendChatMessage(history, profile?.role, profile?.grade, token)
        reply = data.reply
      } else if (GROQ_API_KEY) {
        // Direct Groq call (local dev fallback)
        const history = [...messages, userMsg]
        reply = await groqDirect(history, profile?.role || 'student')
      } else {
        throw new Error('No API configured. Add VITE_GROQ_API_KEY to your .env file.')
      }
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `⚠️ ${err.message || 'Could not connect. Please check your API configuration.'}`,
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setMessages([{
      role: 'assistant',
      content: 'Chat cleared! What would you like to learn? 😊',
    }])
  }

  return (
    <div className="page-inner chatbot-page">
      <div className="page-header chatbot-header">
        <div>
          <h1 className="page-title">🤖 {t('chatbot')}</h1>
          <p className="page-subtitle">{t('chatbot_subtitle', 'Powered by Groq LLaMA 3.3-70B · Context-aware NCERT tutor')}</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={handleClear} id="clear-chat-btn">
          <Trash2 size={14} /> {t('clear_chat')}
        </button>
      </div>

      <div className="chatbot-container">
        {/* Messages */}
        <div className="chatbot-messages">
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                className={`chat-message ${msg.role}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="chat-avatar">
                  {msg.role === 'assistant'
                    ? <Bot size={16} />
                    : <User size={16} />
                  }
                </div>
                <div className="chat-bubble">
                  {msg.content.split('\n').map((line, j) => (
                    <span key={j}>
                      {line}
                      {j < msg.content.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div
              className="chat-message assistant"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="chat-avatar"><Bot size={16} /></div>
              <div className="chat-bubble typing">
                <span /><span /><span />
              </div>
            </motion.div>
          )}
          <div ref={endRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="chat-suggestions">
            <p className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>
              <Sparkles size={12} style={{ display:'inline', marginRight:4 }} />
              {t('try_asking', 'Try asking:')}
            </p>
            <div className="suggestions-grid">
              {SUGGESTED.map((s, i) => (
                <button key={i} className="suggestion-chip" onClick={() => handleSend(t(`suggested_${i+1}`, s))}>
                  {t(`suggested_${i+1}`, s)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input bar */}
        <div className="chat-input-bar">
          <input
            id="chat-input"
            className="input chat-input"
            placeholder={t('chat_placeholder')}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
            disabled={loading}
          />
          <motion.button
            className="btn btn-primary chat-send-btn"
            onClick={() => handleSend()}
            disabled={loading || !input.trim()}
            whileTap={{ scale: 0.92 }}
            id="chat-send-btn"
          >
            {loading ? <Loader size={18} className="spin-anim" /> : <Send size={18} />}
          </motion.button>
        </div>
      </div>
    </div>
  )
}
