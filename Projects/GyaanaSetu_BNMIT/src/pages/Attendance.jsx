// src/pages/Attendance.jsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { QrCode, Camera, CheckCircle, XCircle, PlayCircle, StopCircle, Users, BookOpen } from 'lucide-react'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useAuth } from '../context/AuthContext'
import { getToken } from '../services/auth'
import { createAttendanceSession, markAttendance, getAttendanceReport, getTeacherAttendanceReport } from '../services/api'
import './Attendance.css'

const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'))
    } else {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({ lat: position.coords.latitude, lng: position.coords.longitude }),
        (error) => {
          console.error("Geolocation error:", error)
          if (error.code === error.PERMISSION_DENIED) {
            reject(new Error('Location permission denied. Please allow location access in your browser settings to mark attendance.'))
          } else if (error.code === error.TIMEOUT) {
            reject(new Error('Location request timed out. Make sure your device has location services enabled.'))
          } else {
            reject(new Error(`Unable to retrieve your location: ${error.message}`))
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      )
    }
  })
}

const AIML_SUBJECTS = [
  { code: '21AI501', name: 'Machine Learning' },
  { code: '21AI502', name: 'Deep Learning' },
  { code: '21AI503', name: 'Natural Language Processing' },
  { code: '21AI504', name: 'Computer Vision' },
  { code: '21AI505', name: 'Big Data Analytics' },
  { code: '21AI506', name: 'Cloud Computing' },
]

const AIML_SEMESTERS = [
  { id: 'AIML-SEM3', label: 'Semester 3' },
  { id: 'AIML-SEM4', label: 'Semester 4' },
  { id: 'AIML-SEM5', label: 'Semester 5' },
  { id: 'AIML-SEM6', label: 'Semester 6' },
  { id: 'AIML-SEM7', label: 'Semester 7' },
  { id: 'AIML-SEM8', label: 'Semester 8' },
]

const STUDENT_CLASS_ID = 'AIML-SEM5'

function QrScannerBox({ onScan, onCancel }) {
  const onScanRef = useRef(onScan)

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    let scanner = null
    const timer = setTimeout(() => {
      scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false)
      scanner.render(
        (text) => {
          scanner.clear()
          if (onScanRef.current) onScanRef.current(text)
        },
        (err) => {}
      )
    }, 150) // Small delay to bypass React 18 StrictMode double-mount

    return () => {
      clearTimeout(timer)
      if (scanner) {
        scanner.clear().catch(() => {})
      }
    }
  }, [])

  return (
    <>
      <p className="text-muted text-sm" style={{ marginBottom: '1rem' }}>
        Point your camera at the QR code
      </p>
      <button
        className="btn btn-ghost btn-sm"
        style={{ marginTop: '1rem' }}
        onClick={onCancel}
      >
        Cancel
      </button>
    </>
  )
}


