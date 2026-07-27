// src/pages/Admin.jsx
// Admin-only page: manage users + timetable
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, UserPlus, Calendar, Plus, Trash2,
  Wand2, Save, CheckCircle, AlertCircle, Loader,
  ShieldCheck, ToggleLeft, ToggleRight, RefreshCw, Users2, ChevronDown
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getToken } from '../services/auth'
import { generateTimetable, saveTimetable, getTimetable } from '../services/api'
import './Admin.css'

// ── Constants ──────────────────────────────────────────────────────────────
const AIML_SEMESTERS = [
  { id: 'AIML-SEM1', label: 'Sem 1' }, { id: 'AIML-SEM2', label: 'Sem 2' },
  { id: 'AIML-SEM3', label: 'Sem 3' }, { id: 'AIML-SEM4', label: 'Sem 4' },
  { id: 'AIML-SEM5', label: 'Sem 5' }, { id: 'AIML-SEM6', label: 'Sem 6' },
  { id: 'AIML-SEM7', label: 'Sem 7' }, { id: 'AIML-SEM8', label: 'Sem 8' },
]

const AIML_SUBJECTS = [
  'Machine Learning', 'Deep Learning', 'Natural Language Processing',
  'Computer Vision', 'Big Data Analytics', 'Cloud Computing',
]

// Full subject catalogue for teacher assignment
const AIML_SUBJECT_CATALOGUE = [
  { code: '21AI101', name: 'Programming Fundamentals',    sem: 1 },
  { code: '21AI102', name: 'Engineering Mathematics I',   sem: 1 },
  { code: '21AI201', name: 'Data Structures',             sem: 2 },
  { code: '21AI202', name: 'Engineering Mathematics II',  sem: 2 },
  { code: '21AI301', name: 'Database Management Systems', sem: 3 },
  { code: '21AI302', name: 'Statistics for AI',           sem: 3 },
  { code: '21AI401', name: 'Introduction to AI',          sem: 4 },
  { code: '21AI402', name: 'Computer Networks',           sem: 4 },
  { code: '21AI501', name: 'Machine Learning',            sem: 5 },
  { code: '21AI502', name: 'Deep Learning',               sem: 5 },
  { code: '21AI503', name: 'Natural Language Processing', sem: 5 },
  { code: '21AI504', name: 'Computer Vision',             sem: 5 },
  { code: '21AI505', name: 'Big Data Analytics',          sem: 5 },
  { code: '21AI506', name: 'Cloud Computing',             sem: 5 },
  { code: '21AI601', name: 'Reinforcement Learning',      sem: 6 },
  { code: '21AI602', name: 'AI Ethics & Policy',          sem: 6 },
  { code: '21AI701', name: 'Advanced Deep Learning',      sem: 7 },
  { code: '21AI702', name: 'MLOps & Deployment',          sem: 7 },
]

const FACULTY_LIST = [
  { name: 'Dr. Kavitha Reddy',  subject: 'Machine Learning' },
  { name: 'Prof. Sanjay Rao',   subject: 'Deep Learning' },
  { name: 'Dr. Meera Iyer',     subject: 'Natural Language Processing' },
  { name: 'Prof. Anil Kumar',   subject: 'Computer Vision' },
  { name: 'Dr. Priya Nair',     subject: 'Big Data Analytics' },
  { name: 'Prof. Ramesh Babu',  subject: 'Cloud Computing' },
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const SUBJECT_COLORS = {
  'Machine Learning':            { bg: '#fff2e8', text: '#ea580c' },
  'Deep Learning':               { bg: '#ffedd5', text: '#e85d04' },
  'Natural Language Processing': { bg: '#ffedd5', text: '#a64200' },
  'Computer Vision':             { bg: '#fffbeb', text: '#d97706' },
  'Big Data Analytics':          { bg: '#fee2e2', text: '#ef4444' },
  'Cloud Computing':             { bg: '#f0fdf4', text: '#16a34a' },
  Default:                       { bg: '#f5f3ff', text: '#ea580c' },
}

const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const API_KEY  = import.meta.env.VITE_FIREBASE_API_KEY || ''

// Fetch all teacher accounts from Firestore (shared by UserManager & TimetableManager)
async function fetchTeacherAccounts() {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'users' }],
          where: { fieldFilter: { field: { fieldPath: 'role' }, op: 'EQUAL', value: { stringValue: 'teacher' } } },
        },
      }),
    }
  )
  const rows = await res.json()
  return rows
    .filter(r => r.document)
    .map(r => ({
      uid:   r.document.name.split('/').pop(),
      name:  r.document.fields?.name?.stringValue || 'Unknown',
      email: r.document.fields?.email?.stringValue || '',
    }))
}

