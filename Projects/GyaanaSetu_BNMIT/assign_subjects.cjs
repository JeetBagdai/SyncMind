// assign_subjects.cjs
// Rules:
//   - Each teacher gets max 5 subjects
//   - Each teacher's subjects must be from DIFFERENT semesters (one per sem max)
//   - A subject can have at most 3 teachers assigned to it
//   - Distribute as evenly as possible across all 24 teachers

const path  = require('path')
const admin = require('./netlify/functions/api/node_modules/firebase-admin')
const serviceAccount = require('C:\\Users\\Jeet\\Desktop\\Projects\\GyaanaSetu_BNMIT\\gyaanasetu-bnmit-firebase-adminsdk-fbsvc-b711e15f59.json')

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

// ── Full subject catalogue (sem → subjects) ──────────────────────────────────
const SUBJECTS_BY_SEM = {
  1: [
    'Engineering Mathematics - I',
    'Engineering Physics',
    'Engineering Chemistry',
    'Basic Electronics',
    'Programming in C',
  ],
  2: [
    'Engineering Mathematics - II',
    'Data Structures',
    'Digital Design',
    'Python Programming',
    'Constitution of India',
  ],
  3: [
    'Fourier Transform, Mathematical Logic & Advanced Linear Algebra',
    'Computer Organization and Architecture',
    'Artificial Intelligence',
    'Data Structures & Applications',
    'Microcontroller and Embedded Systems',
    'Object Oriented Programming using Java (Lab)',
  ],
  4: [
    'Statistics, Probability and Graph Theory',
    'Operating System',
    'Database Management System',
    'Design and Analysis of Algorithms',
    'Machine Learning',
    'Cloud Computing & Applications (Lab)',
  ],
  5: [
    'Software Engineering, Project Management & Finance',
    'Automata Theory & Computations',
    'Computer Networks & Security',
    'Advanced Machine Learning',
    'Virtual Reality & Augmented Reality (Lab)',
    'Open Elective - I',
  ],
  6: [
    'Deep Learning',
    'Natural Language Processing',
    'Generative Artificial Intelligence',
    'Image Processing & Computer Vision (Lab)',
    'Professional Elective - I',
    'Professional Elective - II (MOOC)',
  ],
  7: [
    'Agentic Artificial Intelligence',
    'Professional Elective - III',
    'Professional Elective - IV (MOOC)',
    'Research Methodology & Intellectual Property Rights',
  ],
  8: [
    'Professional Elective - V (MOOC)',
  ],
}

// ── Build a flat pool: { sem, name } ─────────────────────────────────────────
const POOL = []
for (const [sem, subjects] of Object.entries(SUBJECTS_BY_SEM)) {
  for (const name of subjects) {
    POOL.push({ sem: Number(sem), name })
  }
}

// Track how many teachers are assigned to each subject (max 3)
const subjectTeacherCount = {}
POOL.forEach(s => { subjectTeacherCount[s.name] = 0 })

// ── Fetch all teachers from Firestore ────────────────────────────────────────
async function getTeachers() {
  const snap = await db.collection('users').where('role', '==', 'teacher').get()
  return snap.docs.map(d => ({ uid: d.id, ...d.data() }))
}

// ── Assign subjects to one teacher ───────────────────────────────────────────
// Rules per teacher:
//   - Max 5 subjects
//   - At most one subject per semester
//   - Only pick subjects that still have < 3 teachers

function assignToTeacher(teacherName, usedSems, maxSubjects = 5) {
  const assigned = []
  const semsCovered = new Set(usedSems)

  // Shuffle pool for variety
  const shuffled = [...POOL].sort(() => Math.random() - 0.5)

  for (const subj of shuffled) {
    if (assigned.length >= maxSubjects) break
    if (semsCovered.has(subj.sem)) continue               // one per sem
    if (subjectTeacherCount[subj.name] >= 3) continue     // max 3 teachers

    assigned.push(subj)
    semsCovered.add(subj.sem)
    subjectTeacherCount[subj.name]++
  }

  return assigned
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== GyaanaSetu BNMIT — Subject Assignment ===\n')

  const teachers = await getTeachers()
  console.log(`Found ${teachers.length} teachers\n`)

  // Sort teachers deterministically (by name) for reproducible output
  teachers.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

  // First pass — assign subjects
  const assignments = teachers.map(t => {
    const subjects = assignToTeacher(t.name)
    return { teacher: t, subjects }
  })

  // ── Write to Firestore ────────────────────────────────────────────────────
  const batch = db.batch()
  for (const { teacher, subjects } of assignments) {
    const subjectsStr = subjects.map(s => `${s.name} (Sem ${s.sem})`).join(', ')
    batch.update(db.collection('users').doc(teacher.uid), {
      subjects: subjectsStr,
    })
  }
  await batch.commit()
  console.log('✅ Firestore updated\n')

  // ── Print summary ─────────────────────────────────────────────────────────
  console.log('── Assignment Summary ─────────────────────────────────────────')
  for (const { teacher, subjects } of assignments) {
    console.log(`\n${teacher.name}`)
    subjects.forEach(s => console.log(`  • [Sem ${s.sem}] ${s.name}`))
    if (subjects.length === 0) console.log('  (no subjects assigned)')
  }

  console.log('\n── Subject Coverage ──────────────────────────────────────────')
  for (const [name, count] of Object.entries(subjectTeacherCount).sort()) {
    console.log(`  ${count} teacher(s) — ${name}`)
  }

  console.log('\n=== Done ===')
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
