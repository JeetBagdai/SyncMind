// src/services/api.js
// All Cloud Function API calls live here

const BASE_URL = '/.netlify/functions/api'

async function apiFetch(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(err || `API error ${res.status}`)
  }
  return res.json()
}

// ── NCERT ──────────────────────────────────────────
export const getNcertLessons = (grade, subject, token) =>
  apiFetch(`/ncert/lessons?grade=${grade}&subject=${subject}`, {}, token)

export const getNcertLesson = (grade, subject, chapter, token) =>
  apiFetch(`/ncert/lesson?grade=${grade}&subject=${subject}&chapter=${encodeURIComponent(chapter)}`, {}, token)

export const postNcertProgress = (data, token) =>
  apiFetch('/ncert/progress', { method: 'POST', body: JSON.stringify(data) }, token)

export const postQuizResult = (data, token) =>
  apiFetch('/ncert/quiz-result', { method: 'POST', body: JSON.stringify(data) }, token)

export const generateQuiz = (semester, subject, module, token) =>
  apiFetch(`/ncert/generate-quiz?semester=${encodeURIComponent(semester)}&subject=${encodeURIComponent(subject)}&module=${encodeURIComponent(module)}`, { method: 'GET' }, token)

export const evaluateAnswer = (data, token) =>
  apiFetch('/ncert/evaluate-answer', { method: 'POST', body: JSON.stringify(data) }, token)

import { db } from '../firebase'
import { doc, setDoc, getDoc, collection, getDocs, updateDoc, increment } from 'firebase/firestore'

function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// 🏫 ATTENDANCE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const createAttendanceSession = async (data, token) => {
  const sessionId = crypto.randomUUID()
  const timestamp = Date.now()
  const signature = Math.random().toString(36).substring(2, 15)
  const qrData = JSON.stringify({ sessionId, timestamp, signature })
  const expiresAt = timestamp + 2 * 60 * 1000

  await setDoc(doc(db, 'attendanceSessions', sessionId), {
    sessionId,
    classId: data.classId || 'default',
    teacherId: data.teacherId || 'unknown',
    subject: data.subject || 'General',
    location: data.lat && data.lng ? { lat: data.lat, lng: data.lng } : null,
    createdAt: timestamp,
    expiresAt,
    active: true,
    signature,
  })
  return { sessionId, qrData, expiresAt }
}

