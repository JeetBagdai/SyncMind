// scripts/seed-users.mjs
// Uses the Firebase Auth REST API + Firestore REST API directly.
// No firebase-admin or gcloud login required — just your .env keys.
// Run: node scripts/seed-users.mjs

import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

// ── Load .env ─────────────────────────────────────────────────────────────
const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath   = resolve(__dirname, '../.env')
const envLines  = readFileSync(envPath, 'utf8').split('\n')
for (const line of envLines) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue
  const eq = trimmed.indexOf('=')
  if (eq === -1) continue
  process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
}

const API_KEY    = process.env.VITE_FIREBASE_API_KEY
const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID

if (!API_KEY || !PROJECT_ID) {
  console.error('❌  VITE_FIREBASE_API_KEY or VITE_FIREBASE_PROJECT_ID missing from .env')
  process.exit(1)
}

// ── Helpers ───────────────────────────────────────────────────────────────
async function fetchJSON(url, opts = {}) {
  const res  = await fetch(url, opts)
  const body = await res.json()
  if (!res.ok) throw new Error(body?.error?.message || JSON.stringify(body))
  return body
}

async function createAuthUser(email, password, displayName) {
  // Try sign-up first; if email exists, sign in to get UID
  try {
    const data = await fetchJSON(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
      {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email, password, displayName, returnSecureToken: true }),
      }
    )
    console.log(`✅  Created: ${email}  (uid: ${data.localId})`)
    return { uid: data.localId, idToken: data.idToken }
  } catch (err) {
    if (err.message.includes('EMAIL_EXISTS')) {
      console.log(`⚠️   Already exists: ${email} — signing in to get UID`)
      const data = await fetchJSON(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
        {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, password, returnSecureToken: true }),
        }
      )
      console.log(`✅  Signed in: ${email}  (uid: ${data.localId})`)
      return { uid: data.localId, idToken: data.idToken }
    }
    throw err
  }
}

async function writeFirestoreDoc(uid, profileData) {
  // Convert profile to Firestore REST format
  function toFSValue(val) {
    if (val === null || val === undefined) return { nullValue: null }
    if (typeof val === 'string')  return { stringValue: val }
    if (typeof val === 'number')  return { integerValue: String(val) }
    if (typeof val === 'boolean') return { booleanValue: val }
    return { stringValue: String(val) }
  }

  const fields = {}
  for (const [k, v] of Object.entries(profileData)) {
    fields[k] = toFSValue(v)
  }

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}`
  const res = await fetch(url, {
    method:  'PATCH',
    headers: {
      'Content-Type': 'application/json',
      // No auth needed if Firestore is in test mode; otherwise use idToken below
    },
    body: JSON.stringify({ fields }),
  })
  const body = await res.json()
  if (!res.ok) {
    // Try with no auth — works in test mode
    throw new Error(body?.error?.message || JSON.stringify(body))
  }
  console.log(`📄  Firestore profile written for uid: ${uid}`)
}

// ── User definitions ──────────────────────────────────────────────────────
const USERS = [
  {
    email:       'admin@bnmit.in',
    password:    'BNMIT@Admin2025',
    displayName: 'BNMIT Admin',
    profile: {
      name:      'BNMIT Admin',
      email:     'admin@bnmit.in',
      role:      'admin',
      school:    'BNM Institute of Technology',
      createdAt: new Date().toISOString(),
    },
  },
  {
    email:       'teacher.aiml@bnmit.in',
    password:    'AIML@Teacher2025',
    displayName: 'Dr. Kavitha Reddy',
    profile: {
      name:       'Dr. Kavitha Reddy',
      email:      'teacher.aiml@bnmit.in',
      role:       'teacher',
      department: 'AIML',
      semester:   5,
      classId:    'AIML-SEM5',
      school:     'BNM Institute of Technology',
      createdAt:  new Date().toISOString(),
    },
  },
  {
    email:       'student.aiml@bnmit.in',
    password:    'AIML@Student2025',
    displayName: 'Rahul Nair',
    profile: {
      name:       'Rahul Nair',
      email:      'student.aiml@bnmit.in',
      role:       'student',
      department: 'AIML',
      semester:   5,
      classId:    'AIML-SEM5',
      usn:        '1BM22AI001',
      school:     'BNM Institute of Technology',
      createdAt:  new Date().toISOString(),
    },
  },
]

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n🚀  Seeding users for project: ${PROJECT_ID}\n`)

  for (const u of USERS) {
    try {
      const { uid } = await createAuthUser(u.email, u.password, u.displayName)
      await writeFirestoreDoc(uid, { ...u.profile, uid })
    } catch (err) {
      console.error(`❌  Failed for ${u.email}:`, err.message)
    }
  }

  console.log('\n✨  Done!\n')
  console.log('  🛡️  Admin')
  console.log('     Email   : admin@bnmit.in')
  console.log('     Password: BNMIT@Admin2025\n')
  console.log('  👩‍🏫 Teacher')
  console.log('     Email   : teacher.aiml@bnmit.in')
  console.log('     Password: AIML@Teacher2025\n')
  console.log('  🎒 Student')
  console.log('     Email   : student.aiml@bnmit.in')
  console.log('     Password: AIML@Student2025\n')
}

main().catch(err => { console.error('❌  Fatal:', err.message); process.exit(1) })
