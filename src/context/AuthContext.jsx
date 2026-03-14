import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase/config'

const AuthContext = createContext(null)

const getFallbackName = (email) => {
  if (!email) return 'Guest'
  return email.split('@')[0]
}

const ensureUserDocument = async (firebaseUser) => {
  if (!firebaseUser) return null
  const userRef = doc(db, 'users', firebaseUser.uid)
  const snapshot = await getDoc(userRef)

  if (!snapshot.exists()) {
    const payload = {
      name: firebaseUser.displayName ?? getFallbackName(firebaseUser.email),
      email: firebaseUser.email ?? '',
      role: 'user',
      createdAt: serverTimestamp(),
    }

    await setDoc(userRef, payload, { merge: true })
    return payload
  }

  return snapshot.data()
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null)
        setLoading(false)
        return
      }

      const profile = await ensureUserDocument(firebaseUser)

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? profile?.email ?? '',
        name:
          profile?.name ??
          firebaseUser.displayName ??
          getFallbackName(firebaseUser.email),
        role: profile?.role ?? 'user',
        photoURL: firebaseUser.photoURL ?? '',
      })
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider)
    const profile = await ensureUserDocument(result.user)
    return { user: result.user, profile }
  }

  const signupWithEmail = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    const profile = await ensureUserDocument(result.user)
    return { user: result.user, profile }
  }

  const loginWithEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    const profile = await ensureUserDocument(result.user)
    return { user: result.user, profile }
  }

  const logout = async () => {
    await signOut(auth)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      loginWithGoogle,
      signupWithEmail,
      loginWithEmail,
      logout,
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

export default AuthContext
