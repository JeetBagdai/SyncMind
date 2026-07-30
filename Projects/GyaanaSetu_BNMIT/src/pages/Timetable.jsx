// src/pages/Timetable.jsx  — Personal schedule view for teachers & students
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Loader, Clock, QrCode, X, PlayCircle, Users, CheckCircle, StopCircle } from 'lucide-react'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import { useAuth } from '../context/AuthContext'
import { getToken } from '../services/auth'
import { getTimetable, createAttendanceSession, getAttendanceReport } from '../services/api'
import './Timetable.css'

const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'))
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            reject(new Error('Location permission denied. Please allow location access.'))
          } else {
            reject(new Error(`Unable to retrieve your location: ${error.message}`))
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      )
    }
  })
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const AIML_SEMESTERS = [
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
    const sections = Array.isArray(schedule) ? [{ sec: 'A', data: schedule }] : [
      schedule.scheduleA ? { sec: 'A', data: schedule.scheduleA } : null,
      schedule.scheduleB ? { sec: 'B', data: schedule.scheduleB } : null
    ].filter(Boolean)
    
    for (const { sec, data: sectionData } of sections) {
      for (const dayData of sectionData) {
        const day = dayData.day
        if (!week[day]) continue
        for (const slot of (dayData.slots || [])) {
          if (matchesTeacher(slot)) {
            week[day].push({ ...slot, semLabel, semNum, section: sec })
          }
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

function AttendanceSessionModal({ slot, onClose, teacherId }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [presentStudents, setPresentStudents] = useState([])

  useEffect(() => {
    let active = true
    const initSession = async () => {
      try {
        const location = await getCurrentLocation()
        const token = await getToken()
        const data = await createAttendanceSession({
          classId: `AIML-SEM${slot.semNum}`,
          teacherId: teacherId,
          subject: slot.subject,
          lat: location.lat,
          lng: location.lng,
        }, token)
        if (active) setSession(data)
      } catch (err) {
        if (active) setError(err.message)
      } finally {
        if (active) setLoading(false)
      }
    }
    initSession()
    return () => { active = false }
  }, [slot, teacherId])

  useEffect(() => {
    if (!session?.sessionId) return
    const interval = setInterval(async () => {
      try {
        const token = await getToken()
        const today = new Date().toISOString().split('T')[0]
        const classId = `AIML-SEM${slot.semNum}`
        const report = await getAttendanceReport(classId, today, token)
        const current = report.present.filter(s => s.sessionId === session.sessionId)
        setPresentStudents(current.map(s => ({
          id: s.studentId,
          name: s.name || `Student (${s.studentId.slice(0, 4)})`,
        })))
      } catch (err) {}
    }, 3000)
    return () => clearInterval(interval)
  }, [session, slot])

  return (
    <div className="modal-overlay" style={{ zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', position: 'fixed', inset: 0 }}>
      <motion.div className="modal-content card" style={{ padding: '2rem', maxWidth: 500, width: '90%', position: 'relative' }} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <X size={24} />
        </button>
        
        <h2 className="section-title" style={{ marginBottom: '0.25rem' }}>Live Session</h2>
        <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>{slot.subject} · {slot.semLabel}</p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem' }}>
            <Loader size={32} color="var(--primary)" className="spin-anim" />
            <p className="text-sm font-medium">Starting class & fetching location...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p className="text-sm" style={{ color: 'var(--accent-danger)' }}>{error}</p>
          </div>
        ) : session ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ background: '#fff', padding: '1rem', borderRadius: '1rem', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
              <QRCode value={session.qrData} size={200} level="M" />
            </div>
            <p className="text-xs text-muted" style={{ marginTop: '1rem' }}>Valid for 2 minutes</p>

            <div style={{ width: '100%', marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <span className="font-medium" style={{ fontSize: '0.9rem' }}>Students Present</span>
                <span className="badge badge-teal">{presentStudents.length} present</span>
              </div>
              {presentStudents.length === 0 ? (
                <p className="text-sm text-muted" style={{ textAlign: 'center' }}>Waiting for scans...</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: 150, overflowY: 'auto' }}>
                  {presentStudents.map(s => (
                    <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--background)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                      <CheckCircle size={16} color="var(--accent-success)" />
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </motion.div>
    </div>
  )
}

const getTeacherInitials = (name) => {
  if (!name || name === '—') return '';
  const cleanName = name.replace(/^(Dr\.?|Prof\.?|Mr\.?|Mrs\.?|Ms\.?)\s*/i, '');
  const parts = cleanName.trim().split(/\s+/);
  const initials = parts.map(p => p[0]?.toUpperCase()).join('');
  return `Dr.${initials}`;
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
  const [selectedSlot,  setSelectedSlot]  = useState(null)

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

    // 🎓 Fetch student's semester 🎓
    useEffect(() => {
      if (isTeacher) return
      ;(async () => {
        setFetching(true)
        try {
          const token = await getToken()
          const data  = await getTimetable(studentSem, token)
          const sched = data?.schedule
          if (sched) {
            setSchedule(Array.isArray(sched) ? sched : (sched.scheduleA || []))
          } else {
            setSchedule(null)
          }
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
                        onClick={() => setSelectedSlot(slot)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '1rem',
                          padding: '0.8rem 1rem', borderRadius: 0,
                          background: sc.bg, border: `1px solid ${sc.text}22`,
                          cursor: 'pointer'
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
                        <div style={{ color: sc.text, opacity: 0.8 }}>
                          <QrCode size={18} />
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
                                  display: 'flex', flexDirection: 'column', gap: '0.3rem',
                                  padding: '0.6rem 0.75rem', borderRadius: 0,
                                  background: sc.bg, border: `1px solid ${sc.text}22`,
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: sc.text }}>
                                    {slot.time}
                                  </span>
                                  <span style={{
                                    fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.4rem',
                                    borderRadius: 0, background: sc.text + '22', color: sc.text,
                                  }}>
                                    {slot.semLabel} - Sec {slot.section || 'A'}
                                  </span>
                                </div>
                                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: sc.text, lineHeight: 1.3 }}>
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
        
        <AnimatePresence>
          {selectedSlot && (
            <AttendanceSessionModal 
              slot={selectedSlot} 
              teacherId={profile?.uid}
              onClose={() => setSelectedSlot(null)} 
            />
          )}
        </AnimatePresence>
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
                      <div style={{ fontSize: '0.75rem', color: getText(slot.subject), opacity: 0.75 }}>{getTeacherInitials(slot.teacher)}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Full week grid */}
          <motion.div className="tt-grid-wrapper" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="section-title" style={{ marginBottom: '1rem' }}>Weekly Schedule · {studentSemLabel}</h2>
            <div className="tt-grid" style={{ gridTemplateColumns: `100px ${(schedule[0]?.slots.map(s => s.time) || []).map(t => t.includes('Break') || t.includes('Lunch') ? '40px' : 'minmax(120px, 1fr)').join(' ')}` }}>
              {/* Headers */}
              <div className="tt-header-cell">Day / Time</div>
                {(schedule[0]?.slots.map(s => s.time) || []).map((time, timeIdx) => {
                    if (time.includes('Break') || time.includes('Lunch')) {
                         return <div key={time} className="tt-header-cell" style={{ fontSize: '0.7rem' }}>{time.includes('Break') ? 'BREAK' : 'LUNCH'}</div>;
                    }
                    return <div key={time} className="tt-header-cell">{time.split(' - ')[0]}</div>
                })}

              {DAYS.map((day, dayIdx) => (
                <React.Fragment key={day}>
                  <div className={`tt-day-cell ${day === todayName ? 'today' : ''}`}>{day}</div>
                  {(schedule[0]?.slots.map(s => s.time) || []).map((time, timeIdx) => {
                     if (time.includes('Break') || time.includes('Lunch')) {
                         if (dayIdx === 0) {
                             return (
                                <div key={time} className="tt-break-col" style={{ 
                                  gridRow: `2 / span ${DAYS.length}`,
                                  gridColumn: timeIdx + 2
                                }}>
                                   {time.includes('Break') ? 'BREAK' : 'LUNCH'}
                                </div>
                             )
                         }
                         return null;
                     }
                     
                     const slot = schedule.find(d => d.day === day)?.slots?.find(s => s.time === time);
                     if (!slot) return null;

                     return (
                        <div key={`${day}-${time}`} className="tt-cell"
                          style={{
                            ...(slot.colSpan ? { gridColumn: `span ${slot.colSpan}`, alignItems: 'center', justifyContent: 'center' } : {}),
                            ...(slot.subject && slot.subject !== 'Free' ? { background: getColor(slot.subject), color: getText(slot.subject) } : {})
                          }}>
                          {slot.subject && slot.subject !== 'Free' ? (
                            <>
                              <span className="tt-subject" style={slot.colSpan ? { fontSize: '1.1rem', textAlign: 'center' } : {}}>{slot.subject}</span>
                             {slot.teacher && slot.teacher !== '—' && slot.subject !== 'Club Activities' && (
                                <span className="tt-teacher">
                                  <Users size={12} style={{marginRight:'0.2rem'}}/>
                                  {getTeacherInitials(slot.teacher)}
                                </span>
                             )}
                           </>
                         ) : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Free</span>}
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
