import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Network, FlaskConical, Sigma, Layers,
  BookOpen, ClipboardCheck, Calendar,
  MessageCircle, Brain,
  Cpu, Eye, Database, Cloud, Code2, BarChart3
} from 'lucide-react'
import './Dashboard.css'

// ── AIML subjects across all semesters ───────────────────────────────────
const STUDENT_SUBJECTS = [
  { code: '21AI501', name: 'Machine Learning',            sem: 5, icon: Cpu,          color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { code: '21AI502', name: 'Deep Learning',               sem: 5, icon: Brain,        color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { code: '21AI503', name: 'Natural Language Processing', sem: 5, icon: MessageCircle,color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { code: '21AI504', name: 'Computer Vision',             sem: 5, icon: Eye,          color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { code: '21AI505', name: 'Big Data Analytics',          sem: 5, icon: Database,     color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { code: '21AI506', name: 'Cloud Computing',             sem: 5, icon: Cloud,        color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
]

// Teacher subjects span multiple semesters
const TEACHER_SUBJECTS = [
  { code: '21AI101', name: 'Programming Fundamentals',    sem: 1, icon: Code2,        color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { code: '21AI102', name: 'Engineering Mathematics I',   sem: 1, icon: Sigma,        color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { code: '21AI201', name: 'Data Structures',             sem: 2, icon: Layers,       color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { code: '21AI202', name: 'Engineering Mathematics II',  sem: 2, icon: Sigma,        color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { code: '21AI301', name: 'Database Management Systems', sem: 3, icon: Database,     color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { code: '21AI302', name: 'Statistics for AI',           sem: 3, icon: BarChart3,    color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { code: '21AI401', name: 'Introduction to AI',          sem: 4, icon: Brain,        color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { code: '21AI402', name: 'Computer Networks',           sem: 4, icon: Network,      color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { code: '21AI501', name: 'Machine Learning',            sem: 5, icon: Cpu,          color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { code: '21AI502', name: 'Deep Learning',               sem: 5, icon: Brain,        color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { code: '21AI503', name: 'Natural Language Processing', sem: 5, icon: MessageCircle,color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { code: '21AI504', name: 'Computer Vision',             sem: 5, icon: Eye,          color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { code: '21AI505', name: 'Big Data Analytics',          sem: 5, icon: Database,     color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { code: '21AI506', name: 'Cloud Computing',             sem: 5, icon: Cloud,        color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { code: '21AI601', name: 'Reinforcement Learning',      sem: 6, icon: FlaskConical, color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { code: '21AI602', name: 'AI Ethics & Policy',          sem: 6, icon: BookOpen,     color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
]

// Group subjects by semester → { 1: [...], 2: [...], ... }
function groupBySem(subjects) {
  return subjects.reduce((acc, s) => {
    if (!acc[s.sem]) acc[s.sem] = []
    acc[s.sem].push(s)
    return acc
  }, {})
}

const STUDENT_QUICK_ACTIONS = [
  { to: '/learning',   label: 'Learning Resources', icon: BookOpen,       color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { to: '/attendance', label: 'Attendance',          icon: ClipboardCheck, color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { to: '/timetable',  label: 'Timetable',           icon: Calendar,       color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { to: '/chatbot',    label: 'AI Tutor',             icon: Brain,          color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
]

// Base actions every teacher sees
const TEACHER_ACTIONS_NO_MANAGE = [
  { to: '/attendance', label: 'Start Attendance Session', icon: ClipboardCheck, color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { to: '/timetable',  label: 'My Schedule',              icon: Calendar,       color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
]

// Actions for teachers with timetable manager access
const TEACHER_ACTIONS_WITH_MANAGE = [
  { to: '/attendance',       label: 'Start Attendance Session', icon: ClipboardCheck, color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { to: '/timetable-manage', label: 'Manage Timetable',         icon: Calendar,       color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { to: '/timetable',        label: 'My Schedule',              icon: Calendar,       color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
]

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } }
const item      = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate    = useNavigate()
  const isTeacher   = profile?.role === 'teacher'
  const canManage   = isTeacher && profile?.timetableManager === true

  const teacherActions = canManage ? TEACHER_ACTIONS_WITH_MANAGE : TEACHER_ACTIONS_NO_MANAGE

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <div className="page-inner">
      {/* ── Header ── */}
      <motion.div
        className="dashboard-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{today}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
            {isTeacher ? (
            <>
              <span className="badge badge-teal" style={{ fontSize: '0.8rem', padding: '0.35rem 0.9rem' }}>
                AIML Department
              </span>
            </>
          ) : (
            <>
              <span className="badge badge-orange" style={{ fontSize: '0.8rem', padding: '0.35rem 0.9rem' }}>
                AIML · Semester 5
              </span>
              <span className="badge" style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                USN: {profile?.usn || '—'}
              </span>
            </>
          )}
        </div>
      </motion.div>

      {/* ── Profile Banner ── */}
      <motion.div
        className="card"
        style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', background: 'linear-gradient(135deg, rgba(247,127,50,0.12) 0%, rgba(232, 93, 4,0.08) 100%)', border: '1px solid rgba(247,127,50,0.2)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div style={{ width: 52, height: 52, borderRadius: 0, background: 'linear-gradient(135deg, #ea580c, #e85d04)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '1.4rem', fontWeight: 700, flexShrink: 0 }}>
          {profile?.name?.[0] || '?'}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
            {isTeacher ? 'Prof. ' : ''}{profile?.name || 'Welcome'}
          </div>
          <div className="text-muted text-sm">
            {isTeacher
              ? 'AIML Department · BNM Institute of Technology'
              : `${profile?.department || 'AIML'} · Sem ${profile?.semester || 5} · BNMIT`}
          </div>
          {!isTeacher && profile?.usn && (
            <div style={{ marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{
                display: 'inline-block', padding: '0.15rem 0.6rem',
                borderRadius: 0, fontSize: '0.78rem', fontWeight: 700,
                background: 'rgba(247,127,50,0.12)', color: '#ea580c',
                letterSpacing: '0.04em', fontFamily: 'monospace',
              }}>
                {profile.usn}
              </span>
              <span className="text-muted" style={{ fontSize: '0.72rem' }}>University Seat Number</span>
            </div>
          )}
        </div>
        {isTeacher && (
          <div style={{ textAlign: 'right' }}>
            <div className="text-muted text-xs">Department</div>
            <code style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>AIML · BNMIT</code>
          </div>
        )}
      </motion.div>

      {/* ── Student Stats ── */}
      {!isTeacher && (
        <motion.div className="dashboard-stats" variants={container} initial="hidden" animate="show">
          <motion.div className="stat-card card" variants={item}>
            <div className="stat-icon" style={{ background: 'var(--color-orange-soft)', color: 'var(--color-orange)' }}><BookOpen size={20} /></div>
            <div className="stat-info">
              <span className="stat-value">6</span>
              <span className="stat-label">Subjects This Sem</span>
            </div>
          </motion.div>
          <motion.div className="stat-card card" variants={item}>
            <div className="stat-icon" style={{ background: 'var(--color-orange-soft)', color: 'var(--color-orange)' }}><ClipboardCheck size={20} /></div>
            <div className="stat-info">
              <span className="stat-value">—</span>
              <span className="stat-label">Attendance</span>
            </div>
          </motion.div>
          <motion.div className="stat-card card" variants={item}>
            <div className="stat-icon" style={{ background: 'var(--color-orange-soft)', color: 'var(--color-orange)' }}><Brain size={20} /></div>
            <div className="stat-info">
              <span className="stat-value">—</span>
              <span className="stat-label">Quiz Score</span>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ── Teacher Quick Actions (full width) ── */}
      {isTeacher && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ marginBottom: '1.75rem' }}>
          <h2 className="section-title">Quick Actions</h2>
          <motion.div className={`teacher-actions-grid cols-${teacherActions.length}`} variants={container} initial="hidden" animate="show">
            {teacherActions.map(({ to, label, icon: Icon, color, bg }) => (
              <motion.button
                key={to}
                className="action-card"
                variants={item}
                onClick={() => navigate(to)}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className="action-icon" style={{ background: bg, color }}>
                  <Icon size={24} />
                </div>
                <span className="action-label">{label}</span>
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      )}

      {/* ── Main content grid ── */}
      <div className={isTeacher ? 'dashboard-single' : 'dashboard-grid'}>
        {/* ── Student Quick Actions ── */}
        {!isTeacher && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="section-title">Quick Actions</h2>
            <motion.div className="actions-grid" variants={container} initial="hidden" animate="show">
              {STUDENT_QUICK_ACTIONS.map(({ to, label, icon: Icon, color, bg }) => (
                <motion.button
                  key={to}
                  className="action-card"
                  variants={item}
                  onClick={() => navigate(to)}
                  whileHover={{ y: -4, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <div className="action-icon" style={{ background: bg, color }}>
                    <Icon size={22} />
                  </div>
                  <span className="action-label">{label}</span>
                </motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* ── Subjects ── */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 className="section-title">
            {isTeacher ? 'Subjects You Teach' : 'Semester 5 Subjects'}
          </h2>

          {isTeacher ? (
            /* ── Teacher: grouped by semester ── */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {Object.entries(groupBySem(TEACHER_SUBJECTS))
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([sem, subjects]) => (
                  <div key={sem}>
                    {/* Semester label */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
                      <span style={{
                        padding: '0.2rem 0.75rem', borderRadius: 0, fontSize: '0.75rem', fontWeight: 700,
                        background: 'rgba(247,127,50,0.1)', color: '#ea580c', letterSpacing: '0.03em',
                      }}>
                        Semester {sem}
                      </span>
                      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                    </div>
                    {/* Subject cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.6rem' }}>
                      {subjects.map(subj => {
                        const Icon = subj.icon
                        return (
                          <div
                            key={subj.code}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.65rem 0.75rem', borderRadius: 0, background: subj.bg, border: `1px solid ${subj.color}22` }}
                          >
                            <div style={{ width: 32, height: 32, borderRadius: 0, background: subj.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Icon size={16} color={subj.color} />
                            </div>
                            <div>
                              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: subj.color }}>{subj.code}</div>
                              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>{subj.name}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            /* ── Student: flat Sem 5 grid ── */
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {STUDENT_SUBJECTS.map(subj => {
                  const Icon = subj.icon
                  return (
                    <div
                      key={subj.code}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 0, background: subj.bg, border: `1px solid ${subj.color}22` }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 0, background: subj.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={18} color={subj.color} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: subj.color }}>{subj.code}</div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>{subj.name}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Student Get Started ── */}
      {!isTeacher && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ marginTop: '1.5rem' }}>
          <h2 className="section-title">Get Started</h2>
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem', textAlign: 'center' }}>
            <Brain size={40} color="#ea580c" style={{ opacity: 0.8 }} />
            <p className="text-muted text-sm">Ask your AI Tutor anything about Machine Learning, Deep Learning, NLP, or any AIML subject.</p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/chatbot')}>
              Open AI Tutor
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
