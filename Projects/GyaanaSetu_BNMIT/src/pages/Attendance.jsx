// src/pages/Attendance.jsx
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import { QrCode, Camera, CheckCircle, XCircle, PlayCircle, StopCircle, Users, BookOpen } from 'lucide-react'
import { QRCodeSVG as QRCode } from 'qrcode.react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { useAuth } from '../context/AuthContext'
import { getToken } from '../services/auth'
import { createAttendanceSession, markAttendance, getAttendanceReport } from '../services/api'
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
  { id: 'AIML-SEM1', label: 'Semester 1' },
  { id: 'AIML-SEM2', label: 'Semester 2' },
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


export default function Attendance() {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const isTeacher = profile?.role === 'teacher'

  // Teacher state
  const [session, setSession]             = useState(null)
  const [sessionActive, setSessionActive] = useState(false)
  const [presentStudents, setPresentStudents] = useState([])
  const [loadingSession, setLoadingSession]   = useState(false)
  const [selectedSubject, setSelectedSubject] = useState(AIML_SUBJECTS[0])
  const [teacherSem, setTeacherSem]           = useState('AIML-SEM5') // teacher picks which sem

  // Polling for live attendance updates
  useEffect(() => {
    let interval
    const classId = isTeacher ? teacherSem : STUDENT_CLASS_ID
    if (sessionActive && session?.sessionId) {
      interval = setInterval(async () => {
        try {
          const token = await getToken()
          const today = new Date().toISOString().split('T')[0]
          const report = await getAttendanceReport(classId, today, token)
          const current = report.present.filter(s => s.sessionId === session.sessionId)
          setPresentStudents(current.map(s => ({
            id: s.studentId,
            name: s.name || `Student (${s.studentId.slice(0, 4)})`,
          })))
        } catch (err) {
          console.error('[Attendance] Poll error', err)
        }
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [sessionActive, session, teacherSem, isTeacher])

  // Student state
  const [scanResult, setScanResult]   = useState(null)   // 'success' | 'expired' | 'error'
  const [scanning, setScanning]       = useState(false)

  // ── TEACHER: Start session ──────────────────────────
  const handleStartClass = async () => {
    setLoadingSession(true)
    try {
      const location = await getCurrentLocation()
      const token = await getToken()
      const data  = await createAttendanceSession({
        classId:   teacherSem,
        teacherId: profile?.uid,
        subject:   `${selectedSubject.code} - ${selectedSubject.name}`,
        lat: location.lat,
        lng: location.lng,
      }, token)
      setSession(data)
      setSessionActive(true)
      setPresentStudents([])
    } catch (err) {
      console.error("Start class error:", err)
      const msg = err.message?.toLowerCase() || ''
      if (msg.includes('location') || msg.includes('geolocation')) {
        alert(err.message)
      } else {
        alert('Could not create session. Make sure Cloud Functions are deployed.')
      }
    } finally {
      setLoadingSession(false)
    }
  }

  const handleEndClass = () => {
    setSession(null)
    setSessionActive(false)
  }



  return (
    <div className="page-inner">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attendance</h1>
          <p className="page-subtitle">
            {isTeacher
              ? 'Generate QR codes · AIML Semester 4'
              : 'Scan the class QR to mark your presence · AIML Sem 4'}
          </p>
        </div>
        <span className="badge badge-orange" style={{ fontSize: '0.8rem', padding: '0.35rem 0.9rem' }}>AIML-SEM4</span>
      </div>

      {/* ── TEACHER VIEW ── */}
      {isTeacher && (
        <div className="attendance-teacher">
          <div className="attendance-panel card">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Class Session</h2>
                <p className="text-muted text-sm">Select subject and start a session to generate a QR code</p>
              </div>
              {!sessionActive ? (
                <button
                  className="btn btn-primary"
                  onClick={handleStartClass}
                  disabled={loadingSession}
                  id="start-class-btn"
                >
                  <PlayCircle size={16} />
                  {loadingSession ? 'Starting...' : 'Start Class'}
                </button>
              ) : (
                <button className="btn btn-danger" onClick={handleEndClass} id="end-class-btn">
                  <StopCircle size={16} />
                  End Class
                </button>
              )}
            </div>

            {/* Semester + Subject selectors */}
            {!sessionActive && (
              <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                {/* Semester selector */}
                <div>
                  <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                    Select Semester (Class)
                  </label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {AIML_SEMESTERS.map(sem => (
                      <button
                        key={sem.id}
                        type="button"
                        onClick={() => setTeacherSem(sem.id)}
                        style={{
                          padding: '0.4rem 0.9rem',
                          borderRadius: 0,
                          border: teacherSem === sem.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                          background: teacherSem === sem.id ? 'rgba(247,127,50,0.12)' : 'var(--surface)',
                          color: teacherSem === sem.id ? 'var(--primary)' : 'var(--text-muted)',
                          fontSize: '0.8rem',
                          fontWeight: teacherSem === sem.id ? 700 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {sem.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject selector */}
                <div>
                  <label className="form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                    <BookOpen size={14} style={{ display: 'inline', marginRight: 6 }} />
                    Select Subject
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.5rem' }}>
                    {AIML_SUBJECTS.map(subj => (
                      <button
                        key={subj.code}
                        type="button"
                        onClick={() => setSelectedSubject(subj)}
                        style={{
                          padding: '0.65rem 1rem',
                          borderRadius: 0,
                          border: selectedSubject.code === subj.code ? '2px solid var(--primary)' : '1px solid var(--border)',
                          background: selectedSubject.code === subj.code ? 'rgba(247,127,50,0.1)' : 'var(--surface)',
                          color: selectedSubject.code === subj.code ? 'var(--primary)' : 'var(--text-primary)',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontWeight: selectedSubject.code === subj.code ? 600 : 400,
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>{subj.code}</div>
                        <div style={{ fontSize: '0.85rem' }}>{subj.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* Active session info */}
            {sessionActive && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                <span className="badge badge-orange" style={{ fontSize: '0.78rem' }}>
                  {AIML_SEMESTERS.find(s => s.id === teacherSem)?.label || teacherSem}
                </span>
                <span className="badge badge-teal" style={{ fontSize: '0.78rem' }}>
                  {selectedSubject.code} · {selectedSubject.name}
                </span>
              </div>
            )}


            {sessionActive && session && (
              <motion.div
                className="qr-display"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="qr-wrapper">
                  <QRCode
                    value={session.qrData || session.sessionId || 'demo-session'}
                    size={256}
                    bgColor="#ffffff"
                    fgColor="#000000"
                    level="M"
                    includeMargin
                  />
                </div>
                <div className="qr-info">
                  <span className="badge badge-teal">● Live Session</span>
                  <p className="text-sm text-muted" style={{ marginTop: '0.5rem' }}>
                    Session ID: <code>{session.sessionId?.slice(0, 12)}...</code>
                  </p>
                  <p className="text-xs text-muted">
                    Valid for 2 minutes from scan
                  </p>
                </div>
              </motion.div>
            )}

            {!sessionActive && (
              <div className="qr-placeholder">
                <QrCode size={64} color="var(--text-muted)" style={{ opacity: 0.3 }} />
                <p className="text-muted text-sm">{t('start_class_to_gen', 'Start a class to generate QR')}</p>
              </div>
            )}
          </div>

          {/* Attendance feed */}
          <div className="card" style={{ flex: 1 }}>
            <div className="panel-header" style={{ marginBottom: '1rem' }}>
              <h2 className="panel-title">{t('students_present')}</h2>
              <span className="badge badge-teal">{presentStudents.length} present</span>
            </div>
            {presentStudents.length === 0 ? (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'0.75rem', padding:'2rem' }}>
                <Users size={40} color="var(--text-muted)" style={{ opacity: 0.4 }} />
                <p className="text-muted text-sm">Waiting for students to scan...</p>
              </div>
            ) : (
              <div className="present-list">
                {presentStudents.map(s => (
                  <div key={s.id} className="present-item">
                    <div className="present-avatar">{s.name?.[0]}</div>
                    <span className="text-sm font-medium">{s.name}</span>
                    <CheckCircle size={14} color="var(--accent-success)" style={{ marginLeft:'auto' }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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
                          setScanResult(e.message?.includes('expired') ? 'expired' : 'error:Could not mark attendance. Try again.')
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
