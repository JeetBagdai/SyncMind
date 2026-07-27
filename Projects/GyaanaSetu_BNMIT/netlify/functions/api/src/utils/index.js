// functions/src/utils/index.js
// Shared Firebase Admin + Firebase Storage setup

const admin  = require('firebase-admin')

// Init Firebase Admin once — must specify projectId to match Firebase Auth token audience
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || 'gyaanasetu-bnmit',
  })
}

const db      = admin.firestore()
const storage = admin.storage()
const bucket  = storage.bucket(process.env.GCS_BUCKET || 'gyaanasetu-bnmit.firebasestorage.app')

// Verify Firebase ID token from Authorization header
async function verifyToken(req) {
  const authHeader = req.headers['authorization'] || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) throw new Error('Unauthorized: no token')
  const decoded = await admin.auth().verifyIdToken(token)
  return decoded
}

module.exports = { admin, db, storage, bucket, verifyToken }