// ── Per-slot teacher multi-select picker ──────────────────────────────────
function TeacherPicker({ allTeachers, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const toggle = name => {
    if (selected.includes(name)) onChange(selected.filter(n => n !== name))
    else onChange([...selected, name])
  }
  return (
    <div style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.4rem 0.65rem', borderRadius: 0, cursor: 'pointer',
          border: '1px solid var(--border)', background: 'var(--bg-input)',
          fontSize: '0.75rem', color: selected.length ? 'var(--text-primary)' : 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
        }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', overflow: 'hidden' }}>
          <Users2 size={11} style={{ flexShrink: 0 }} />
          {selected.length === 0 ? 'Assign...' : selected.length === 1 ? selected[0].split(' ').slice(-1)[0] : `${selected.length} teachers`}
        </span>
        <ChevronDown size={11} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            style={{
              position: 'absolute', top: 'calc(100% + 3px)', left: 0, right: 0, zIndex: 100,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: 0, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              maxHeight: 160, overflowY: 'auto', padding: '0.35rem',
            }}>
            {allTeachers.length === 0
              ? <div style={{ padding: '0.6rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>No teachers found</div>
              : allTeachers.map(t => (
                <label key={t.uid} style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 0.45rem',
                  borderRadius: 0, cursor: 'pointer', fontSize: '0.78rem',
                  background: selected.includes(t.name) ? 'rgba(247,127,50,0.08)' : 'transparent',
                  color: selected.includes(t.name) ? '#ea580c' : 'var(--text-primary)',
                }}>
                  <input type="checkbox" className="checkbox" checked={selected.includes(t.name)} onChange={() => toggle(t.name)} />
                  <div>
                    <div style={{ fontWeight: selected.includes(t.name) ? 600 : 400 }}>{t.name}</div>
                    <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>{t.email}</div>
                  </div>
                </label>
              ))
            }
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Create user via Firebase Auth REST API ─────────────────────────────────
async function createFirebaseUser(email, password, displayName) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, displayName, returnSecureToken: true }),
    }
  )
  const body = await res.json()
  if (!res.ok) {
    const code = body?.error?.message || 'Failed to create user'
    const err  = new Error(code)
    err.code   = code  // e.g. 'EMAIL_EXISTS'
    throw err
  }
  return body // { localId, idToken, ... }
}

// Check if a Firestore users doc with this email already exists
async function findProfileByEmail(email) {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'users' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'email' },
              op: 'EQUAL',
              value: { stringValue: email.toLowerCase() },
            },
          },
          limit: 1,
        },
      }),
    }
  )
  const rows = await res.json()
  return rows.filter(r => r.document).length > 0
}

// ── Write Firestore profile (no-auth, works in test mode) ─────────────────
async function writeProfile(uid, profile) {
  function toFS(val) {
    if (val === null || val === undefined) return { nullValue: null }
    if (typeof val === 'string')  return { stringValue: val }
    if (typeof val === 'number')  return { integerValue: String(val) }
    if (typeof val === 'boolean') return { booleanValue: val }
    return { stringValue: String(val) }
  }
  const fields = {}
  for (const [k, v] of Object.entries(profile)) fields[k] = toFS(v)

  const PROJECT = import.meta.env.VITE_FIREBASE_PROJECT_ID
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    }
  )
  if (!res.ok) {
    const b = await res.json()
    throw new Error(b?.error?.message || 'Firestore write failed')
  }
}

// ── Firestore helpers ─────────────────────────────────────────────────────
const PROJECT = import.meta.env.VITE_FIREBASE_PROJECT_ID

async function queryTeachers() {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'users' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'role' },
              op: 'EQUAL',
              value: { stringValue: 'teacher' },
            },
          },
        },
      }),
    }
  )
  const rows = await res.json()
  return rows
    .filter(r => r.document)
    .map(r => {
      const f = r.document.fields || {}
      const uid = r.document.name.split('/').pop()
      return {
        uid,
        name:            f.name?.stringValue            || 'Unknown',
        email:           f.email?.stringValue           || '',
        timetableManager: f.timetableManager?.booleanValue === true,
      }
    })
}

async function setTimetableAccess(uid, granted) {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}?updateMask.fieldPaths=timetableManager`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: { timetableManager: { booleanValue: granted } },
      }),
    }
  )
  if (!res.ok) {
    const b = await res.json()
    throw new Error(b?.error?.message || 'Update failed')
  }
}

async function queryAllUsers() {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents:runQuery`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'users' }],
        },
      }),
    }
  )
  const rows = await res.json()
  return rows
    .filter(r => r.document)
    .map(r => {
      const f = r.document.fields || {}
      const uid = r.document.name.split('/').pop()
      return {
        uid,
        name:            f.name?.stringValue            || 'Unknown',
        email:           f.email?.stringValue           || '',
        role:            f.role?.stringValue            || 'student',
        department:      f.department?.stringValue      || 'AIML',
        semester:        f.semester?.integerValue ? Number(f.semester.integerValue) : (f.semester?.stringValue ? Number(f.semester.stringValue) : 5),
        usn:             f.usn?.stringValue             || '',
        timetableManager: f.timetableManager?.booleanValue === true,
      }
    })
}

