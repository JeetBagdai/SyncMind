// cleanup_and_assign.cjs
// 1. Delete duplicate/stale Firestore docs + Firebase Auth accounts
// 2. Re-assign subjects cleanly

const admin = require('./netlify/functions/api/node_modules/firebase-admin')
const sa    = require('C:\\Users\\Jeet\\Desktop\\Projects\\GyaanaSetu_BNMIT\\gyaanasetu-bnmit-firebase-adminsdk-fbsvc-b711e15f59.json')
admin.initializeApp({ credential: admin.credential.cert(sa) })
const db   = admin.firestore()
const auth = admin.auth()

// ── Stale/duplicate UIDs to delete ──────────────────────────────────────────
// Duplicate Pankaja R (keep 0nDBAqzV2eNKKVQcAxKi1eCrudd2, delete cf4e...)
// Duplicate Pradip Kumar Das (keep 17xOBnqReXZ4R5QQ1z7lbqMq2Ru2, delete eZNl...)
// Old test teachers
const DELETE_UIDS = [
  'cf4eEsrT63QXOQ2iwqyBtMEA1bA2', // duplicate Mrs. Pankaja R
  'eZNlJE9VM2WWvOMi9Jw0aK2EEZI2', // duplicate Mr. Pradip Kumar Das
  '5VdCFup38tUe1xk7fkdJqFa8mji1', // Ravi Kumar (test)
  'JNbiUvFLWteqeS5vhugZL2IVxIt2', // Priya Sharma (test)
]

// ── Subject catalogue ────────────────────────────────────────────────────────
const SUBJECTS_BY_SEM = {
  1: ['Engineering Mathematics - I','Engineering Physics','Engineering Chemistry','Basic Electronics','Programming in C'],
  2: ['Engineering Mathematics - II','Data Structures','Digital Design','Python Programming','Constitution of India'],
  3: ['Fourier Transform, Mathematical Logic & Advanced Linear Algebra','Computer Organization and Architecture','Artificial Intelligence','Data Structures & Applications','Microcontroller and Embedded Systems','Object Oriented Programming using Java (Lab)'],
  4: ['Statistics, Probability and Graph Theory','Operating System','Database Management System','Design and Analysis of Algorithms','Machine Learning','Cloud Computing & Applications (Lab)'],
  5: ['Software Engineering, Project Management & Finance','Automata Theory & Computations','Computer Networks & Security','Advanced Machine Learning','Virtual Reality & Augmented Reality (Lab)','Open Elective - I'],
  6: ['Deep Learning','Natural Language Processing','Generative Artificial Intelligence','Image Processing & Computer Vision (Lab)','Professional Elective - I','Professional Elective - II (MOOC)'],
  7: ['Agentic Artificial Intelligence','Professional Elective - III','Professional Elective - IV (MOOC)','Research Methodology & Intellectual Property Rights'],
  8: ['Professional Elective - V (MOOC)'],
}

const POOL = []
for (const [sem, subjects] of Object.entries(SUBJECTS_BY_SEM)) {
  for (const name of subjects) POOL.push({ sem: Number(sem), name })
}

const subjectCount = {}
POOL.forEach(s => { subjectCount[s.name] = 0 })

// Deterministic shuffle seeded by teacher name
function seededShuffle(arr, seed) {
  const a = [...arr]
  let h = 0
  for (let i = 0; i < seed.length; i++) h = Math.imul(31, h) + seed.charCodeAt(i) | 0
  for (let i = a.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d)
    h = Math.imul(h ^ (h >>> 12), 0x297a2d39)
    h ^= h >>> 15
    const j = ((h >>> 0) % (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function assignSubjects(teacherName) {
  const assigned = []
  const semsCovered = new Set()
  const shuffled = seededShuffle(POOL, teacherName)
  
  // Prioritize subjects that have the fewest teachers assigned so far
  shuffled.sort((a, b) => subjectCount[a.name] - subjectCount[b.name])

  for (const subj of shuffled) {
    if (assigned.length >= 5) break
    if (semsCovered.has(subj.sem)) continue
    assigned.push(subj)
    semsCovered.add(subj.sem)
    subjectCount[subj.name]++
  }
  return assigned
}

async function main() {
  console.log('=== Cleanup & Subject Assignment ===\n')

  // 1. Delete stale accounts
  for (const uid of DELETE_UIDS) {
    try { await auth.deleteUser(uid); console.log(`🗑  Deleted Auth: ${uid}`) } catch(e) { console.warn(`  Auth skip: ${uid} — ${e.message}`) }
    try { await db.collection('users').doc(uid).delete(); console.log(`🗑  Deleted Firestore: ${uid}`) } catch(e) {}
  }
  console.log()

  // 2. Fetch clean teacher list
  const snap = await db.collection('users').where('role','==','teacher').get()
  const teachers = snap.docs.map(d => ({ uid: d.id, ...d.data() }))
  teachers.sort((a, b) => (a.name||'').localeCompare(b.name||''))
  console.log(`Found ${teachers.length} teachers after cleanup\n`)

  // 3. Assign subjects
  const assignments = teachers.map(t => ({ teacher: t, subjects: assignSubjects(t.name) }))

  // 4. Write to Firestore
  const batch = db.batch()
  for (const { teacher, subjects } of assignments) {
    const subjectsStr = subjects.map(s => `${s.name} (Sem ${s.sem})`).join(', ')
    batch.update(db.collection('users').doc(teacher.uid), { subjects: subjectsStr })
  }
  await batch.commit()
  console.log('✅ Firestore updated\n')

  // 5. Print summary
  console.log('── Assignment Summary ─────────────────────────────────────────')
  for (const { teacher, subjects } of assignments) {
    console.log(`\n${teacher.name} (${teacher.email})`)
    if (subjects.length === 0) console.log('  ⚠️  No subjects assigned')
    else subjects.forEach(s => console.log(`  • [Sem ${s.sem}] ${s.name}`))
  }

  console.log('\n── Subject Coverage (subjects with < 3 teachers) ──────────────')
  const under = Object.entries(subjectCount).filter(([,c]) => c < 3).sort()
  if (under.length === 0) console.log('  All subjects have 3 teachers ✅')
  else under.forEach(([n, c]) => console.log(`  ${c} teacher(s) — ${n}`))

  console.log('\n=== Done ===')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
