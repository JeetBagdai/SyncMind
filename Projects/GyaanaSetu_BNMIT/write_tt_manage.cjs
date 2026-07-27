const fs = require('fs');

const code = `// src/pages/TimetableManage.jsx
// Accessible only to teachers with timetableManager === true
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Plus, Trash2, Wand2, Save, Loader, ShieldCheck, Users, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getToken } from '../services/auth'
import { getTimetable, generateTimetable, saveTimetable } from '../services/api'
import './Timetable.css'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const PROJECT = import.meta.env.VITE_FIREBASE_PROJECT_ID

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

// Fetch all teacher accounts from Firestore
async function fetchTeacherAccounts() {
  const res = await fetch(
    \\\`https://firestore.googleapis.com/v1/projects/\\\${PROJECT}/databases/(default)/documents:runQuery\\\`,
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

// ── Multi-select teacher picker component ─────────────────────────────────
function TeacherPicker({ allTeachers, selected, onChange }) {
  const [open, setOpen] = useState(false)

  const toggle = (name) => {
    if (selected.includes(name)) onChange(selected.filter(n => n !== name))
    else onChange([...selected, name])
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.45rem 0.75rem', borderRadius: '8px', cursor: 'pointer',
          border: '1px solid var(--border)', background: 'var(--bg-input)',
          fontSize: '0.8rem', color: selected.length ? 'var(--text-primary)' : 'var(--text-muted)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', overflow: 'hidden' }}>
          <Users size={12} style={{ flexShrink: 0 }} />
          {selected.length === 0
            ? 'Assign teachers...'
            : selected.length === 1
              ? selected[0]
              : \\\`\\\${selected.length} teachers\\\`}
        </span>
        <ChevronDown size={12} style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
              background: 'var(--bg-card)', border: '1px solid var(--border)',
              borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              maxHeight: 180, overflowY: 'auto', padding: '0.4rem',
            }}
          >
            {allTeachers.length === 0 ? (
              <div style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                No teacher accounts found
              </div>
            ) : allTeachers.map(t => (
              <label key={t.uid} style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.5rem',
                borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem',
                background: selected.includes(t.name) ? 'rgba(247,127,50,0.08)' : 'transparent',
                color: selected.includes(t.name) ? '#ea580c' : 'var(--text-primary)',
              }}>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={selected.includes(t.name)}
                  onChange={() => toggle(t.name)}
                  style={{ flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontWeight: selected.includes(t.name) ? 600 : 400 }}>{t.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{t.email}</div>
                </div>
              </label>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function TimetableManage() {
  const { profile } = useAuth()

  const [selectedSem, setSelectedSem]     = useState('AIML-SEM5')
  
  const [startTime, setStartTime]         = useState('8:15')
  const [subjectConfig, setSubjectConfig] = useState(
    AIML_SUBJECTS.map(name => ({ name, hours: 4, block: false, teacherA: '', teacherB: '' }))
  )
  const [customSubject, setCustomSubject] = useState('')
  const [viewSection, setViewSection]     = useState('A')

  const [generating, setGenerating]       = useState(false)
  const [saving, setSaving]               = useState(false)
  const [schedule, setSchedule]           = useState(null)
  const [savedOk, setSavedOk]             = useState(false)

  // Real teacher accounts from Firestore
  const [allTeachers, setAllTeachers]     = useState([])
  const [loadingTeachers, setLoadingTeachers] = useState(true)

  // Per-slot teacher assignments: { 'A-Monday-9:00': ['Name1','Name2'], ... }
  const [slotTeachers, setSlotTeachers]   = useState({})

  // Fetch teacher accounts once
  useEffect(() => {
    fetchTeacherAccounts()
      .then(setAllTeachers)
      .catch(() => setAllTeachers([]))
      .finally(() => setLoadingTeachers(false))
  }, [])

  // Load existing timetable on semester change
  useEffect(() => {
    setSchedule(null)
    setSavedOk(false)
    setSlotTeachers({})
    async function load() {
      try {
        const token = await getToken()
        const data  = await getTimetable(selectedSem, token)
        if (data?.schedule) {
          setSchedule(data.schedule)
          // Restore existing slot-teacher assignments
          const slotT = {}
          if (data.schedule.scheduleA) {
             data.schedule.scheduleA.forEach(dayObj => {
                dayObj.slots.forEach(s => {
                   if (s.teacher && s.teacher !== '—') slotT['A-' + dayObj.day + '-' + s.time] = [s.teacher]
                })
             })
             data.schedule.scheduleB.forEach(dayObj => {
                dayObj.slots.forEach(s => {
                   if (s.teacher && s.teacher !== '—') slotT['B-' + dayObj.day + '-' + s.time] = [s.teacher]
                })
             })
          }
          setSlotTeachers(slotT)
        }
      } catch (err) {
        console.error('Failed to load timetable', err)
      }
    }
    load()
  }, [selectedSem])

  const handleGenerate = async () => {
    let totalHrs = subjectConfig.reduce((acc, curr) => acc + Number(curr.hours || 0), 0)
    if (totalHrs > 35) {
      alert('Total hours exceed 35 per week (' + totalHrs + '). Please reduce.');
      return;
    }
    
    setGenerating(true); setSavedOk(false)
    try {
      const token = await getToken()
      const data  = await generateTimetable({
        subjectConfig,
        startTime,
        classId: selectedSem,
      }, token)
      setSchedule(data.schedule)
      
      const newSlotT = {}
      if (data.schedule.scheduleA) {
        data.schedule.scheduleA.forEach(d => d.slots.forEach(s => {
          if (s.teacher && s.teacher !== '—') newSlotT['A-' + d.day + '-' + s.time] = [s.teacher];
        }))
        data.schedule.scheduleB.forEach(d => d.slots.forEach(s => {
          if (s.teacher && s.teacher !== '—') newSlotT['B-' + d.day + '-' + s.time] = [s.teacher];
        }))
      }
      setSlotTeachers(newSlotT)
    } catch (err) {
      alert('Generation failed: ' + err.message)
    } finally { setGenerating(false) }
  }

  const handleSave = async () => {
    setSaving(true); setSavedOk(false)
    try {
      // Create a copy of schedule and bake in the slotTeachers modifications
      const finalSchedule = JSON.parse(JSON.stringify(schedule))
      if (finalSchedule.scheduleA) {
          finalSchedule.scheduleA.forEach(d => {
            d.slots.forEach(s => {
              const teachers = slotTeachers['A-' + d.day + '-' + s.time]
              if (teachers && teachers.length > 0) s.teacher = teachers[0]
            })
          })
          finalSchedule.scheduleB.forEach(d => {
            d.slots.forEach(s => {
              const teachers = slotTeachers['B-' + d.day + '-' + s.time]
              if (teachers && teachers.length > 0) s.teacher = teachers[0]
            })
          })
      }
      const token = await getToken()
      await saveTimetable({ schedule: finalSchedule, classId: selectedSem }, token)
      setSavedOk(true)
      setTimeout(() => setSavedOk(false), 3000)
    } catch {
      alert('Failed to save timetable')
    } finally { setSaving(false) }
  }

  const updateSlotTeachers = (dayOrSec, time, selectedNames) => {
    const key = dayOrSec + '-' + time
    setSlotTeachers(p => ({ ...p, [key]: selectedNames }))
    setSavedOk(false) // Prompt save if changed
  }

  if (!profile?.timetableManager) {
    return (
      <div className="page-layout fade-in">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
          <ShieldCheck size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h2>Access Denied</h2>
          <p>You do not have permission to manage timetables.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-layout fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <motion.div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}
        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h1 className="page-title">Timetable Management</h1>
            <p className="page-subtitle">
              Generate gap-free, conflict-free schedules for Sections A & B simultaneously.
            </p>
          </div>
        </div>

        {/* ── Configuration section ── */}
        <div style={{ padding: '1rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <div>
              <label className="form-label" style={{ marginBottom: '0.5rem' }}>
                Select Semester to Manage
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {AIML_SEMESTERS.map(sem => (
                  <button key={sem.id} type="button" onClick={() => setSelectedSem(sem.id)}
                    style={{
                      padding: '0.4rem 0.9rem', borderRadius: '20px',
                      border: selectedSem === sem.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background: selectedSem === sem.id ? 'rgba(247,127,50,0.12)' : 'var(--surface)',
                      color: selectedSem === sem.id ? 'var(--primary)' : 'var(--text-primary)',
                      fontSize: '0.85rem', fontWeight: 500, cursor: 'pointer', transition: 'all 0.2s'
                    }}>
                    {sem.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                Configure · {AIML_SEMESTERS.find(s => s.id === selectedSem)?.label || selectedSem}
              </div>
              <div className="text-muted text-xs">Set subjects and hours, then generate</div>
            </div>
          </div>

          <div className="tt-config-grid" style={{ gridTemplateColumns: '1fr', gap: '1.5rem' }}>
            <div>
              <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', marginBottom: '1rem' }}>
                <label className="form-label" style={{marginBottom: 0}}>Start Time:</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="startTime" checked={startTime === '8:15'} onChange={() => setStartTime('8:15')} /> 8:15 AM
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input type="radio" name="startTime" checked={startTime === '8:30'} onChange={() => setStartTime('8:30')} /> 8:30 AM
                </label>
              </div>
              
              <label className="form-label">Subject & Faculty Configuration</label>
              <div style={{ overflowX: 'auto', background: 'var(--surface)', borderRadius: '8px', border: '1px solid var(--border)', padding: '0.5rem' }}>
                <table style={{ width: '100%', fontSize: '0.85rem', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '0.5rem' }}>Subject</th>
                      <th style={{ padding: '0.5rem' }}>Hrs/Wk</th>
                      <th style={{ padding: '0.5rem' }}>Block Hrs</th>
                      <th style={{ padding: '0.5rem' }}>Teacher (Sec A)</th>
                      <th style={{ padding: '0.5rem' }}>Teacher (Sec B)</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {subjectConfig.map((sc, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        <td style={{ padding: '0.5rem', fontWeight: 500 }}>{sc.name}</td>
                        <td style={{ padding: '0.5rem' }}>
                          <input className="input" type="number" min="1" max="10" value={sc.hours} 
                            onChange={e => {
                              const newConfig = [...subjectConfig];
                              newConfig[i].hours = e.target.value;
                              setSubjectConfig(newConfig);
                            }} 
                            style={{width: 60, padding: '0.2rem 0.5rem', minHeight: 'auto'}} 
                          />
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <input type="checkbox" className="checkbox" checked={sc.block} 
                            onChange={e => {
                              const newConfig = [...subjectConfig];
                              newConfig[i].block = e.target.checked;
                              setSubjectConfig(newConfig);
                            }} 
                          />
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <select className="input" value={sc.teacherA} 
                            onChange={e => {
                              const newConfig = [...subjectConfig];
                              newConfig[i].teacherA = e.target.value;
                              setSubjectConfig(newConfig);
                            }}
                            style={{ padding: '0.2rem 0.5rem', minHeight: 'auto' }}
                          >
                             <option value="">Unassigned</option>
                             {allTeachers.map(t => <option key={t.uid} value={t.name}>{t.name}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                          <select className="input" value={sc.teacherB} 
                            onChange={e => {
                              const newConfig = [...subjectConfig];
                              newConfig[i].teacherB = e.target.value;
                              setSubjectConfig(newConfig);
                            }}
                            style={{ padding: '0.2rem 0.5rem', minHeight: 'auto' }}
                          >
                             <option value="">Unassigned</option>
                             {allTeachers.map(t => <option key={t.uid} value={t.name}>{t.name}</option>)}
                          </select>
                        </td>
                        <td style={{ padding: '0.5rem' }}>
                           <button className="btn" style={{padding: '0.2rem', color: 'var(--text-muted)'}} onClick={() => {
                              setSubjectConfig(p => p.filter((_, idx) => idx !== i))
                           }}><Trash2 size={14}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', padding: '0 0.5rem' }}>
                  <input className="input" placeholder="Add custom subject..." value={customSubject}
                    onChange={e => setCustomSubject(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && customSubject.trim()) {
                        setSubjectConfig(p => [...p, { name: customSubject.trim(), hours: 4, block: false, teacherA: '', teacherB: '' }])
                        setCustomSubject('')
                      }
                    }}
                    style={{ maxWidth: 200, padding: '0.3rem 0.6rem', minHeight: 'auto' }}
                  />
                  <button className="btn btn-secondary btn-sm" type="button" onClick={() => {
                    if (customSubject.trim()) { 
                      setSubjectConfig(p => [...p, { name: customSubject.trim(), hours: 4, block: false, teacherA: '', teacherB: '' }])
                      setCustomSubject('') 
                    }
                  }}>
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="tt-actions" style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
              {generating ? <Loader size={16} className="spin-anim" /> : <Wand2 size={16} />}
              {generating ? 'Generating...' : 'Generate Dual Timetables'}
            </button>
            {schedule && (
              <button className="btn btn-secondary" onClick={handleSave} disabled={saving}>
                {saving ? <Loader size={16} className="spin-anim" /> : <Save size={16} />}
                {savedOk ? 'Saved & Synced!' : saving ? 'Saving...' : 'Save & Sync to All'}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Schedule editor with teacher assignment ── */}
      {schedule ? (
        <motion.div className="tt-grid-wrapper" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 className="section-title" style={{ marginBottom: 0 }}>
                Timetable · {AIML_SEMESTERS.find(s => s.id === selectedSem)?.label || selectedSem}
              </h2>
              {selectedSem.includes('AIML') && (
                <div style={{ display: 'flex', gap: '0.2rem', background: 'var(--surface)', padding: '0.2rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                  <button className={\`btn btn-sm \${viewSection === 'A' ? 'btn-primary' : 'btn-secondary'}\`} onClick={() => setViewSection('A')}>Section A</button>
                  <button className={\`btn btn-sm \${viewSection === 'B' ? 'btn-primary' : 'btn-secondary'}\`} onClick={() => setViewSection('B')}>Section B</button>
                </div>
              )}
            </div>
            {loadingTeachers ? (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Loader size={13} className="spin-anim" /> Loading teachers...
              </span>
            ) : (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {allTeachers.length} teacher{allTeachers.length !== 1 ? 's' : ''} available
              </span>
            )}
          </div>

          {/* Grid */}
          <div className="tt-grid">
            <div className="tt-header-cell tt-time-header">Time</div>
            {DAYS.map(d => <div key={d} className="tt-header-cell">{d}</div>)}
            {(schedule[viewSection === 'A' ? 'scheduleA' : 'scheduleB'] || schedule.scheduleA || [])[0]?.slots.map(s => s.time).map(time => (
              <React.Fragment key={time}>
                {time.includes('Break') || time.includes('Lunch') ? (
                  <div className="tt-break-row" style={{ gridColumn: '1 / -1' }}>{time.split(' ')[1] || 'Break'}</div>
                ) : null}
                <div className="tt-time-cell">{time.split(' ')[0]}</div>
                {DAYS.map(day => {
                  const currentSchedule = schedule[viewSection === 'A' ? 'scheduleA' : 'scheduleB'] || schedule.scheduleA || [];
                  const slot = currentSchedule.find(d => d.day === day)?.slots?.find(s => s.time === time);
                  const key  = \`\${viewSection}-\${day}-\${time}\`;
                  const assignedTeachers = slotTeachers[key] || [];
                  
                  if (time.includes('Break') || time.includes('Lunch')) return <div key={key} style={{display: 'none'}}></div>;

                  return (
                    <div key={key} className="tt-cell"
                      style={slot?.subject && slot.subject !== 'Free' ? { background: getColor(slot.subject), color: getText(slot.subject), padding: '0.5rem', flexDirection: 'column', alignItems: 'stretch', gap: '0.35rem' } : { padding: '0.5rem' }}>
                      {slot?.subject && slot.subject !== 'Free' ? (
                        <>
                          <span className="tt-subject">{slot.subject}</span>
                          <TeacherPicker
                            allTeachers={allTeachers}
                            selected={assignedTeachers}
                            onChange={teachers => updateSlotTeachers(viewSection + '-' + day, time, teachers)}
                          />
                          {assignedTeachers.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.2rem', marginTop: '0.15rem' }}>
                              {assignedTeachers.map(name => (
                                <span key={name} style={{
                                  fontSize: '0.62rem', padding: '0.1rem 0.4rem', borderRadius: '8px',
                                  background: getText(slot.subject) + '22', color: getText(slot.subject), fontWeight: 600,
                                }}>
                                  {name.split(' ').slice(-1)[0]}
                                </span>
                              ))}
                            </div>
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
      ) : (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '3rem' }}>
          <Calendar size={56} color="var(--text-muted)" style={{ opacity: 0.35 }} />
          <p className="text-muted text-sm">
            Select a semester and click Generate to create a timetable for it.
          </p>
        </div>
      )}
    </div>
  )
}
`

fs.writeFileSync('src/pages/TimetableManage.jsx', code);
