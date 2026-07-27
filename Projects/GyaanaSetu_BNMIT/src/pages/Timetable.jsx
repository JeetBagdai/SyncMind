// src/pages/Timetable.jsx  — Personal schedule view for teachers & students
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Loader, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getToken } from '../services/auth'
import { getTimetable } from '../services/api'
import './Timetable.css'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const AIML_SEMESTERS = [
  { id: 'AIML-SEM1', label: 'Sem 1', num: 1 },
  { id: 'AIML-SEM2', label: 'Sem 2', num: 2 },
  { id: 'AIML-SEM3', label: 'Sem 3', num: 3 },
  { id: 'AIML-SEM4', label: 'Sem 4', num: 4 },
  { id: 'AIML-SEM5', label: 'Sem 5', num: 5 },
  { id: 'AIML-SEM6', label: 'Sem 6', num: 6 },
  { id: 'AIML-SEM7', label: 'Sem 7', num: 7 },
  { id: 'AIML-SEM8', label: 'Sem 8', num: 8 },
]

const SEM_COLORS = [
  { bg: 'var(--sem-1-bg)', text: 'var(--sem-1-text)' },
  { bg: 'var(--sem-2-bg)', text: 'var(--sem-2-text)' },
  { bg: 'var(--sem-3-bg)', text: 'var(--sem-3-text)' },
  { bg: 'var(--sem-4-bg)', text: 'var(--sem-4-text)' },
  { bg: 'var(--sem-5-bg)', text: 'var(--sem-5-text)' },
  { bg: 'var(--sem-6-bg)', text: 'var(--sem-6-text)' },
  { bg: 'var(--sem-7-bg)', text: 'var(--sem-7-text)' },
  { bg: 'var(--sem-8-bg)', text: 'var(--sem-8-text)' },
]

const SUBJECT_COLORS = {
  'Machine Learning':            { bg: 'var(--color-orange-soft)', text: 'var(--color-orange)' },
  'Deep Learning':               { bg: 'var(--color-orange-soft)', text: 'var(--color-orange)' },
  'Natural Language Processing': { bg: 'var(--color-orange-soft)', text: 'var(--color-orange)' },
  'Computer Vision':             { bg: 'var(--color-orange-soft)', text: 'var(--color-orange)' },
  'Big Data Analytics':          { bg: 'var(--color-orange-soft)', text: 'var(--color-orange)' },
  'Cloud Computing':             { bg: 'var(--color-orange-soft)', text: 'var(--color-orange)' },
  Default:                       { bg: '#f5f3ff', text: '#ea580c' },
}

function getColor(s) { return (SUBJECT_COLORS[s] || SUBJECT_COLORS.Default).bg }
function getText(s)  { return (SUBJECT_COLORS[s] || SUBJECT_COLORS.Default).text }

function getTodayName() {
  const idx = new Date().getDay()
  return DAYS[idx - 1] || null
}

// Convert "9:00", "14:00" → minutes for sorting
function timeToMin(t) {
  if (!t) return 9999
  const [h, m] = t.split(':').map(Number)
  return h * 60 + (m || 0)
}

// ── Teacher: merge all semesters into one weekly view ───────────────────────
function buildTeacherWeekly(allSemData, teacherName) {
  // Match by full name in teachers[] array, or fall back to teacher string
  const matchesTeacher = (slot) => {
    if (slot.teachers && Array.isArray(slot.teachers)) {
      return slot.teachers.some(n => n === teacherName)
    }
    // backward compat: single teacher string
    if (slot.teacher) {
      const lastName = teacherName.split(' ').pop().toLowerCase()
      return slot.teacher.toLowerCase().includes(lastName)
    }
    return false
  }

  const week = {}
  DAYS.forEach(d => { week[d] = [] })

  for (const { semLabel, semNum, schedule } of allSemData) {
    if (!schedule) continue
    for (const dayData of schedule) {
      const day = dayData.day
      if (!week[day]) continue
      for (const slot of (dayData.slots || [])) {
        if (matchesTeacher(slot)) {
          week[day].push({ ...slot, semLabel, semNum })
        }
      }
    }
  }

  // Sort each day chronologically
  for (const day of DAYS) {
    week[day].sort((a, b) => timeToMin(a.time) - timeToMin(b.time))
  }
  return week
}

