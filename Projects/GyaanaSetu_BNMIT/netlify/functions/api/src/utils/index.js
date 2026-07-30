// functions/src/utils/index.js
// Shared Firebase Admin + Firebase Storage setup

const admin  = require('firebase-admin')

// Init Firebase Admin once — must specify projectId to match Firebase Auth token audience
if (!admin.apps.length) {
  let credential;
  
  // 1. Try to load from a single JSON string environment variable
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      credential = admin.credential.cert(serviceAccount);
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT JSON", e);
    }
  } 
  // 2. Alternatively, try to load from individual variables (often easier to paste into Netlify UI)
  else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    credential = admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID || 'gyaanasetu-bnmit',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace literal \n with actual newlines in case they got escaped in the env var
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  }

  admin.initializeApp({
    credential: credential, // Will be undefined locally, falling back to ADC
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

