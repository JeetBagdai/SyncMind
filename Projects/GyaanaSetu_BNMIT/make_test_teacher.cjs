// make_test_teacher.cjs — create a single test teacher account
const path = require('path')
const admin = require('./netlify/functions/api/node_modules/firebase-admin')
const serviceAccount = require('C:\\Users\\Jeet\\Desktop\\Projects\\GyaanaSetu_BNMIT\\gyaanasetu-bnmit-firebase-adminsdk-fbsvc-b711e15f59.json')

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db   = admin.firestore()
const auth = admin.auth()

async function main() {
  const email    = 'test.teacher@bnmit.in'
  const password = 'TestTeacher@123'
  const name     = 'Dr. Test Teacher'

  try {
    const user = await auth.createUser({ email, password, displayName: name, emailVerified: true })
    await db.collection('users').doc(user.uid).set({
      uid: user.uid, name, email,
      role: 'teacher', designation: 'Assistant Professor',
      department: 'AIML', timetableManager: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })
    console.log(`\n✅ Mock teacher created!\n   Email:    ${email}\n   Password: ${password}\n   UID:      ${user.uid}\n`)
  } catch (e) {
    if (e.code === 'auth/email-already-exists') {
      console.log(`\n⚠️  Already exists:\n   Email:    ${email}\n   Password: ${password}\n`)
    } else {
      console.error('❌', e.message)
    }
  }
  process.exit(0)
}
main()
