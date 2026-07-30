import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { useAuth } from '../context/AuthContext'
import { getToken } from '../services/auth'
import { sendChatMessage } from '../services/api'
import { BookOpen, FolderOpen, Layers, Clock, Play, Pause, BrainCircuit, CheckCircle2, ChevronRight, X, Send, Loader2 } from 'lucide-react'
import { SEMESTERS, SUBJECTS_BY_SEM, getModulesForSubject } from '../data/learningContent'
import './Learning.css'

export default function Learning() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  
  const isStudent = profile?.role === 'student'
  // Student's semester is parsed from their classId (e.g. AIML-SEM3 -> 3) or profile.semester
  const profileSem = parseInt(profile?.semester || profile?.classId?.replace('AIML-SEM', '') || '5')

  // UI State
  const [semester, setSemester] = useState(isStudent ? profileSem.toString() : '3')
  const [subject, setSubject] = useState(SUBJECTS_BY_SEM[semester]?.[0] || '')
  const [modules, setModules] = useState([])
  const [selectedModule, setSelectedModule] = useState(null)

  // Timer State
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [timerRunning, setTimerRunning] = useState(false)
  const timerRef = useRef(null)

  // AI Tutor State
  const [aiOpen, setAiOpen] = useState(false)
  const [aiMsgs, setAiMsgs] = useState([])
  const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const msgsEndRef = useRef(null)

  // Sync subjects when semester changes
  useEffect(() => {
    const subs = SUBJECTS_BY_SEM[semester] || []
    if (!subs.includes(subject)) {
      setSubject(subs[0] || '')
    }
  }, [semester])

  // Sync modules when subject changes
  useEffect(() => {
    if (subject) {
      setModules(getModulesForSubject(subject))
    } else {
      setModules([])
    }
    // Clear selection when navigating away
    setSelectedModule(null)
    setTimerSeconds(0)
    setTimerRunning(false)
  }, [subject])

  // Auto-scroll AI chat
  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMsgs])

  // Timer effect
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => setTimerSeconds(s => s + 1), 1000)
    } else {
      clearInterval(timerRef.current)
    }
    return () => clearInterval(timerRef.current)
  }, [timerRunning])

  const handleOpenModule = (mod) => {
    setSelectedModule(mod)
    setTimerSeconds(0)
    setTimerRunning(true)
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const sec = (s % 60).toString().padStart(2, '0')
    return `${m}:${sec}`
  }

  const handleMarkComplete = () => {
    setTimerRunning(false)
    navigate('/quiz', {
      state: {
        semester,
        subject,
        module: selectedModule.title,
        timeSpent: timerSeconds
      }
    })
  }

  const handleAiSend = async (e) => {
    e?.preventDefault()
    if (!aiInput.trim() || aiLoading) return

    const userText = aiInput.trim()
    setAiInput('')
    setAiMsgs(prev => [...prev, { role: 'user', content: userText }])
    setAiLoading(true)

    try {
      const token = await getToken()
      // Send contextual message
      const contextPrefix = selectedModule 
        ? `The student is currently reading: "${selectedModule.title}" (Semester ${semester} - ${subject}). ` 
        : `The student is browsing Semester ${semester} - ${subject}. `
      
      const payload = [
        ...aiMsgs.slice(-5), 
        { role: 'user', content: contextPrefix + userText }
      ]

      const data = await sendChatMessage(payload, profile?.role || 'student', semester, token)
      setAiMsgs(prev => [...prev, { role: 'assistant', content: data.reply || 'Sorry, I could not generate a response.' }])
    } catch (err) {
      setAiMsgs(prev => [...prev, { role: 'assistant', content: 'Error connecting to AI Tutor.' }])
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="page-inner learning-page">
      <div className="learning-layout">
        
        {/* ── Sidebar ── */}
        <div className="learning-sidebar">
          <div style={{ marginBottom: '1rem' }}>
            <label className="input-label" style={{ marginBottom: '0.25rem' }}>Select Semester</label>
            <select 
              className="input-field" 
              value={semester} 
              onChange={e => setSemester(e.target.value)}
              disabled={isStudent}
              style={{ padding: '0.4rem', fontSize: '0.9rem', width: '100%', textOverflow: 'ellipsis', overflow: 'hidden' }}
            >
              {SEMESTERS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label className="input-label" style={{ marginBottom: '0.25rem' }}>Select Subject</label>
            <select 
              className="input-field" 
              value={subject} 
              onChange={e => setSubject(e.target.value)}
              style={{ padding: '0.4rem', fontSize: '0.9rem', width: '100%', textOverflow: 'ellipsis', overflow: 'hidden' }}
            >
              {(SUBJECTS_BY_SEM[semester] || []).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div style={{ padding: '0.5rem 0', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)', marginBottom: '0.5rem' }}>
            Modules
          </div>

          <div className="chapter-list">
            {modules.length > 0 ? modules.map(mod => (
              <button 
                key={mod.id}
                className={`chapter-item ${selectedModule?.id === mod.id ? 'active' : ''}`}
                onClick={() => handleOpenModule(mod)}
              >
                <FolderOpen size={16} />
                <span className="chapter-title">{mod.title}</span>
                <ChevronRight size={14} className="chapter-arrow" />
              </button>
            )) : (
              <div className="chapter-empty">
                <Layers size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                <div>No content uploaded yet for this subject.</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Main Viewer ── */}
        <div className="learning-viewer">
          {selectedModule ? (
            <>
              <div className="viewer-header">
                <div>
                  <div className="viewer-title">{selectedModule.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                    Semester {semester} · {subject}
                  </div>
                </div>

                <div className="viewer-actions">
                  <div className="reading-timer">
                    <Clock size={14} color="var(--primary)" />
                    <span className="timer-display">{formatTime(timerSeconds)}</span>
                    <button 
                      className="btn timer-toggle" 
                      onClick={() => setTimerRunning(!timerRunning)}
                      title={timerRunning ? "Pause" : "Resume"}
                    >
                      {timerRunning ? <Pause size={10} /> : <Play size={10} style={{ marginLeft: 2 }} />}
                    </button>
                  </div>
                  
                  <button className="btn btn-sm" onClick={() => setAiOpen(!aiOpen)} style={{ background: 'var(--color-lavender-soft)', color: 'var(--color-lavender)', borderColor: 'var(--color-lavender)' }}>
                    <BrainCircuit size={16} />
                    <span className="hide-mobile">Ask AI</span>
                  </button>
                  
                  <button className="btn btn-sm complete-btn" onClick={handleMarkComplete}>
                    <CheckCircle2 size={16} color="white" />
                    <span style={{ color: 'white' }}>Complete</span>
                  </button>
                </div>
              </div>

              <iframe src={selectedModule.file} className="pdf-iframe" title="PDF Viewer" />

              {/* ── AI Tutor Overlay ── */}
              <AnimatePresence>
                {aiOpen && (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    style={{ position: 'absolute', top: 0, right: 0, height: '100%', zIndex: 10 }}
                  >
                    <div className="ai-sidebar">
                      <div className="ai-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                          <BrainCircuit size={18} color="var(--primary)" /> AI Tutor
                        </div>
                        <button className="icon-btn" onClick={() => setAiOpen(false)}><X size={18} /></button>
                      </div>
                      
                      <div className="ai-messages">
                        {aiMsgs.length === 0 && (
                          <div className="ai-welcome">
                            <BrainCircuit size={32} color="var(--color-lavender)" />
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              Ask me anything about {selectedModule.title} or {subject}!
                            </p>
                          </div>
                        )}
                        {aiMsgs.map((msg, i) => (
                          <div key={i} className={`ai-bubble ${msg.role}`}>
                            {msg.role === 'assistant' && <BrainCircuit size={14} style={{ flexShrink: 0 }} />}
                            <div className="markdown-body" style={{ overflowWrap: 'break-word', wordBreak: 'break-word', minWidth: 0, width: '100%' }}>
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                              </div>
                          </div>
                        ))}
                        {aiLoading && (
                          <div className="ai-bubble assistant">
                            <Loader2 size={14} className="spin-anim" /> Thinking...
                          </div>
                        )}
                        <div ref={msgsEndRef} />
                      </div>

                      <form onSubmit={handleAiSend} className="ai-input-row">
                        <input 
                          className="input-field" 
                          style={{ flex: 1, fontSize: '0.85rem', padding: '0.5rem' }}
                          placeholder="Ask a question..."
                          value={aiInput}
                          onChange={e => setAiInput(e.target.value)}
                        />
                        <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem' }} disabled={aiLoading || !aiInput.trim()}>
                          <Send size={16} />
                        </button>
                      </form>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="viewer-empty">
              <BookOpen size={48} color="var(--border-color)" />
              <div style={{ color: 'var(--text-muted)' }}>Select a module from the sidebar to begin reading.</div>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
