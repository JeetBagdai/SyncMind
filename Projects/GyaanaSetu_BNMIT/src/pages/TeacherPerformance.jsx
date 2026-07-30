import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { getToken } from '../services/auth'
import { getDashboardStats } from '../services/api'
import { BarChart3, Search, TrendingUp, TrendingDown, BookOpen, User, Loader } from 'lucide-react'

// Map semester number to classId
const SEM_TO_CLASS = {
  3: 'AIML-SEM3',
  4: 'AIML-SEM4',
  5: 'AIML-SEM5',
  6: 'AIML-SEM6',
  7: 'AIML-SEM7',
  8: 'AIML-SEM8'
}

export default function TeacherPerformance() {
  const { profile } = useAuth()
  
  const [availableClasses, setAvailableClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // 1. Parse teacher's assigned subjects to get available classes
  useEffect(() => {
    if (profile?.role === 'teacher' && profile?.subjects) {
      const subjectStrings = profile.subjects.split(',').map(s => s.trim())
      const sems = new Set()
      
      subjectStrings.forEach(s => {
        const match = s.match(/(.+)\s*\(Sem\s*(\d+)\)/i)
        if (match) {
          const semNum = parseInt(match[2], 10)
          if (semNum >= 3) {
            sems.add(semNum)
          }
        }
      })

      const classList = Array.from(sems).sort((a,b) => a - b).map(semNum => ({
        label: `AIML - Semester ${semNum}`,
        id: SEM_TO_CLASS[semNum]
      }))
      
      setAvailableClasses(classList)
      if (classList.length > 0) {
        setSelectedClass(classList[0].id)
      }
    }
  }, [profile])

  // 2. Fetch data for selected class
  useEffect(() => {
    async function loadData() {
      if (!selectedClass) return
      setLoading(true)
      try {
        const token = await getToken()
        const data = await getDashboardStats('teacher', selectedClass, token)
        setStats(data)
      } catch (err) {
        console.error('Failed to load performance stats', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [selectedClass])

  if (profile?.role !== 'teacher') {
    return (
      <div className="fade-in" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <p>This page is only accessible to Faculty.</p>
      </div>
    )
  }

  const students = stats?.studentPerformance || []
  
  // Filter students based on search
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="fade-in" style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
          <div style={{ padding: '0.5rem', background: 'var(--color-orange-soft)', color: 'var(--color-orange)', borderRadius: '0.5rem' }}>
            <BarChart3 size={24} />
          </div>
          <h1 className="page-title" style={{ marginBottom: 0 }}>Student Performance</h1>
        </div>
        <p className="page-subtitle" style={{ marginLeft: '3.25rem' }}>Analyze quiz scores and track weak topics across your classes.</p>
      </motion.div>

      {availableClasses.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <BookOpen size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
          <h3>No Subjects Assigned</h3>
          <p>You don't have any classes assigned to you yet.</p>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="card" style={{ padding: '1.25rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>Select Class:</label>
              <select 
                className="input" 
                value={selectedClass} 
                onChange={e => setSelectedClass(e.target.value)}
                style={{ minWidth: '200px' }}
              >
                {availableClasses.map(c => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            
            <div style={{ position: 'relative', width: '300px', maxWidth: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                className="input" 
                placeholder="Search students..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: '2.5rem', width: '100%' }}
              />
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading ? (
              <div style={{ padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)', gap: '1rem' }}>
                <Loader size={32} className="spin-anim" />
                <p>Loading performance data...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <User size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                <h3>No Data Available</h3>
                <p>No student performance data found for this class.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
                      <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Student Name</th>
                      <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>Modules Completed</th>
                      <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>Avg Quiz Score</th>
                      <th style={{ padding: '1rem', fontWeight: 600, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Weak Topics Identified</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student, idx) => (
                      <tr key={student.id || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ 
                            width: 32, height: 32, borderRadius: '50%', 
                            background: 'var(--color-orange-soft)', color: 'var(--color-orange)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 600, fontSize: '0.85rem'
                          }}>
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <span style={{ fontWeight: 500 }}>{student.name}</span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <span style={{ fontWeight: 600 }}>{student.chaptersRead}</span>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '1rem', 
                                        background: student.score >= 75 ? 'rgba(34,197,94,0.1)' : student.score >= 50 ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                                        color: student.score >= 75 ? '#16a34a' : student.score >= 50 ? '#ca8a04' : '#dc2626',
                                        fontWeight: 600, fontSize: '0.85rem' }}>
                            {student.score >= 75 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {student.score}%
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          {student.weakTopics && student.weakTopics.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                              {student.weakTopics.map((topic, i) => (
                                <span key={i} style={{ 
                                  fontSize: '0.75rem', padding: '0.2rem 0.5rem', 
                                  background: 'var(--surface)', border: '1px solid var(--border)',
                                  borderRadius: '0.25rem', color: 'var(--text-secondary)' 
                                }}>
                                  {topic}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>None identified</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
