// functions/src/auth/index.js
// Auth helpers — set role, get profile

const { db, admin, verifyToken } = require('../utils')

// POST /auth/setRole  { role: 'student'|'teacher', grade: 'VI' }
async function setRole(req, res) {
  try {
    const decoded = await verifyToken(req)
    const { role, grade, name } = req.body

    if (!['student', 'teacher'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' })
    }

    const profileData = {
      uid:   decoded.uid,
      email: decoded.email,
      role,
      name:  name || decoded.name || '',
      grade: role === 'student' ? (grade || null) : null,
      school: process.env.SCHOOL_NAME || 'GyaanaSetu School',
      updatedAt: new Date().toISOString(),
    }

    await db.collection('users').doc(decoded.uid).set(profileData, { merge: true })

    // Set custom claims (allows Firestore rules to check role)
    await admin.auth().setCustomUserClaims(decoded.uid, { role })

    return res.json({ success: true, profile: profileData })
  } catch (err) {
    console.error('setRole error:', err)
    res.status(500).json({ error: err.message })
  }
}

// GET /auth/profile
async function getProfile(req, res) {
  try {
    const decoded = await verifyToken(req)
    const snap = await db.collection('users').doc(decoded.uid).get()

    if (!snap.exists) return res.status(404).json({ error: 'Profile not found' })
    return res.json(snap.data())
  } catch (err) {
    console.error('getProfile error:', err)
    res.status(500).json({ error: err.message })
  }
}

module.exports = { setRole, getProfile }