function TeacherAttendanceReport({ teacherSem, setTeacherSem, profile }) {
  const [reportData, setReportData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState('All')
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const data = await getTeacherAttendanceReport(teacherSem, null, profile?.uid)
        setReportData(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [teacherSem, profile?.uid])

  const availableSubjects = Array.from(new Set(reportData.flatMap(s => s.records.map(r => r.subject))))
  
  useEffect(() => {
    if (selectedSubject !== 'All' && !availableSubjects.includes(selectedSubject)) {
      setSelectedSubject('All')
    }
  }, [availableSubjects, selectedSubject])

  const tableData = reportData.map(s => {
    const filteredRecords = selectedSubject === 'All' 
      ? s.records 
      : s.records.filter(r => r.subject === selectedSubject)
    return {
      id: s.studentId,
      name: s.name,
      presentCount: filteredRecords.length,
      lastAttended: filteredRecords.length > 0 
        ? new Date(Math.max(...filteredRecords.map(r => r.timestamp))).toLocaleDateString()
        : 'Never'
    }
  })

  return (
    <div className="attendance-teacher">
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem' }}>
        <h2 className="section-title" style={{ marginBottom: '1rem' }}>Attendance Reports</h2>
        <p className="text-muted text-sm" style={{ marginBottom: '1.5rem' }}>View aggregate attendance for students in classes you teach.</p>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Semester</label>
            <select className="form-input" value={teacherSem} onChange={e => setTeacherSem(e.target.value)} style={{ minWidth: 150, padding: '0.5rem' }}>
              {AIML_SEMESTERS.map(sem => (
                <option key={sem.id} value={sem.id}>{sem.label}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>Subject</label>
            <select className="form-input" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} style={{ minWidth: 200, padding: '0.5rem' }}>
              <option value="All">All Your Subjects</option>
              {availableSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>Loading reports...</div>
        ) : tableData.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No attendance records found for your classes in {AIML_SEMESTERS.find(s => s.id === teacherSem)?.label}.
          </div>
        ) : (
          <div className="table-responsive" style={{ maxHeight: 500, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--surface)' }}>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Student</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Classes Attended</th>
                  <th style={{ padding: '1rem 1.5rem', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Last Attended</th>
                </tr>
              </thead>
              <tbody>
                {tableData.sort((a,b) => b.presentCount - a.presentCount).map((row, i) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? 'transparent' : 'var(--background)' }}>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>{row.id}</div>
                    </td>
                    <td style={{ padding: '1rem 1.5rem' }}>
                      <span className="badge badge-teal" style={{ fontSize: '0.8rem', padding: '0.2rem 0.6rem' }}>{row.presentCount} {row.presentCount === 1 ? 'class' : 'classes'}</span>
                    </td>
                    <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {row.lastAttended}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Attendance() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const isTeacher = profile?.role === 'teacher'

  const [teacherSem, setTeacherSem] = useState('AIML-SEM5')

  // Student state
  const [scanResult, setScanResult]   = useState(null)   // 'success' | 'expired' | 'error'
  const [scanning, setScanning]       = useState(false)

  return (
    <div className="page-inner">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">
            {isTeacher
              ? 'View class attendance reports'
              : `Scan the class QR to mark your presence · AIML Sem ${profile?.semester || profile?.classId?.replace('AIML-SEM', '') || '5'}`}
          </p>
        </div>
        {!isTeacher && (
          <span className="badge badge-orange" style={{ fontSize: '0.8rem', padding: '0.35rem 0.9rem' }}>
            {profile?.classId || `AIML-SEM${profile?.semester || '5'}`}
          </span>
        )}
      </div>

      {/* ── TEACHER VIEW ── */}
      {isTeacher && (
        <TeacherAttendanceReport teacherSem={teacherSem} setTeacherSem={setTeacherSem} profile={profile} />
      )}

      {/* ── STUDENT VIEW ── */}
      {!isTeacher && (
        <div className="attendance-student">
          {/* Always render the div in the DOM so html5-qrcode can NEVER fail to find it */}
          <div id="qr-reader" className="qr-reader-box" style={{ display: scanning ? 'block' : 'none' }} />

          <AnimatePresence mode="wait">
            {!scanning && !scanResult && (
              <motion.div
                key="idle"
                className="card scan-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <QrCode size={72} color="var(--accent-primary)" style={{ opacity: 0.8 }} />
                <h2 className="panel-title" style={{ marginTop: '1rem' }}>Ready to Attend?</h2>
                <p className="text-muted text-sm">Ask your teacher to start the class, then scan the QR code</p>
                <button
                  className="btn btn-primary"
                  style={{ marginTop: '1.5rem' }}
                  onClick={() => { setScanning(true); setScanResult(null) }}
                  id="scan-qr-btn"
                >
                  <Camera size={16} />
                  {t('scan_qr')}
                </button>
              </motion.div>
            )}

            {scanning && (
              <motion.div
                key="scanning"
                className="card scan-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <QrScannerBox
                  onScan={async (text) => {
                    setScanning(false)
                    setScanResult('verifying')
                    try {
                      const location = await getCurrentLocation()
                      const token = await getToken()
                      await markAttendance({ 
                        qrData: text, 
                        studentId: profile?.uid, 
                        name: profile?.name,
                        lat: location.lat,
                        lng: location.lng
                      }, token)
                      setScanResult('success')
                    } catch (e) {
                      try {
                        const parsed = JSON.parse(e.message)
                        setScanResult(`error:${parsed.message || parsed.error}`)
                      } catch {
                        if (e.message?.includes('Location') || e.message?.includes('Geolocation')) {
                          setScanResult(`error:${e.message}`)
                        } else {
                          setScanResult(e.message?.includes('expired') ? 'expired' : `error:Server Error: ${e.message}`)
                        }
                      }
                    }
                  }}
                  onCancel={() => setScanning(false)}
                />
              </motion.div>
            )}

            {scanResult === 'verifying' && (
              <motion.div
                key="verifying"
                className="card scan-card"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <div style={{ padding: '2rem' }}>
                  <div className="spinner" style={{ margin: '0 auto 1rem', borderTopColor: 'var(--primary)' }}></div>
                  <h2 className="panel-title">Verifying Location...</h2>
                  <p className="text-muted text-sm" style={{ marginTop: '0.5rem' }}>Please allow location access if prompted</p>
                </div>
              </motion.div>
            )}

            {scanResult === 'success' && (
              <motion.div
                key="success"
                className="card scan-card result-success"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <CheckCircle size={72} color="var(--accent-success)" />
                <h2 className="panel-title" style={{ color:'var(--accent-success)' }}>{t('marked_present')}</h2>
                <p className="text-muted text-sm">{t('attendance_recorded', 'Your attendance has been recorded')}</p>
                <button className="btn btn-secondary btn-sm" onClick={() => setScanResult(null)}>Done</button>
              </motion.div>
            )}

            {(scanResult === 'expired' || (typeof scanResult === 'string' && scanResult.startsWith('error'))) && (
              <motion.div
                key="error"
                className="card scan-card result-error"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <XCircle size={72} color="var(--accent-danger)" />
                <h2 className="panel-title" style={{ color:'var(--accent-danger)' }}>
                  {scanResult === 'expired' ? 'QR Expired' : 
                   (scanResult.includes('too far') ? 'Out of Range' : 'Error')}
                </h2>
                <p className="text-muted text-sm">
                  {scanResult === 'expired' 
                    ? t('qr_expired') 
                    : scanResult.replace('error:', '')}
                </p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setScanResult(null); setScanning(false) }}
                >
                  Try Again
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
