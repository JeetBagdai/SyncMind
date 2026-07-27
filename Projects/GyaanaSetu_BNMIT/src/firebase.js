// src/firebase.js
// Firebase SDK initialization — reads credentials from VITE_ env vars
// In demo mode (VITE_DEMO_MODE=true), skips Firebase to allow UI preview

import { initializeApp }  from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore }   from 'firebase/firestore'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

let app, auth, db

if (!DEMO_MODE) {
  const firebaseConfig = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  }
  app  = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db   = getFirestore(app)
} else {
  // Demo stubs — nothing calls these in demo mode
  app  = null
  auth = null
  db   = null
}

export const googleProvider = new GoogleAuthProvider()
export { auth, db }
export default app

