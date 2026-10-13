import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const AuthContext = createContext(null)

const getFallbackName = (email) => {
  if (!email) return 'Admin'
  return email.split('@')[0]
}

const ensureAdminDocument = async (firebaseUser) => {
  if (!firebaseUser) return null
  const adminRef = doc(db, 'admins', firebaseUser.uid)
  const snapshot = await getDoc(adminRef)

  if (snapshot.exists()) {
    return snapshot.data()
  }

  // Fallback: check if user already existed in users collection as admin
  const userRef = doc(db, 'users', firebaseUser.uid)
  const userSnapshot = await getDoc(userRef)
  if (userSnapshot.exists() && userSnapshot.data()?.role === 'admin') {
    const existingData = userSnapshot.data()
    const payload = {
      name: existingData.name ?? getFallbackName(firebaseUser.email),
      email: firebaseUser.email ?? existingData.email ?? '',
      role: 'admin',
      createdAt: existingData.createdAt ?? serverTimestamp(),
    }
    await setDoc(adminRef, payload, { merge: true })
    return payload
  }

  // New admin document in admins collection
  const payload = {
    name: firebaseUser.displayName ?? getFallbackName(firebaseUser.email),
    email: firebaseUser.email ?? '',
    role: 'admin',
    createdAt: serverTimestamp(),
  }

  await setDoc(adminRef, payload, { merge: true })
  return payload
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

      const profile = await ensureAdminDocument(firebaseUser)

      setUser({
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? profile?.email ?? '',
        name:
          profile?.name ??
          firebaseUser.displayName ??
          getFallbackName(firebaseUser.email),
        role: profile?.role ?? 'admin',
        photoURL: firebaseUser.photoURL ?? '',
      })
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signupWithEmail = async (email, password, name = '') => {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    const adminRef = doc(db, 'admins', result.user.uid)
    const payload = {
      name: name || getFallbackName(email),
      email: email,
      role: 'admin',
      createdAt: serverTimestamp(),
    }
    await setDoc(adminRef, payload, { merge: true })
    return { user: result.user, profile: payload }
  }

  const loginWithEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    const profile = await ensureAdminDocument(result.user)
    return { user: result.user, profile }
  }

  const logout = async () => {
    await signOut(auth)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
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
