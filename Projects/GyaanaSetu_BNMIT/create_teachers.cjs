// create_teachers.js — run from the project root
const admin = require('./netlify/functions/api/node_modules/firebase-admin')
const fs    = require('fs')
const path  = require('path')

const serviceAccount = require('C:\\Users\\Jeet\\Desktop\\Projects\\GyaanaSetu_BNMIT\\gyaanasetu-bnmit-firebase-adminsdk-fbsvc-b711e15f59.json')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
})

const db   = admin.firestore()
const auth = admin.auth()

function toEmail(fullName) {
  return fullName
    .replace(/^(Dr\.|Mrs\.|Mr\.|Ms\.|Prof\.)\s*/i, '')
    .replace(/\s+/g, '')
    .replace(/\./g, '')
    .toLowerCase() + '@bnmit.in'
}

function makePassword(fullName) {
  const first = fullName
    .replace(/^(Dr\.|Mrs\.|Mr\.|Ms\.|Prof\.)\s*/i, '')
    .split(' ')[0]
    .replace(/[^a-zA-Z]/g, '')
  return `Bnmit@${first}2024`
}

const TEACHERS = [
  { name: 'Dr. Sheba Selvam',             role: 'Professor & HOD' },
  { name: 'Dr. Divyashree B A',           role: 'Professor' },
  { name: 'Dr. Tejaswini R Murgod',       role: 'Professor' },
  { name: 'Dr. Kakoli Bora',              role: 'Associate Professor' },
  { name: 'Dr. Sunitha R',                role: 'Associate Professor' },
  { name: 'Dr. Anitha C',                 role: 'Associate Professor' },
  { name: 'Dr. Mahanthesha U',            role: 'Associate Professor' },
  { name: 'Dr. Nagarathna C R',           role: 'Associate Professor' },
  { name: 'Dr. VANI K A',                 role: 'Associate Professor' },
  { name: 'Dr. Halaharvi Keerthi',        role: 'Associate Professor' },
  { name: 'Mr. Mohanesh B M',             role: 'Assistant Professor' },
  { name: 'Mrs. Pavithra H C',            role: 'Assistant Professor' },
  { name: 'Mrs. Poornima N',              role: 'Assistant Professor' },
  { name: 'Mrs. Arpitha Devangavi',       role: 'Assistant Professor' },
  { name: 'Mrs. Pankaja R',               role: 'Assistant Professor' },
  { name: 'Mr. Pradip Kumar Das',         role: 'Professor of Practice' },
  { name: 'Mrs. Nayana',                  role: 'Assistant Professor' },
  { name: 'Mrs. Kavya M S',              role: 'Assistant Professor' },
  { name: 'Mrs. Abhilasha P Kumar',       role: 'Assistant Professor' },
  { name: 'Mrs. Divya M S',              role: 'Assistant Professor' },
  { name: 'Mrs. Trupti Dattatraya Hegde', role: 'Assistant Professor' },
  { name: 'Mrs. Kruthi P',               role: 'Assistant Professor' },
  { name: 'Mrs. Kirti Pavan',            role: 'Assistant Professor' },
  { name: 'Mrs. Shravya G Gowda',        role: 'Assistant Professor' },
]

// Old test teacher to remove
const OLD_TEACHER_UID = 'F1S4pVFRHgdEuzPXZwUmRIeIVww2'

async function main() {
  console.log('=== GyaanaSetu BNMIT — Bulk Teacher Account Creator ===\n')

  // Delete old test teacher
  try {
    await auth.deleteUser(OLD_TEACHER_UID)
    console.log('✅ Deleted old test teacher (teacher.aiml@bnmit.in)\n')
  } catch (e) {
    console.warn(`⚠️  Old teacher already removed or not found: ${e.message}\n`)
  }
  try { await db.collection('users').doc(OLD_TEACHER_UID).delete() } catch(_) {}

  const results = []

  for (const t of TEACHERS) {
    const email    = toEmail(t.name)
    const password = makePassword(t.name)
    try {
      const user = await auth.createUser({ email, password, displayName: t.name, emailVerified: true })
      await db.collection('users').doc(user.uid).set({
        uid: user.uid, name: t.name, email,
        role: 'teacher', designation: t.role,
        department: 'AIML', timetableManager: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      console.log(`✅  ${t.name.padEnd(35)} ${email}`)
      results.push({ name: t.name, designation: t.role, email, password, status: 'Created' })
    } catch (e) {
      const msg = e.code === 'auth/email-already-exists' ? 'Already existed' : `Failed: ${e.message}`
      console.log(`⚠️   ${t.name.padEnd(35)} ${email} — ${msg}`)
      results.push({ name: t.name, designation: t.role, email, password, status: msg })
    }
  }

  // Write CSV
  const csvPath = path.join(__dirname, 'teacher_credentials.csv')
  const csv = [
    'Name,Designation,Email,Password,Status',
    ...results.map(r => `"${r.name}","${r.designation}","${r.email}","${r.password}","${r.status}"`)
  ].join('\n')
  fs.writeFileSync(csvPath, csv, 'utf8')

  console.log(`\n📄  Credentials CSV saved to:\n    ${csvPath}`)
  console.log('\n=== Done ===')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
