import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ??
    'AIzaSyAtHqH6csG5ICBekDhC5QMkPDG_Kb_xepE',
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? 'wahm-bccdd.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? 'wahm-bccdd',
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ??
    'wahm-bccdd.firebasestorage.app',
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '908601382568',
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ??
    '1:908601382568:web:9581cb438aff78dad5949d',
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? 'G-0WWBVLWQ1G',
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const googleProvider = new GoogleAuthProvider()

export { app, auth, db, googleProvider }