async function deleteUserAccount(uid) {
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/users/${uid}`,
    { method: 'DELETE' }
  )
  if (!res.ok) {
    const b = await res.json()
    throw new Error(b?.error?.message || 'Failed to delete account')
  }
}


// ── Tabs ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'users',     label: 'Manage Users',    icon: Users },
  { id: 'access',    label: 'Timetable Access', icon: ShieldCheck },
  { id: 'timetable', label: 'Manage Timetable', icon: Calendar },
]

// ══════════════════════════════════════════════════════════════════════════
export default function Admin() {
  const [tab, setTab] = useState('users')

  return (
    <div className="page-inner">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Panel</h1>
          <p className="page-subtitle">Manage users and timetables · BNMIT AIML</p>
        </div>
        <span className="badge" style={{ background: '#fee2e2', color: '#ef4444', fontWeight: 700, fontSize: '0.8rem', padding: '0.35rem 0.9rem' }}>
          Admin Only
        </span>
      </div>

      {/* Tab switcher */}
      <div className="admin-tabs">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`admin-tab ${tab === id ? 'active' : ''}`}
            onClick={() => setTab(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
        >
          {tab === 'users'     && <UserManager />}
          {tab === 'access'    && <TimetableAccess />}
          {tab === 'timetable' && <TimetableManager />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// USER MANAGER
// ══════════════════════════════════════════════════════════════════════════
function UserManager() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'student',
    semester: 5, usn: '', department: 'AIML', timetableManager: false,
  })
  // Teacher-specific: selected subjects + custom subject inputs
  const [selectedSubjects, setSelectedSubjects] = useState([])
  const [customSubjectName, setCustomSubjectName] = useState('')
  const [customSubjectCode, setCustomSubjectCode] = useState('')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  // User list state
  const [userList, setUserList] = useState([])
  const [fetchingUsers, setFetchingUsers] = useState(true)
  const [userFilter, setUserFilter] = useState('all') // 'all' | 'student' | 'teacher'
  const [revokingUid, setRevokingUid] = useState(null)

  const loadUserList = async () => {
    setFetchingUsers(true)
    try {
      const list = await queryAllUsers()
      setUserList(list)
    } catch (e) {
      console.error('Failed to query users', e)
    } finally {
      setFetchingUsers(false)
    }
  }

  useEffect(() => {
    loadUserList()
  }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      const isTeacher = form.role === 'teacher'
      const subjectsStr = isTeacher
        ? selectedSubjects.map(s => `${s.code}:${s.name}`).join(',')
        : ''

      const profile = {
        name:       form.name,
        email:      form.email.toLowerCase(),
        role:       form.role,
        department: form.department,
        school:     'BNM Institute of Technology',
        createdAt:  new Date().toISOString(),
        ...(isTeacher
          ? { subjects: subjectsStr, timetableManager: form.timetableManager }
          : {
              semester: Number(form.semester),
              classId:  `AIML-SEM${form.semester}`,
              ...(form.usn ? { usn: form.usn } : {}),
            }
        ),
      }

      let docId
      try {
        const { localId } = await createFirebaseUser(form.email, form.password, form.name)
        docId = localId
        profile.uid = localId
      } catch (authErr) {
        if (authErr.code === 'EMAIL_EXISTS') {
          // Firebase Auth already has this email (e.g. prior Google sign-in)
          // Check if there's already an admin-created Firestore profile for it
          const alreadyExists = await findProfileByEmail(form.email)
          if (alreadyExists) {
            throw new Error('An account with this email already exists.')
          }
          // No Firestore profile yet — create one under an email-keyed doc ID.
          // loginWithGoogle will find it via email query on next sign-in and link it.
          docId = 'pending_' + btoa(form.email.toLowerCase()).replace(/=/g, '')
          profile.uid         = docId
          profile.pendingLink = true  // marker so loginWithGoogle can clean up old doc
        } else {
          throw authErr
        }
      }

      await writeProfile(docId, profile)
      setStatus({ type: 'success', msg: `${isTeacher ? 'Teacher' : 'Student'} account created for ${form.email}` })
      setForm({ name: '', email: '', password: '', role: 'student', semester: 5, usn: '', department: 'AIML', timetableManager: false })
      setSelectedSubjects([])
      setCustomSubjectName('')
      setCustomSubjectCode('')
      loadUserList()
    } catch (err) {
      setStatus({ type: 'error', msg: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (user) => {
    if (!window.confirm(`Are you sure you want to revoke the account for ${user.name} (${user.email})? This action cannot be undone.`)) {
      return
    }
    setRevokingUid(user.uid)
    try {
      await deleteUserAccount(user.uid)
      setUserList(prev => prev.filter(u => u.uid !== user.uid))
      setStatus({ type: 'success', msg: `🗑️ Revoked account for ${user.name}` })
    } catch (err) {
      setStatus({ type: 'error', msg: `❌ Failed to revoke account: ${err.message}` })
    } finally {
      setRevokingUid(null)
    }
  }

  const nonAdminUsers = userList.filter(u => u.role !== 'admin')

  const filteredUsers = nonAdminUsers.filter(u => {
    if (userFilter === 'student') return u.role === 'student'
    if (userFilter === 'teacher') return u.role === 'teacher'
    return true
  })

  const studentCount = nonAdminUsers.filter(u => u.role === 'student').length
  const teacherCount = nonAdminUsers.filter(u => u.role === 'teacher').length

  return (
    <div className="admin-section">
      {/* ── Create New Account ── */}
      <div className="card admin-card">
        <div className="admin-card-header">
          <UserPlus size={20} />
          <h2>Create New Account</h2>
        </div>

        <form onSubmit={handleCreate} className="admin-form">
          {/* Role selector */}
          <div className="admin-form-group">
            <label className="form-label">Account Type</label>
            <div className="role-pills">
              {['student', 'teacher'].map(r => (
                <button
                  key={r} type="button"
                  className={`role-pill ${form.role === r ? 'active' : ''}`}
                  onClick={() => set('role', r)}
                >
                  {r === 'student' ? '🎒' : '👩‍🏫'} {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="form-label">Full Name</label>
              <input className="input" placeholder="e.g. Priya Sharma" value={form.name}
                onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="admin-form-group">
              <label className="form-label">Email</label>
              <input className="input" type="email" placeholder="user@bnmit.in" value={form.email}
                onChange={e => set('email', e.target.value)} required />
            </div>
          </div>

          <div className="admin-form-row">
            <div className="admin-form-group">
              <label className="form-label">Password</label>
              <input className="input" type="password" placeholder="Min 6 characters" value={form.password}
                onChange={e => set('password', e.target.value)} required minLength={6} />
            </div>
            {form.role === 'student' ? (
              <div className="admin-form-group">
                <label className="form-label">Semester</label>
                <select className="input" value={form.semester} onChange={e => set('semester', e.target.value)}>
                  {[1,2,3,4,5,6,7,8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            ) : (
              /* Timetable manager toggle — teacher only */
              <div className="admin-form-group">
                <label className="form-label">Timetable Management Access</label>
                <button
                  type="button"
                  onClick={() => set('timetableManager', !form.timetableManager)}
                  style={{
                    width: '100%', padding: '0.6rem 1rem',
                    borderRadius: 0, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    border: form.timetableManager
                      ? '1.5px solid rgba(247,127,50,0.5)'
                      : '1.5px solid var(--border)',
                    background: form.timetableManager
                      ? 'rgba(247,127,50,0.1)'
                      : 'var(--bg-input)',
                    transition: 'all 0.2s',
                  }}
                >
                  <span style={{
                    fontSize: '0.85rem', fontWeight: 600,
                    color: form.timetableManager ? '#ea580c' : 'var(--text-muted)',
                  }}>
                    {form.timetableManager ? 'Enabled' : 'Disabled'}
                  </span>
                  {/* Toggle pill */}
                  <span style={{
                    width: 40, height: 22, borderRadius: 0, position: 'relative',
                    background: form.timetableManager ? '#ea580c' : '#d0cde8',
                    transition: 'background 0.2s', display: 'inline-block', flexShrink: 0,
                  }}>
                    <span style={{
                      position: 'absolute', top: 3,
                      left: form.timetableManager ? 20 : 3,
                      width: 16, height: 16, borderRadius: 0,
                      background: '#fff',
                      transition: 'left 0.2s',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                  </span>
                </button>
              </div>
            )}
          </div>

          {form.role === 'student' && (
            <div className="admin-form-group">
              <label className="form-label">USN</label>
              <input className="input" placeholder="e.g. 1BM22AI001" value={form.usn}
                onChange={e => set('usn', e.target.value)} required />
            </div>
          )}

          {/* ── Teacher subject assignment ── */}
          {form.role === 'teacher' && (
            <div className="admin-form-group">
              <label className="form-label" style={{ marginBottom: '0.6rem', display: 'block' }}>
                Subjects Assigned
              </label>

              {/* Selected subjects tags */}
              {selectedSubjects.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.75rem' }}>
                  {selectedSubjects.map(s => (
                    <span key={s.code} style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                      padding: '0.25rem 0.6rem', borderRadius: 0, fontSize: '0.78rem', fontWeight: 600,
                      background: 'rgba(247,127,50,0.1)', color: '#ea580c',
                      border: '1px solid rgba(247,127,50,0.2)',
                    }}>
                      <span style={{ fontSize: '0.68rem', opacity: 0.7 }}>{s.code}</span>
                      {s.name}
                      <button type="button" onClick={() => setSelectedSubjects(p => p.filter(x => x.code !== s.code))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ea580c', display: 'flex', padding: 0, opacity: 0.6 }}>
                        <Trash2 size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Catalogue checklist grouped by semester */}
              <div className="card" style={{ padding: '0.9rem', maxHeight: 260, overflowY: 'auto' }}>
                {[1,2,3,4,5,6,7].map(sem => {
                  const semSubjects = AIML_SUBJECT_CATALOGUE.filter(s => s.sem === sem)
                  return (
                    <div key={sem} style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#ea580c', letterSpacing: '0.05em', marginBottom: '0.35rem', textTransform: 'uppercase' }}>
                        Semester {sem}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.3rem' }}>
                        {semSubjects.map(subj => {
                          const checked = selectedSubjects.some(s => s.code === subj.code)
                          return (
                            <label key={subj.code} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', padding: '0.2rem 0' }}>
                              <input type="checkbox" className="checkbox"
                                checked={checked}
                                onChange={e => {
                                  if (e.target.checked) setSelectedSubjects(p => [...p, subj])
                                  else setSelectedSubjects(p => p.filter(s => s.code !== subj.code))
                                }}
                              />
                              <span style={{ fontSize: '0.8rem' }}>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>{subj.code}</span>
                                {subj.name}
                              </span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Add custom subject */}
              <div style={{ marginTop: '0.75rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Add custom subject
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="input" placeholder="Course code (e.g. 21AI801)" value={customSubjectCode}
                    onChange={e => setCustomSubjectCode(e.target.value)}
                    style={{ flex: '0 0 180px' }}
                  />
                  <input className="input" placeholder="Subject name" value={customSubjectName}
                    onChange={e => setCustomSubjectName(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button type="button" className="btn btn-secondary btn-sm"
                    onClick={() => {
                      const name = customSubjectName.trim()
                      const code = customSubjectCode.trim() || `CUSTOM-${Date.now()}`
                      if (!name) return
                      if (selectedSubjects.some(s => s.code === code)) return
                      setSelectedSubjects(p => [...p, { code, name, sem: 0 }])
                      setCustomSubjectName('')
                      setCustomSubjectCode('')
                    }}
                  >
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Status */}
          {status && (
            <motion.div
              className={`admin-status ${status.type}`}
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            >
              {status.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              {status.msg}
            </motion.div>
          )}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '0.5rem' }}>
            {loading ? <Loader size={16} className="spin-anim" /> : <UserPlus size={16} />}
            {loading ? 'Creating...' : `Create ${form.role === 'student' ? 'Student' : 'Teacher'} Account`}
          </button>
        </form>
      </div>

      {/* ── Existing Accounts List ── */}
      <div className="card admin-card">
        <div className="admin-card-header" style={{ justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={20} />
            <h2>Existing Accounts</h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={loadUserList} disabled={fetchingUsers}>
            <RefreshCw size={14} style={{ animation: fetchingUsers ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem' }}>
          {[
            { id: 'all', label: `All (${nonAdminUsers.length})` },
            { id: 'student', label: `Students (${studentCount})` },
            { id: 'teacher', label: `Teachers (${teacherCount})` },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setUserFilter(f.id)}
              className={`sem-pill ${userFilter === f.id ? 'active' : ''}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {fetchingUsers ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader size={28} color="var(--primary)" className="spin-anim" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p className="text-muted text-sm">No accounts found matching filter.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {filteredUsers.map(u => {
              const isTeacher = u.role === 'teacher'
              const isAdmin   = u.role === 'admin'
              const isBusy    = revokingUid === u.uid

              const roleBadgeBg   = isAdmin ? '#fee2e2' : isTeacher ? '#ffedd5' : '#fff2e8'
              const roleBadgeText = isAdmin ? '#ef4444' : isTeacher ? '#e85d04' : '#ea580c'

              return (
                <motion.div
                  key={u.uid}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.9rem 1.1rem',
                    borderRadius: 0,
                    border: '1px solid var(--border-color, #e2dff5)',
                    background: 'var(--bg-card, #ffffff)',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 0,
                    background: `linear-gradient(135deg, ${roleBadgeText}, #b84a00)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#ffffff', fontWeight: 700, fontSize: '1rem', flexShrink: 0,
                  }}>
                    {u.name[0] || '?'}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {u.name}
                      </span>
                      <span className="badge" style={{ background: roleBadgeBg, color: roleBadgeText, fontSize: '0.72rem', padding: '0.25rem 0.65rem' }}>
                        {u.role === 'admin' ? 'Admin' : u.role === 'teacher' ? 'Teacher' : 'Student'}
                      </span>
                    </div>
                    <div className="text-muted text-xs" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '0.15rem' }}>
                      {u.email} {u.usn ? `• USN: ${u.usn}` : ''} {u.semester ? `• Sem ${u.semester}` : ''}
                    </div>
                  </div>

                  {/* Revoke button */}
                  {!isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(u)}
                      disabled={isBusy}
                      className="btn btn-danger btn-sm"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                      title="Revoke and delete account"
                    >
                      {isBusy ? <Loader size={13} className="spin-anim" /> : <Trash2 size={13} />}
                      {isBusy ? 'Revoking...' : 'Revoke'}
                    </button>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}


// ══════════════════════════════════════════════════════════════════════════
// TIMETABLE ACCESS MANAGER
// ══════════════════════════════════════════════════════════════════════════
function TimetableAccess() {
  const [teachers, setTeachers] = useState([])
  const [fetching, setFetching] = useState(true)
  const [toggling, setToggling] = useState({}) // uid → true while saving
  const [error, setError]       = useState(null)

  const load = async () => {
    setFetching(true)
    setError(null)
    try {
      const list = await queryTeachers()
      setTeachers(list)
    } catch (e) {
      setError(e.message)
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleToggle = async (teacher) => {
    const newVal = !teacher.timetableManager
    setToggling(t => ({ ...t, [teacher.uid]: true }))
    try {
      await setTimetableAccess(teacher.uid, newVal)
      setTeachers(list =>
        list.map(t => t.uid === teacher.uid ? { ...t, timetableManager: newVal } : t)
      )
    } catch (e) {
      setError(e.message)
    } finally {
      setToggling(t => { const n = { ...t }; delete n[teacher.uid]; return n })
    }
  }

  return (
    <div className="admin-section">
      <div className="card admin-card">
        <div className="admin-card-header" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShieldCheck size={20} />
            <h2>Timetable Access</h2>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={load} disabled={fetching}>
            <RefreshCw size={14} style={{ animation: fetching ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>

        <p className="text-muted text-sm" style={{ marginBottom: '1.25rem' }}>
          Teachers with access can generate and edit timetables. Changes sync automatically for all assigned teachers.
        </p>

        {error && (
          <div className="admin-status error" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {fetching ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
            <Loader size={28} color="var(--primary)" className="spin-anim" />
          </div>
        ) : teachers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p className="text-muted text-sm">No teacher accounts found. Create teacher accounts first.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {teachers.map(teacher => {
              const isOn      = teacher.timetableManager
              const isBusy    = !!toggling[teacher.uid]
              return (
                <motion.div
                  key={teacher.uid}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '0.9rem 1.1rem',
                    borderRadius: 0,
                    border: isOn
                      ? '1.5px solid rgba(247,127,50,0.35)'
                      : '1px solid var(--border)',
                    background: isOn
                      ? 'rgba(247,127,50,0.06)'
                      : 'var(--surface)',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: 40, height: 40, borderRadius: 0,
                    background: isOn
                      ? 'linear-gradient(135deg, #ea580c, #e85d04)'
                      : 'var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isOn ? '#fff' : 'var(--text-muted)',
                    fontWeight: 700, fontSize: '1rem', flexShrink: 0,
                    transition: 'background 0.3s',
                  }}>
                    {teacher.name[0]}
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                      {teacher.name}
                    </div>
                    <div className="text-muted text-xs" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {teacher.email}
                    </div>
                  </div>

                  {/* Status badge */}
                  {isOn && (
                    <span style={{
                      padding: '0.2rem 0.7rem', borderRadius: 0,
                      background: 'rgba(247,127,50,0.12)', color: 'var(--primary)',
                      fontSize: '0.72rem', fontWeight: 700, whiteSpace: 'nowrap',
                    }}>
                      ✓ Can Edit
                    </span>
                  )}

                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(teacher)}
                    disabled={isBusy}
                    title={isOn ? 'Revoke access' : 'Grant access'}
                    style={{
                      background: 'none', border: 'none', cursor: isBusy ? 'wait' : 'pointer',
                      color: isOn ? 'var(--primary)' : 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', padding: '4px',
                      transition: 'color 0.2s',
                    }}
                  >
                    {isBusy
                      ? <Loader size={26} className="spin-anim" />
                      : isOn
                        ? <ToggleRight size={34} />
                        : <ToggleLeft size={34} />
                    }
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// TIMETABLE MANAGER
// ══════════════════════════════════════════════════════════════════════════
function TimetableManager() {
  const [subjects, setSubjects]   = useState(AIML_SUBJECTS)
  const [customSubject, setCustomSubject] = useState('')
  const [timeslots, setTimeslots] = useState(['9:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00'])
  const [newTime, setNewTime]     = useState('')
  const [schedule, setSchedule]   = useState(null)
  const [loading, setLoading]     = useState(false)
  const [saved, setSaved]         = useState(false)
  const [selectedSem, setSelectedSem] = useState('AIML-SEM5')

  // Live teacher accounts
  const [allTeachers, setAllTeachers]         = useState([])
  const [loadingTeachers, setLoadingTeachers] = useState(true)
  // Per-slot assignments: { 'Monday-9:00': ['Name1','Name2'], ... }
  const [slotTeachers, setSlotTeachers]       = useState({})

  // Fetch real teacher accounts once
  useEffect(() => {
    fetchTeacherAccounts()
      .then(setAllTeachers)
      .catch(() => setAllTeachers([]))
      .finally(() => setLoadingTeachers(false))
  }, [])

  // Load existing timetable when semester changes
  useEffect(() => {
    setSchedule(null)
    setSaved(false)
    setSlotTeachers({})
    async function load() {
      try {
        const token = await getToken()
        const data  = await getTimetable(selectedSem, token)
        if (data?.schedule) {
          setSchedule(data.schedule)
          const existing = {}
          for (const dayData of data.schedule) {
            for (const slot of (dayData.slots || [])) {
              const key = `${dayData.day}-${slot.time}`
              if (slot.teachers) existing[key] = slot.teachers
              else if (slot.teacher) existing[key] = [slot.teacher]
            }
          }
          setSlotTeachers(existing)
        }
      } catch { setSchedule(null) }
    }
    load()
  }, [selectedSem])

  const handleGenerate = async () => {
    setLoading(true); setSaved(false)
    try {
      const token = await getToken()
      const data  = await generateTimetable({
        subjects,
        teachers: allTeachers.map(t => ({ name: t.name })),
        rooms: 1, days: DAYS, timeslots, classId: selectedSem,
      }, token)
      setSchedule(data.schedule)
    } catch {
      const mock = DAYS.map(day => ({
        day,
        slots: timeslots.map((time, i) => ({
          time,
          subject: subjects[i % subjects.length] || 'Free',
          teachers: [],
        })),
      }))
      setSchedule(mock)
    } finally { setLoading(false) }
  }

  const handleSave = async () => {
    if (!schedule) return
    // Merge slotTeachers into schedule before saving
    const enriched = schedule.map(dayData => ({
      ...dayData,
      slots: (dayData.slots || []).map(slot => ({
        ...slot,
        teachers: slotTeachers[`${dayData.day}-${slot.time}`] || [],
      })),
    }))
    try {
      const token = await getToken()
      await saveTimetable({ schedule: enriched, classId: selectedSem }, token)
    } catch {}
    setSaved(true)
  }

  const updateSlotTeachers = (day, time, teachers) =>
    setSlotTeachers(prev => ({ ...prev, [`${day}-${time}`]: teachers }))

  const getColor = s => (SUBJECT_COLORS[s] || SUBJECT_COLORS.Default).bg
  const getText  = s => (SUBJECT_COLORS[s] || SUBJECT_COLORS.Default).text

  return (
    <div className="admin-section">
      {/* Config card */}
      <div className="card admin-card" style={{ marginBottom: '1.5rem' }}>
        <div className="admin-card-header">
          <Calendar size={20} />
          <h2>Timetable Configuration</h2>
        </div>

        {/* Semester picker */}
        <div className="admin-form-group">
          <label className="form-label">Semester</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
            {AIML_SEMESTERS.map(sem => (
              <button key={sem.id} type="button"
                onClick={() => setSelectedSem(sem.id)}
                className={`sem-pill ${selectedSem === sem.id ? 'active' : ''}`}>
                {sem.label}
              </button>
            ))}
          </div>
        </div>

        <div className="tt-config-grid" style={{ marginTop: '1.25rem' }}>
          {/* Subjects */}
          <div>
            <label className="form-label">Subjects</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', margin: '0.5rem 0' }}>
              {AIML_SUBJECTS.map(subj => (
                <label key={subj} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="checkbox" className="checkbox"
                    checked={subjects.includes(subj)}
                    onChange={e => {
                      if (e.target.checked) setSubjects(p => [...p, subj])
                      else setSubjects(p => p.filter(s => s !== subj))
                    }}
                  />
                  <span className="text-sm">{subj}</span>
                </label>
              ))}
            </div>
            <div className="input-row" style={{ marginTop: '0.4rem' }}>
              <input className="input" placeholder="Custom subject..." value={customSubject}
                onChange={e => setCustomSubject(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && customSubject.trim()) {
                    setSubjects(p => [...p, customSubject.trim()])
                    setCustomSubject('')
                  }
                }}
              />
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => {
                if (customSubject.trim()) { setSubjects(p => [...p, customSubject.trim()]); setCustomSubject('') }
              }}><Plus size={14} /></button>
            </div>
          </div>

          {/* Timings */}
          <div>
            <label className="form-label">Timings</label>
            <div className="tag-list" style={{ margin: '0.5rem 0' }}>
              {timeslots.map((t, i) => (
                <span key={i} className="tag">
                  {t}
                  <button onClick={() => setTimeslots(p => p.filter((_, j) => j !== i))}><Trash2 size={10} /></button>
                </span>
              ))}
            </div>
            <div className="input-row">
              <input className="input" placeholder="Add time (e.g. 10:15)" value={newTime}
                onChange={e => setNewTime(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && newTime.trim()) { setTimeslots(p => [...p, newTime.trim()]); setNewTime('') } }}
              />
              <button className="btn btn-secondary btn-sm" type="button" onClick={() => {
                if (newTime.trim()) { setTimeslots(p => [...p, newTime.trim()]); setNewTime('') }
              }}><Plus size={14} /></button>
            </div>
          </div>
        </div>

        {/* Teacher availability indicator */}
        <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: 0, background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {loadingTeachers
            ? <><Loader size={13} className="spin-anim" color="var(--text-muted)" /><span className="text-xs text-muted">Loading teacher accounts...</span></>
            : <><Users2 size={13} color="#ea580c" /><span className="text-xs" style={{ color: '#ea580c', fontWeight: 600 }}>{allTeachers.length} teacher account{allTeachers.length !== 1 ? 's' : ''} available for assignment</span></>
          }
        </div>

        {/* Actions */}
        <div className="tt-actions" style={{ marginTop: '1rem' }}>
          <button className="btn btn-primary" onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader size={16} className="spin-anim" /> : <Wand2 size={16} />}
            {loading ? 'Generating...' : 'Generate Timetable'}
          </button>
          {schedule && (
            <button className="btn btn-secondary" onClick={handleSave}>
              <Save size={16} />
              {saved ? 'Saved!' : 'Save Timetable'}
            </button>
          )}
        </div>
      </div>

      {/* Schedule preview with teacher assignment */}
      {schedule ? (
        <motion.div className="tt-grid-wrapper" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="section-title">
            Weekly Schedule · {AIML_SEMESTERS.find(s => s.id === selectedSem)?.label || selectedSem}
          </h2>
          <div className="tt-grid">
            <div className="tt-header-cell tt-time-header">Time</div>
            {DAYS.map(d => <div key={d} className="tt-header-cell">{d}</div>)}
            {schedule[0]?.slots.map(s => s.time).map(time => (
              <React.Fragment key={time}>
                {time === '12:00' && (
                  <div key={`break-${time}`} className="tt-break-row" style={{ gridColumn: '1 / -1' }}>Lunch Break</div>
                )}
                <div key={time} className="tt-time-cell">{time}</div>
                {DAYS.map(day => {
                  const slot  = schedule.find(d => d.day === day)?.slots?.find(s => s.time === time)
                  const key   = `${day}-${time}`
                  const assigned = slotTeachers[key] || []
                  return (
                    <div key={key} className="tt-cell"
                      style={slot?.subject ? { background: getColor(slot.subject), color: getText(slot.subject), flexDirection: 'column', alignItems: 'stretch', gap: '0.3rem', padding: '0.5rem' } : { padding: '0.5rem' }}>
                      {slot?.subject && (
                        <>
                          <span className="tt-subject">{slot.subject}</span>
                          <TeacherPicker
                            allTeachers={allTeachers}
                            selected={assigned}
                            onChange={teachers => updateSlotTeachers(day, time, teachers)}
                          />
                          {assigned.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem' }}>
                              {assigned.map(name => (
                                <span key={name} style={{
                                  fontSize: '0.6rem', padding: '0.1rem 0.35rem', borderRadius: 0,
                                  background: getText(slot.subject) + '22', color: getText(slot.subject), fontWeight: 600,
                                }}>
                                  {name.split(' ').slice(-1)[0]}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )
                })}
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      ) : (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem' }}>
          <Calendar size={48} color="var(--text-muted)" style={{ opacity: 0.4 }} />
          <p className="text-muted">Select a semester and click Generate to create the timetable</p>
        </div>
      )}
    </div>
  )
}

