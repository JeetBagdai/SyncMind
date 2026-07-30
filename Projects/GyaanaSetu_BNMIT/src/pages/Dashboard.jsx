import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getToken } from '../services/auth'
import { getDashboardStats } from '../services/api'
import {
  Network, FlaskConical, Sigma, Layers,
  BookOpen, ClipboardCheck, Calendar,
  MessageCircle, Brain,
  Cpu, Eye, Database, Cloud, Code2, BarChart3
} from 'lucide-react'
import './Dashboard.css'

// 📚 AIML subjects across all semesters ──────────────────────────────────────────────────────────
const SUBJECTS_BY_SEM = {
  3: ['Fourier Transform, Mathematical Logic & Advanced Linear Algebra','Computer Organization and Architecture','Artificial Intelligence','Data Structures & Applications','Microcontroller and Embedded Systems','Object Oriented Programming using Java (Lab)'],
  4: ['Statistics, Probability and Graph Theory','Operating System','Database Management System','Design and Analysis of Algorithms','Machine Learning','Cloud Computing & Applications (Lab)'],
  5: ['Software Engineering, Project Management & Finance','Automata Theory & Computations','Computer Networks & Security','Advanced Machine Learning','Virtual Reality & Augmented Reality (Lab)','Open Elective - I'],
  6: ['Deep Learning','Natural Language Processing','Generative Artificial Intelligence','Image Processing & Computer Vision (Lab)','Professional Elective - I','Professional Elective - II (MOOC)'],
  7: ['Agentic Artificial Intelligence','Professional Elective - III','Professional Elective - IV (MOOC)','Research Methodology & Intellectual Property Rights'],
  8: ['Professional Elective - V (MOOC)'],
}



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
  { to: '/attendance', label: 'Attendance report', icon: ClipboardCheck, color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
  { to: '/timetable',  label: 'My Schedule',              icon: Calendar,       color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
]

// Actions for teachers with timetable manager access
const TEACHER_ACTIONS_WITH_MANAGE = [
  { to: '/attendance',       label: 'Attendance report', icon: ClipboardCheck, color: 'var(--color-orange)', bg: 'var(--color-orange-soft)' },
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
  
  const [stats, setStats] = useState({ chaptersRead: 0, attendanceDays: 0, avgQuizScore: 0, streakDays: 0 })

  useEffect(() => {
    async function loadStats() {
      try {
        const token = await getToken()
        if (!token) return
        const classId = profile?.classId || 'default'
        const data = await getDashboardStats(profile?.role || 'student', classId, token)
        if (data) {
          setStats({
            chaptersRead: data.chaptersRead || 0,
            attendanceDays: data.attendanceDays || 0,
            avgQuizScore: data.avgQuizScore || 0,
            streakDays: data.attendanceDays || 0 // Proxying streak as attendance days for MVP
          })
        }
      } catch (err) {
        console.error('Failed to load stats:', err)
      }
    }
    loadStats()
  }, [profile])

  const teacherActions = canManage ? TEACHER_ACTIONS_WITH_MANAGE : TEACHER_ACTIONS_NO_MANAGE

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  // Dynamically get student subjects based on their profile semester
  const studentSemNum = parseInt(profile?.semester || profile?.classId?.replace('AIML-SEM', '') || '5')
  const studentSubjectsList = SUBJECTS_BY_SEM[studentSemNum] || SUBJECTS_BY_SEM[5]
  
  const STUDENT_SUBJECTS = studentSubjectsList.map((name, i) => ({
    code: `SUB${studentSemNum}0${i+1}`,
    name: name,
    sem: studentSemNum,
    icon: BookOpen,
    color: 'var(--color-orange)',
    bg: 'var(--color-orange-soft)'
  }))

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
                AIML • Semester {studentSemNum}
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
            {profile?.name || 'Welcome'}
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
            {isTeacher ? 'Subjects You Teach' : `Semester ${studentSemNum} Subjects`}
          </h2>

          {isTeacher ? (() => {
            const parsedSubjects = (profile?.subjects || '').split(',').filter(Boolean).map((s, i) => {
              const match = s.trim().match(/(.+)\s*\(Sem\s*(\d+)\)/i)
              if (match) {
                return {
                  code: `S${match[2]}-${i+1}`,
                  name: match[1].trim(),
                  sem: Number(match[2]),
                  icon: BookOpen,
                  color: 'var(--color-orange)',
                  bg: 'var(--color-orange-soft)'
                }
              }
              return {
                code: `Subj-${i+1}`,
                name: s.trim(),
                sem: 0,
                icon: BookOpen,
                color: 'var(--color-orange)',
                bg: 'var(--color-orange-soft)'
              }
            }).filter(subj => subj.sem === 0 || subj.sem >= 3).sort((a, b) => a.sem - b.sem)

            if (parsedSubjects.length === 0) {
              return <div className="text-muted" style={{ padding: '2rem', textAlign: 'center', background: 'var(--bg-card)' }}>No subjects assigned yet.</div>
            }

            return (
              /* ── Teacher: flat grid ── */
              <div className="card" style={{ padding: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {parsedSubjects.map(subj => {
                    const Icon = subj.icon
                    return (
                      <div
                        key={subj.code}
                        style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.75rem', borderRadius: 0, background: subj.bg, border: `1px solid ${subj.color}22` }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Icon size={16} color={subj.color} />
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: subj.color, background: `${subj.color}15`, padding: '0.15rem 0.4rem', borderRadius: '4px' }}>
                              Sem {subj.sem}
                            </span>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                          {subj.name}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })() : (
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

      {/* ── Performance Analytics ── */}
      {!isTeacher && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={{ marginTop: '1.5rem' }}>
          <h2 className="section-title">Performance Analytics</h2>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>

              <div style={{ padding: '1.25rem', background: 'var(--surface)', borderRadius: 0, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="text-muted text-sm" style={{ fontWeight: 600 }}>Overall Accuracy</span>
                  <BarChart3 size={16} color="var(--color-orange)" />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.avgQuizScore}%</div>
                <div style={{ marginTop: '0.5rem', height: '4px', background: 'rgba(247,127,50,0.15)', borderRadius: '2px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${stats.avgQuizScore}%` }} transition={{ duration: 1, delay: 0.5, ease: "easeOut" }} style={{ height: '100%', background: 'var(--color-orange)' }} />
                </div>
              </div>

              <div style={{ padding: '1.25rem', background: 'var(--surface)', borderRadius: 0, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="text-muted text-sm" style={{ fontWeight: 600 }}>Modules Completed</span>
                  <BookOpen size={16} color="var(--color-orange)" />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.chaptersRead} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/ {STUDENT_SUBJECTS.length * 5}</span></div>
                <div style={{ marginTop: '0.5rem', height: '4px', background: 'rgba(247,127,50,0.15)', borderRadius: '2px', overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(stats.chaptersRead / (STUDENT_SUBJECTS.length * 5)) * 100}%` }} transition={{ duration: 1, delay: 0.6, ease: "easeOut" }} style={{ height: '100%', background: 'var(--color-orange)' }} />
                </div>
              </div>

              <div style={{ padding: '1.25rem', background: 'var(--surface)', borderRadius: 0, border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span className="text-muted text-sm" style={{ fontWeight: 600 }}>Active Streak</span>
                  <FlaskConical size={16} color="var(--color-orange)" />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{stats.streakDays} <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>Days</span></div>
                <div className="text-sm" style={{ marginTop: '0.5rem', color: 'var(--color-orange)', fontWeight: 600, display: 'flex', gap: '0.25rem' }}>
                  {[1,2,3,4,5].map(day => (
                     <motion.div key={day} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 + (day * 0.1) }} style={{ height: '4px', flex: 1, background: day <= Math.min(stats.streakDays, 5) ? 'var(--color-orange)' : 'rgba(247,127,50,0.15)', borderRadius: '2px' }} />
                  ))}
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
