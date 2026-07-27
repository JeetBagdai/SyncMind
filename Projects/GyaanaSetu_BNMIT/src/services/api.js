// src/services/api.js
// All Cloud Function API calls live here

const BASE_URL = import.meta.env.VITE_CLOUD_FUNCTIONS_BASE_URL || ''

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

export const generateQuiz = (grade, subject, chapter, token) =>
  apiFetch(`/ncert/generate-quiz?grade=${encodeURIComponent(grade)}&subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapter)}`, { method: 'GET' }, token)

export const evaluateAnswer = (data, token) =>
  apiFetch('/ncert/evaluate-answer', { method: 'POST', body: JSON.stringify(data) }, token)

// ── ATTENDANCE ─────────────────────────────────────
export const createAttendanceSession = (data, token) =>
  apiFetch('/attendance/session', { method: 'POST', body: JSON.stringify(data) }, token)

export const markAttendance = (data, token) =>
  apiFetch('/attendance/mark', { method: 'POST', body: JSON.stringify(data) }, token)

export const getAttendanceReport = (classId, date, token) =>
  apiFetch(`/attendance/report?classId=${classId}&date=${date}&_t=${Date.now()}`, { headers: { 'Cache-Control': 'no-cache' } }, token)

// ── TIMETABLE ──────────────────────────────────────
export const generateTimetable = (data, token) =>
  apiFetch('/timetable/generate', { method: 'POST', body: JSON.stringify(data) }, token)

export const getTimetable = (classId, token) =>
  apiFetch(`/timetable/get?classId=${classId}`, {}, token)

export const saveTimetable = (data, token) =>
  apiFetch('/timetable/save', { method: 'POST', body: JSON.stringify(data) }, token)

// ── AUTH ───────────────────────────────────────────
export const setUserRole = (data, token) =>
  apiFetch('/auth/setRole', { method: 'POST', body: JSON.stringify(data) }, token)

// ── CHATBOT ────────────────────────────────────────
export const sendChatMessage = (messages, userRole, grade, token) =>
  apiFetch('/chatbot/message', {
    method: 'POST',
    body: JSON.stringify({ messages, userRole, grade }),
  }, token)

// ── DASHBOARD ──────────────────────────────────────
export const getDashboardStats = (role, classId, token) =>
  apiFetch(`/dashboard/stats?role=${role}&classId=${classId || 'default'}`, {}, token)