export const markAttendance = async (data, token) => {
  const { qrData, name, lat, lng, studentId } = data
  let parsed
  try {
    parsed = JSON.parse(qrData)
  } catch {
    throw new Error('Invalid QR data')
  }

  const { sessionId, timestamp, signature } = parsed
  if (Date.now() > timestamp + 2 * 60 * 1000) throw new Error('QR code has expired')

  const sessionSnap = await getDoc(doc(db, 'attendanceSessions', sessionId))
  if (!sessionSnap.exists() || !sessionSnap.data().active) {
    throw new Error('Session not active')
  }

  const session = sessionSnap.data()
  if (session.signature !== signature) throw new Error('Invalid QR signature')

  if (session.location && session.location.lat && session.location.lng) {
    if (!lat || !lng) throw new Error('Location is required to mark attendance.')
    const distance = getDistance(session.location.lat, session.location.lng, lat, lng)
    if (distance > 30) {
      throw new Error(`You are too far from the classroom (${Math.round(distance)}m). You must be within 30m.`)
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const attRef = doc(db, 'attendance', session.classId, today, studentId || 'unknown')
  
  const existing = await getDoc(attRef)
  await setDoc(attRef, {
    present: true,
    timestamp: Date.now(),
    sessionId,
    name: name || 'Student',
  })

  // NEW: Log to flat collection for teacher reporting
  if (!existing.exists() && studentId) {
    const logRef = doc(collection(db, 'attendanceLogs'))
    await setDoc(logRef, {
      studentId: studentId,
      classId: session.classId,
      subject: session.subject,
      teacherId: session.teacherId,
      date: today,
      timestamp: Date.now(),
      sessionId,
      name: name || 'Student',
    })

    await updateDoc(doc(db, 'users', studentId), {
      totalAttendanceDays: increment(1)
    })
  }

  return { success: true, alreadyMarked: existing.exists() }
}

export const getAttendanceReport = async (classId, date, token) => {
  const today = date || new Date().toISOString().split('T')[0]
  const snap = await getDocs(collection(db, 'attendance', classId || 'default', today))
  const present = snap.docs.map(d => ({ studentId: d.id, ...d.data() }))
  return { date: today, present, count: present.length }
}

import { query, where } from 'firebase/firestore'

export const getTeacherAttendanceReport = async (classId, subject, teacherId) => {
  const logsRef = collection(db, 'attendanceLogs')
  let q = query(logsRef, where('classId', '==', classId))
  if (teacherId) {
    q = query(q, where('teacherId', '==', teacherId))
  }
  if (subject) {
    q = query(q, where('subject', '==', subject))
  }
  const snap = await getDocs(q)
  
  // Group by student
  const students = {}
  snap.docs.forEach(d => {
    const data = d.data()
    if (!students[data.studentId]) {
      students[data.studentId] = { studentId: data.studentId, name: data.name, presentCount: 0, records: [] }
    }
    students[data.studentId].presentCount++
    students[data.studentId].records.push(data)
  })
  
  return Object.values(students)
}

// ── TIMETABLE ──────────────────────────────────────
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const TIMES_815 = [
  '8:15 - 9:10',
  '9:10 - 10:05',
  '10:05 - 10:35 Break',
  '10:35 - 11:35',
  '11:35 - 12:35',
  '12:35 - 1:15 Lunch',
  '1:15 - 2:10',
  '2:10 - 3:05',
  '3:05 - 4:00'
]

const TIMES_830 = [
  '8:30 - 9:30',
  '9:30 - 10:30',
  '10:30 - 11:00 Break',
  '11:00 - 12:00',
  '12:00 - 1:00',
  '1:00 - 1:40 Lunch',
  '1:40 - 2:40',
  '2:40 - 3:40',
  '3:40 - 4:30'
]

function generateDualSchedule(subjectConfig, timeslots, busy) {
  const classSlotIndices = timeslots
    .map((t, i) => (t.includes('Break') || t.includes('Lunch') ? -1 : i))
    .filter(i => i !== -1)

  const scheduleA = []
  const scheduleB = []

  // ── Build empty skeleton ──────────────────────────────────────
  DAYS.forEach((day, dayIdx) => {
    let slots = timeslots.map(time => ({ time, subject: 'Free', teacher: '—' }))
    // Wednesday post-lunch → Club Activities block
    if (dayIdx === 2) {
      const lunchIdx = timeslots.findIndex(t => t.includes('Lunch'))
      if (lunchIdx !== -1 && lunchIdx + 1 < slots.length) {
        slots[lunchIdx + 1].subject = 'Club Activities'
        slots[lunchIdx + 1].colSpan = slots.length - (lunchIdx + 1)
        slots.splice(lunchIdx + 2, slots.length - (lunchIdx + 2))
      }
    }
    scheduleA.push({ day, slots: JSON.parse(JSON.stringify(slots)) })
    scheduleB.push({ day, slots: JSON.parse(JSON.stringify(slots)) })
  })

  // ── Normalise subject config → separate lecture + lab entries ─
  // Each entry in remainingX: { name, isLab, block, remaining, teacherA, teacherB }
  const buildRemaining = (config) => {
    const entries = []
    for (const sc of config) {
      // Support new lectureHrs/labHrs schema AND old hours/block schema
      const lectureHrs = Number(sc.lectureHrs ?? (sc.block ? 0 : sc.hours) ?? 0)
      const labHrs     = Number(sc.labHrs     ?? (sc.block ? sc.hours : 0) ?? 0)

      if (lectureHrs > 0) {
        entries.push({ name: sc.name, isLab: false, block: false, remaining: lectureHrs, teacherA: sc.teacherA || '—', teacherB: sc.teacherB || '—' })
      }
      if (labHrs > 0) {
        // Lab sessions are always placed as 2-hr consecutive blocks
        const labBlocks = Math.ceil(labHrs / 2)
        entries.push({ name: sc.name + ' (Lab)', isLab: true, block: true, remaining: labBlocks * 2, teacherA: sc.teacherA || '—', teacherB: sc.teacherB || '—' })
      }
    }
    return entries
  }

  let remainingA = buildRemaining(subjectConfig)
  let remainingB = buildRemaining(subjectConfig)

  // ── Helper: place a single slot ───────────────────────────────
  const placeSubject = (dayIdx, slotIdx, section, sc) => {
    const time = timeslots[slotIdx]
    const day  = DAYS[dayIdx]
    const sched   = section === 'A' ? scheduleA : scheduleB
    const teacher = section === 'A' ? sc.teacherA : sc.teacherB

    if (sched[dayIdx].slots[slotIdx].subject !== 'Free') return false
    if (teacher && teacher !== '—' && busy[day]?.[time]?.has(teacher)) return false

    sched[dayIdx].slots[slotIdx].subject = sc.name
    sched[dayIdx].slots[slotIdx].teacher = teacher || '—'
    sc.remaining -= 1

    if (teacher && teacher !== '—') {
      if (!busy[day]) busy[day] = {}
      if (!busy[day][time]) busy[day][time] = new Set()
      busy[day][time].add(teacher)
    }
    return true
  }

  const lunchIndex = timeslots.findIndex(t => t.includes('Lunch'))

  // ── Main placement loop ───────────────────────────────────────
  for (let slotOffset = 0; slotOffset < classSlotIndices.length; slotOffset++) {
    for (let dayIdx = 0; dayIdx < DAYS.length; dayIdx++) {
      const slotIdx = classSlotIndices[slotOffset]

      // Skip Wednesday post-lunch
      if (dayIdx === 2 && lunchIndex !== -1 && slotIdx > lunchIndex) continue

      // ── Section A ──
      remainingA.sort((a, b) => b.remaining - a.remaining)
      for (let i = 0; i < remainingA.length; i++) {
        const sc = remainingA[i]
        if (sc.remaining <= 0) continue
        if (scheduleA[dayIdx].slots[slotIdx].subject !== 'Free') break

        if (sc.block) {
          if (sc.remaining >= 2 && slotOffset < classSlotIndices.length - 1) {
            const nextSlotIdx = classSlotIndices[slotOffset + 1]
            // Avoid splitting block across lunch
            const nextIsPastLunch = lunchIndex !== -1 && nextSlotIdx > lunchIndex
            const splitAcrossLunch = timeslots[slotIdx].includes('Lunch') || timeslots[nextSlotIdx]?.includes('Lunch')
            
            if (!nextIsPastLunch && !splitAcrossLunch) {
              const teacher = sc.teacherA
              const day = DAYS[dayIdx]
              const time1 = timeslots[slotIdx], time2 = timeslots[nextSlotIdx]
              if (scheduleA[dayIdx].slots[slotIdx].subject === 'Free' &&
                  scheduleA[dayIdx].slots[nextSlotIdx]?.subject === 'Free' &&
                  !(teacher && teacher !== '—' && (busy[day]?.[time1]?.has(teacher) || busy[day]?.[time2]?.has(teacher)))) {
                placeSubject(dayIdx, slotIdx, 'A', sc)
                placeSubject(dayIdx, nextSlotIdx, 'A', sc)
                break
              }
            }
          }
        } else {
          if (placeSubject(dayIdx, slotIdx, 'A', sc)) break
        }
      }

      // ── Section B ──
      remainingB.sort((a, b) => b.remaining - a.remaining)
      for (let i = 0; i < remainingB.length; i++) {
        const sc = remainingB[i]
        if (sc.remaining <= 0) continue
        if (scheduleB[dayIdx].slots[slotIdx].subject !== 'Free') break

        if (sc.block) {
          if (sc.remaining >= 2 && slotOffset < classSlotIndices.length - 1) {
            const nextSlotIdx = classSlotIndices[slotOffset + 1]
            const nextIsPastLunch = lunchIndex !== -1 && nextSlotIdx > lunchIndex
            const splitAcrossLunch = timeslots[slotIdx].includes('Lunch') || timeslots[nextSlotIdx]?.includes('Lunch')
            
            if (!nextIsPastLunch && !splitAcrossLunch) {
              const teacher = sc.teacherB
              const day = DAYS[dayIdx]
              const time1 = timeslots[slotIdx], time2 = timeslots[nextSlotIdx]
              if (scheduleB[dayIdx].slots[slotIdx].subject === 'Free' &&
                  scheduleB[dayIdx].slots[nextSlotIdx]?.subject === 'Free' &&
                  !(teacher && teacher !== '—' && (busy[day]?.[time1]?.has(teacher) || busy[day]?.[time2]?.has(teacher)))) {
                placeSubject(dayIdx, slotIdx, 'B', sc)
                placeSubject(dayIdx, nextSlotIdx, 'B', sc)
                break
              }
            }
          }
        } else {
          if (placeSubject(dayIdx, slotIdx, 'B', sc)) break
        }
      }
    }
  }

  // ── Label break/lunch slots ───────────────────────────────────
  DAYS.forEach(day => {
    [scheduleA, scheduleB].forEach(sched => {
      sched.find(d => d.day === day).slots.forEach(s => {
        if (s.time.includes('Break') || s.time.includes('Lunch')) {
          s.subject = s.time.split(' ')[1] || 'Break'
        }
      })
    })
  })

  return { scheduleA, scheduleB }
}

export const generateTimetable = async (data, token) => {
  const { subjectConfig = [], startTime = '8:15', classId = 'default' } = data;
  const timeslots = startTime === '8:15' ? TIMES_815 : TIMES_830;

  const timetablesSnap = await getDocs(collection(db, 'timetables'));
  const allTimetables = timetablesSnap.docs
    .filter(doc => !doc.id.startsWith(classId))
    .map(doc => doc.data().schedule);

  const busy = {}
  DAYS.forEach(d => {
    busy[d] = {}
    timeslots.forEach(t => { busy[d][t] = new Set() })
  })

  allTimetables.forEach(sched => {
    if (!sched) return
    const arrs = sched.scheduleA ? [sched.scheduleA, sched.scheduleB] : [sched]
    arrs.forEach(arr => {
      if (!arr) return
      arr.forEach(dayObj => {
        const d = dayObj.day
        if (!busy[d]) return
        dayObj.slots.forEach(slot => {
          const t = slot.time
          if (busy[d][t] && slot.teacher && slot.teacher !== '—') {
            busy[d][t].add(slot.teacher)
          }
        })
      })
    })
  })

  const { scheduleA, scheduleB } = generateDualSchedule(subjectConfig, timeslots, busy)
  return { schedule: { scheduleA, scheduleB }, classId }
}

export const getTimetable = async (classId, token) => {
  const snap = await getDoc(doc(db, 'timetables', classId || 'default'))
  if (!snap.exists()) return { schedule: null }
  return snap.data()
}

export const saveTimetable = async (data, token) => {
  const { schedule, classId } = data
  await setDoc(doc(db, 'timetables', classId || 'default'), {
    schedule,
    classId,
    generatedAt: new Date().toISOString(),
  })
  return { success: true }
}

// ── AUTH ───────────────────────────────────────────
export const getProfile = (token) =>
  apiFetch('/auth/profile', { method: 'GET' }, token)



export const setUserRole = (data, token) =>
  apiFetch('/auth/setRole', { method: 'POST', body: JSON.stringify(data) }, token)

// 🤖 CHATBOT ──────────────────────────────
export const sendChatMessage = (messages, userRole, semester, token) =>
  apiFetch('/chatbot/message', {
    method: 'POST',
    body: JSON.stringify({ messages, userRole, semester }),
  }, token)

// ── DASHBOARD ──────────────────────────────────────
export const getDashboardStats = (role, classId, token) =>
  apiFetch(`/dashboard/stats?role=${role}&classId=${classId || 'default'}`, {}, token)
