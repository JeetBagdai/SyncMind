// functions/src/attendance/index.js
// QR-based attendance: session generation + marking

const crypto = require('crypto')
const { admin, db, verifyToken } = require('../utils')

const HMAC_SECRET = process.env.ATTENDANCE_HMAC_SECRET || 'gyanasetu-secret-change-me'
const QR_VALID_MS = 2 * 60 * 1000  // 2 minutes

function signSession(sessionId, timestamp) {
  return crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(`${sessionId}:${timestamp}`)
    .digest('hex')
    .slice(0, 16)
}

// Haversine formula to calculate distance between two coordinates in meters
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

// POST /attendance/session
async function createSession(req, res) {
  try {
    const decoded = await verifyToken(req)
    const { classId, subject, lat, lng } = req.body

    const sessionId  = crypto.randomUUID()
    const timestamp  = Date.now()
    const signature  = signSession(sessionId, timestamp)
    const qrData     = JSON.stringify({ sessionId, timestamp, signature })
    const expiresAt  = timestamp + QR_VALID_MS

    await db.collection('attendanceSessions').doc(sessionId).set({
      sessionId,
      classId:   classId || 'default',
      teacherId: decoded.uid,
      subject:   subject || 'General',
      location:  lat && lng ? { lat, lng } : null,
      createdAt: timestamp,
      expiresAt,
      active:    true,
    })

    return res.json({ sessionId, qrData, expiresAt })
  } catch (err) {
    console.error('createSession error:', err)
    res.status(500).json({ error: err.message })
  }
}

// POST /attendance/mark
async function markAttendance(req, res) {
  try {
    const decoded = await verifyToken(req)
    const { qrData, name, lat, lng } = req.body

    let parsed
    try {
      parsed = JSON.parse(qrData)
    } catch {
      return res.status(400).json({ error: 'Invalid QR data' })
    }

    const { sessionId, timestamp, signature } = parsed
    const expected = signSession(sessionId, timestamp)

    // Verify signature
    if (signature !== expected) {
      return res.status(400).json({ error: 'Invalid QR signature' })
    }

    // Check expiry
    if (Date.now() > timestamp + QR_VALID_MS) {
      return res.status(400).json({ error: 'expired', message: 'QR code has expired' })
    }

    // Get session
    const sessionSnap = await db.collection('attendanceSessions').doc(sessionId).get()
    if (!sessionSnap.exists || !sessionSnap.data().active) {
      return res.status(400).json({ error: 'Session not active' })
    }

    const session = sessionSnap.data()
    
    // Distance validation
    if (session.location && session.location.lat && session.location.lng) {
      if (!lat || !lng) {
        return res.status(400).json({ error: 'location_required', message: 'Location is required to mark attendance.' })
      }
      
      const distance = getDistance(session.location.lat, session.location.lng, lat, lng)
      if (distance > 30) {
        return res.status(400).json({ 
          error: 'out_of_range', 
          message: `You are too far from the classroom (${Math.round(distance)}m). You must be within 30m.` 
        })
      }
    }

    const today   = new Date().toISOString().split('T')[0]
    const attRef  = db.collection('attendance')
      .doc(session.classId)
      .collection(today)
      .doc(decoded.uid)

    const existing = await attRef.get()
    
    // Overwrite with the latest session ID so the Teacher's filter works
    await attRef.set({
      present:   true,
      timestamp: Date.now(),
      sessionId,
      name: name || decoded.name || 'Student',
    })

    if (!existing.exists) {
      await db.collection('users').doc(decoded.uid).update({
        totalAttendanceDays: admin.firestore.FieldValue.increment(1)
      })
    }

    return res.json({ success: true, alreadyMarked: existing.exists })
  } catch (err) {
    console.error('markAttendance error:', err)
    res.status(500).json({ error: err.message })
  }
}

// GET /attendance/report?classId=default&date=2025-04-20
async function getReport(req, res) {
  try {
    await verifyToken(req)
    const { classId, date } = req.query
    const today = date || new Date().toISOString().split('T')[0]

    const snap = await db.collection('attendance')
      .doc(classId || 'default')
      .collection(today)
      .get()

    const present = snap.docs.map(d => ({ studentId: d.id, ...d.data() }))
    return res.json({ date: today, present, count: present.length })
  } catch (err) {
    console.error('getReport error:', err)
    res.status(500).json({ error: err.message })
  }
}

module.exports = { createSession, markAttendance, getReport }
