// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'

const AuthContext = createContext()

// ── Demo mode: renders full UI without Firebase credentials ──
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
const DEMO_USER    = { uid: 'demo-teacher', email: 'teacher.aiml@bnmit.in' }
const DEMO_PROFILE = {
  name: 'Dr. Kavitha Reddy', email: 'teacher.aiml@bnmit.in',
  role: 'teacher', department: 'AIML', semester: 5,
  classId: 'AIML-SEM5', school: 'BNM Institute of Technology',
}
const DEMO_STUDENT_PROFILE = {
  name: 'Rahul Nair', email: 'student.aiml@bnmit.in',
  role: 'student', department: 'AIML', semester: 5,
  classId: 'AIML-SEM5', usn: '1BM22AI001',
  school: 'BNM Institute of Technology',
}
const DEMO_ADMIN_PROFILE = {
  name: 'BNMIT Admin', email: 'admin@bnmit.in',
  role: 'admin', school: 'BNM Institute of Technology',
}

// VITE_DEMO_MODE: 'true' = teacher, 'student' = student, 'admin' = admin
function getDemoProfile() {
  if (import.meta.env.VITE_DEMO_MODE === 'student') return DEMO_STUDENT_PROFILE
  if (import.meta.env.VITE_DEMO_MODE === 'admin')   return DEMO_ADMIN_PROFILE
  return DEMO_PROFILE
}

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(DEMO_MODE ? DEMO_USER : null)
  const [profile, setProfile] = useState(DEMO_MODE ? getDemoProfile() : null)
  const [loading, setLoading] = useState(!DEMO_MODE)

  useEffect(() => {
    if (DEMO_MODE) return   // skip Firebase in demo mode
    const unsub = onAuthStateChanged(auth, async firebaseUser => {
      if (firebaseUser) {
        try {
          const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
          setUser(firebaseUser)
          setProfile(snap.exists() ? snap.data() : null)
        } catch {
          setUser(firebaseUser)
          setProfile(null)
        }
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const login = async (email, password) => {
    if (DEMO_MODE) return Promise.resolve({ profileData: DEMO_PROFILE })
    const cred = await signInWithEmailAndPassword(auth, email, password)
    let profileData = null
    try {
      const snap = await getDoc(doc(db, 'users', cred.user.uid))
      profileData = snap.exists() ? snap.data() : null
      setUser(cred.user)
      setProfile(profileData)
    } catch (e) {
      console.error('Failed to fetch user profile during login', e)
    }
    return { cred, profileData }
  }

  const register = async (email, password, name, role, grade = null) => {
    if (DEMO_MODE) return Promise.resolve()
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const profileData = {
      name, email, role, grade,
      school: import.meta.env.VITE_SCHOOL_NAME || 'GyaanaSetu School',
      createdAt: new Date().toISOString(),
    }
    await setDoc(doc(db, 'users', cred.user.uid), profileData)
    setProfile(profileData)
    return cred
  }

  const loginWithGoogle = async () => {
    if (DEMO_MODE) return Promise.resolve({ profileData: DEMO_PROFILE })

    // Step 1: Open Google popup
    const cred = await signInWithPopup(auth, googleProvider)
    const googleEmail = cred.user.email?.toLowerCase()

    try {
      // Step 2: Check if a Firestore doc already exists for this Firebase UID
      //         (happens on subsequent Google logins after first-time link)
      const uidSnap = await getDoc(doc(db, 'users', cred.user.uid))
      if (uidSnap.exists()) {
        const profileData = uidSnap.data()
        setUser(cred.user)
        setProfile(profileData)
        return { cred, profileData }
      }

      // Step 3: No doc for this UID — search Firestore for an admin-created
      //         account with this email address
      const { getDocs, collection, query, where, deleteDoc } = await import('firebase/firestore')
      const q = query(collection(db, 'users'), where('email', '==', googleEmail))
      const results = await getDocs(q)

      if (results.empty) {
        // No admin-provisioned account → reject
        await signOut(auth)
        throw new Error('No account found for this email. Please contact your administrator.')
      }

      // Step 4: Found an admin-created account — read it and link the Google UID
      const existingDoc = results.docs[0]
      const profileData = { ...existingDoc.data(), uid: cred.user.uid, pendingLink: false }

      // Write profile under the correct Google UID
      await setDoc(doc(db, 'users', cred.user.uid), profileData)

      // Clean up the pending_ doc if this was an EMAIL_EXISTS account
      if (existingDoc.id !== cred.user.uid) {
        try { await deleteDoc(doc(db, 'users', existingDoc.id)) } catch {}
      }

      setUser(cred.user)
      setProfile(profileData)
      return { cred, profileData }
    } catch (err) {
      // Make sure Firebase session is cleaned up on any failure
      try { await signOut(auth) } catch {}
      throw err
    }
  }

  const logout = () => {
    if (DEMO_MODE) return Promise.resolve()
    return signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, loading, login, register, logout, loginWithGoogle }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