export default function Timetable() {
  const { profile } = useAuth()
  const isTeacher   = profile?.role === 'teacher'
  const todayName   = getTodayName()
  const teacherName = profile?.name || ''
  const lastName    = teacherName.split(' ').pop().toLowerCase()

  // ── Teacher state ──
  const [teacherWeekly, setTeacherWeekly] = useState(null)
  const [fetchingAll,   setFetchingAll]   = useState(isTeacher)

  // ── Student state ──
  const [schedule,  setSchedule]  = useState(null)
  const [fetching,  setFetching]  = useState(!isTeacher)
  const studentSem = profile?.classId || 'AIML-SEM5'
  const studentSemLabel = AIML_SEMESTERS.find(s => s.id === studentSem)?.label || 'Sem 5'

  // ── Fetch all semesters in parallel for teacher ──
  useEffect(() => {
    if (!isTeacher) return
    ;(async () => {
      setFetchingAll(true)
      try {
        const token = await getToken()
        const results = await Promise.all(
          AIML_SEMESTERS.map(async sem => {
            try {
              const data = await getTimetable(sem.id, token)
              return { semLabel: sem.label, semNum: sem.num, schedule: data?.schedule || null }
            } catch {
              return { semLabel: sem.label, semNum: sem.num, schedule: null }
            }
          })
        )
        setTeacherWeekly(buildTeacherWeekly(results, teacherName))
      } catch { setTeacherWeekly({}) }
      finally  { setFetchingAll(false) }
    })()
  }, [isTeacher, lastName])

  // ── Fetch student's semester ──
  useEffect(() => {
    if (isTeacher) return
    ;(async () => {
      setFetching(true)
      try {
        const token = await getToken()
        const data  = await getTimetable(studentSem, token)
        setSchedule(data?.schedule || null)
      } catch { setSchedule(null) }
      finally  { setFetching(false) }
    })()
  }, [isTeacher, studentSem])

  // ─────────────────────────────────────────────────────────────
  // TEACHER VIEW
  // ─────────────────────────────────────────────────────────────
  if (isTeacher) {
    const todaySlots = teacherWeekly?.[todayName] || []
    const hasAnyClass = teacherWeekly
      ? DAYS.some(d => (teacherWeekly[d] || []).length > 0)
      : false

    return (
      <div className="page-inner">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">My Schedule</h1>
            <p className="page-subtitle">Weekly teaching schedule across all semesters · AIML Department</p>
          </div>
          <span className="badge badge-orange" style={{ fontSize: '0.8rem', padding: '0.35rem 0.9rem' }}>
            All Semesters
          </span>
        </div>

        {fetchingAll ? (
          <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <Loader size={28} color="var(--primary)" className="spin-anim" />
          </div>
        ) : !hasAnyClass ? (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem' }}>
            <Calendar size={56} color="var(--text-muted)" style={{ opacity: 0.4 }} />
            <p className="text-muted">No classes assigned to you yet across any semester.</p>
          </div>
        ) : (
          <>
            {/* ── Today's classes ── */}
            <motion.div
              className="card"
              style={{ marginBottom: '1.25rem', padding: '1.25rem' }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="section-title" style={{ marginBottom: '1rem' }}>
                {todayName ? `Today · ${todayName}` : 'Today — No Classes (Weekend)'}
              </h2>
              {!todayName ? (
                <p className="text-muted text-sm">No classes on weekends.</p>
              ) : todaySlots.length === 0 ? (
                <p className="text-muted text-sm">No classes assigned to you today.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {todaySlots.map((slot, i) => {
                    const sc = SEM_COLORS[(slot.semNum - 1) % SEM_COLORS.length]
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '1rem',
                          padding: '0.8rem 1rem', borderRadius: 0,
                          background: sc.bg, border: `1px solid ${sc.text}22`,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', minWidth: 56, color: sc.text, fontWeight: 700, fontSize: '0.88rem' }}>
                          <Clock size={13} />
                          {slot.time}
                        </div>
                        <span style={{
                          padding: '0.15rem 0.55rem', borderRadius: 0, fontSize: '0.7rem',
                          fontWeight: 700, background: sc.text + '18', color: sc.text, flexShrink: 0,
                        }}>
                          {slot.semLabel}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, color: sc.text, fontSize: '0.9rem' }}>{slot.subject}</div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </motion.div>

            {/* ── Full week ── */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 className="section-title" style={{ marginBottom: '1rem' }}>Full Week · All Semesters</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
                {DAYS.map(day => {
                  const slots = teacherWeekly[day] || []
                  const isToday = day === todayName
                  return (
                    <motion.div
                      key={day}
                      className="card"
                      style={{
                        padding: '1rem',
                        border: isToday ? '2px solid rgba(247,127,50,0.4)' : '1px solid var(--border)',
                        background: isToday ? 'rgba(247,127,50,0.04)' : 'var(--surface)',
                      }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      {/* Day header */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.88rem', color: isToday ? 'var(--primary)' : 'var(--text-primary)' }}>
                          {day}
                        </span>
                        {isToday && (
                          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--primary)', background: 'rgba(247,127,50,0.12)', padding: '0.15rem 0.5rem', borderRadius: 0 }}>
                            TODAY
                          </span>
                        )}
                      </div>

                      {slots.length === 0 ? (
                        <p className="text-muted text-xs" style={{ textAlign: 'center', padding: '1rem 0' }}>No classes</p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          {slots.map((slot, i) => {
                            const sc = SEM_COLORS[(slot.semNum - 1) % SEM_COLORS.length]
                            return (
                              <div
                                key={i}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                                  padding: '0.55rem 0.7rem', borderRadius: 0,
                                  background: sc.bg, border: `1px solid ${sc.text}18`,
                                }}
                              >
                                {/* Time */}
                                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: sc.text, minWidth: 38 }}>
                                  {slot.time}
                                </span>
                                {/* Sem badge */}
                                <span style={{
                                  fontSize: '0.65rem', fontWeight: 700, padding: '0.1rem 0.4rem',
                                  borderRadius: 0, background: sc.text + '18', color: sc.text, flexShrink: 0,
                                }}>
                                  {slot.semLabel}
                                </span>
                                {/* Subject */}
                                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: sc.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {slot.subject}
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          </>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // STUDENT VIEW (unchanged)
  // ─────────────────────────────────────────────────────────────
  const todaySchedule  = schedule?.find(d => d.day === todayName)
  const todaySlots     = todaySchedule?.slots || []

  return (
    <div className="page-inner">
      <div className="page-header">
        <div>
          <h1 className="page-title">Timetable</h1>
          <p className="page-subtitle">AIML {studentSemLabel} · Weekly Schedule</p>
        </div>
        <span className="badge badge-orange" style={{ fontSize: '0.8rem', padding: '0.35rem 0.9rem' }}>
          AIML · {studentSemLabel}
        </span>
      </div>

      {fetching ? (
        <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
          <Loader size={28} color="var(--primary)" className="spin-anim" />
        </div>
      ) : schedule ? (
        <>
          {/* Today */}
          <motion.div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="section-title" style={{ marginBottom: '1rem' }}>
              {todayName ? `Today · ${todayName}` : 'Today — No Classes (Weekend)'}
            </h2>
            {!todayName ? (
              <p className="text-muted text-sm">No classes on weekends.</p>
            ) : todaySlots.length === 0 ? (
              <p className="text-muted text-sm">No classes scheduled today.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {todaySlots.map((slot, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', borderRadius: 0, background: getColor(slot.subject), border: `1px solid ${getText(slot.subject)}22` }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: getText(slot.subject), minWidth: 50 }}>{slot.time}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, color: getText(slot.subject), fontSize: '0.9rem' }}>{slot.subject}</div>
                      <div style={{ fontSize: '0.75rem', color: getText(slot.subject), opacity: 0.75 }}>{slot.teacher}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Full week grid */}
          <motion.div className="tt-grid-wrapper" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="section-title" style={{ marginBottom: '1rem' }}>Weekly Schedule · {studentSemLabel}</h2>
            <div className="tt-grid">
              <div className="tt-header-cell tt-time-header">Time</div>
              {DAYS.map(d => (
                <div key={d} className={`tt-header-cell ${d === todayName ? 'today' : ''}`}>{d}</div>
              ))}
              {schedule[0]?.slots.map(s => s.time).map(time => (
                <React.Fragment key={time}>
                  {time === '12:00' && (
                    <div className="tt-break-row" style={{ gridColumn: '1 / -1' }}>Lunch Break</div>
                  )}
                  <div className="tt-time-cell">{time}</div>
                  {DAYS.map(day => {
                    const slot = schedule.find(d => d.day === day)?.slots?.find(s => s.time === time)
                    return (
                      <div key={`${day}-${time}`} className="tt-cell"
                        style={slot?.subject ? { background: getColor(slot.subject), color: getText(slot.subject) } : {}}>
                        {slot?.subject && (
                          <>
                            <span className="tt-subject">{slot.subject}</span>
                            {slot.teacher && <span className="tt-teacher">{slot.teacher}</span>}
                          </>
                        )}
                      </div>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>
          </motion.div>
        </>
      ) : (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem' }}>
          <Calendar size={56} color="var(--text-muted)" style={{ opacity: 0.4 }} />
          <p className="text-muted">Your timetable hasn't been published yet. Check back later.</p>
        </div>
      )}
    </div>
  )
}
