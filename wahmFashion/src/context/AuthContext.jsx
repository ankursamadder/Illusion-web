import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  updateProfile,
  RecaptchaVerifier,
} from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase/config'

const AuthContext = createContext(null)

const getFallbackName = (firebaseUser) => {
  if (firebaseUser?.displayName) return firebaseUser.displayName
  if (firebaseUser?.email) return firebaseUser.email.split('@')[0]
  if (firebaseUser?.phoneNumber) {
    const digits = firebaseUser.phoneNumber.replace(/\D/g, '')
    return `User ${digits.slice(-4)}`
  }
  return 'Customer'
}

const normalizePhone = (phoneStr) => {
  if (!phoneStr) return ''
  const digits = String(phoneStr).replace(/\D/g, '')
  if (digits.length >= 10) {
    return `+91${digits.slice(-10)}`
  }
  return digits ? `+${digits}` : ''
}

const getPhoneVariants = (phoneStr) => {
  if (!phoneStr) return []
  const digits = String(phoneStr).replace(/\D/g, '')
  if (digits.length < 10) return [String(phoneStr).trim()]
  const last10 = digits.slice(-10)
  return [
    `+91${last10}`,
    last10,
    `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`,
    `${last10.slice(0, 5)} ${last10.slice(5)}`,
    String(phoneStr).trim(),
  ].filter((val, idx, self) => val && self.indexOf(val) === idx)
}

const findExistingUserByPhone = async (phoneStr) => {
  if (!phoneStr) return null
  const variants = getPhoneVariants(phoneStr)
  try {
    const q = query(
      collection(db, 'users'),
      where('phone', 'in', variants.slice(0, 10)),
      limit(1)
    )
    const snap = await getDocs(q)
    if (!snap.empty) {
      return { id: snap.docs[0].id, ...snap.docs[0].data() }
    }
  } catch (err) {
    console.debug('findExistingUserByPhone query info:', err)
  }
  return null
}

const ensureUserDocument = async (firebaseUser, additionalData = {}) => {
  if (!firebaseUser) return null
  const directRef = doc(db, 'users', firebaseUser.uid)
  const snapshot = await getDoc(directRef)

  // 1. Direct match by Firebase Auth UID
  if (snapshot.exists()) {
    const existing = snapshot.data()
    const updates = {}
    if (additionalData.name && !existing.name) {
      updates.name = additionalData.name
    }
    if (firebaseUser.phoneNumber && !existing.phone) {
      updates.phone = normalizePhone(firebaseUser.phoneNumber)
    }
    if (Object.keys(updates).length > 0) {
      await updateDoc(directRef, updates)
      return { id: snapshot.id, uid: snapshot.id, ...existing, ...updates }
    }
    return { id: snapshot.id, uid: snapshot.id, ...existing }
  }

  // 2. Identify existing user by mobile number — do NOT create a different document
  const targetPhone = firebaseUser.phoneNumber || additionalData.phone || ''
  if (targetPhone) {
    const existingByPhone = await findExistingUserByPhone(targetPhone)
    if (existingByPhone) {
      const existingRef = doc(db, 'users', existingByPhone.id)
      const updates = {}

      // Keep track of linked auth UIDs for fast lookup
      const linkedUids = Array.isArray(existingByPhone.linkedAuthUids)
        ? existingByPhone.linkedAuthUids
        : []
      if (!linkedUids.includes(firebaseUser.uid)) {
        updates.linkedAuthUids = [...linkedUids, firebaseUser.uid]
      }
      if (firebaseUser.email && !existingByPhone.email) {
        updates.email = firebaseUser.email
      }
      if (!existingByPhone.phone) {
        updates.phone = normalizePhone(targetPhone)
      }
      if (additionalData.name && !existingByPhone.name) {
        updates.name = additionalData.name
      }

      if (Object.keys(updates).length > 0) {
        try {
          await updateDoc(existingRef, updates)
        } catch (err) {
          console.debug('Could not update linkedAuthUids on existing user:', err)
        }
      }

      // Return the existing user document
      return {
        id: existingByPhone.id,
        uid: existingByPhone.id,
        ...existingByPhone,
        ...updates,
        authUid: firebaseUser.uid,
      }
    }
  }

  // 3. Only if no existing user document exists by UID or phone, create a new one
  const payload = {
    name:
      additionalData.name ||
      firebaseUser.displayName ||
      getFallbackName(firebaseUser),
    email: firebaseUser.email ?? additionalData.email ?? '',
    phone: normalizePhone(targetPhone) || firebaseUser.phoneNumber || '',
    role: 'user',
    linkedAuthUids: [firebaseUser.uid],
    createdAt: serverTimestamp(),
    ...additionalData,
  }

  await setDoc(directRef, payload, { merge: true })
  return { id: firebaseUser.uid, uid: firebaseUser.uid, ...payload }
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
        uid: profile?.id ?? profile?.uid ?? firebaseUser.uid,
        authUid: firebaseUser.uid,
        email: profile?.email ?? firebaseUser.email ?? '',
        phone: profile?.phone ?? firebaseUser.phoneNumber ?? '',
        name:
          profile?.name ??
          firebaseUser.displayName ??
          getFallbackName(firebaseUser),
        role: profile?.role ?? 'user',
        photoURL: firebaseUser.photoURL ?? '',
        addresses: profile?.addresses ?? [],
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

  const signupWithEmail = async (email, password, name = '') => {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    if (name?.trim()) {
      try {
        await updateProfile(result.user, { displayName: name.trim() })
      } catch {
        // non-blocking
      }
    }
    const profile = await ensureUserDocument(
      result.user,
      name?.trim() ? { name: name.trim() } : {}
    )
    return { user: result.user, profile }
  }

  const loginWithEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    const profile = await ensureUserDocument(result.user)
    return { user: result.user, profile }
  }

  const sendPhoneOtp = async (
    phoneNumber,
    containerOrId = 'recaptcha-container',
    options = {}
  ) => {
    const { size = 'invisible', bypassVerification = false } = options

    let formatted = String(phoneNumber || '').trim().replace(/\s+/g, '')
    if (!formatted.startsWith('+')) {
      const digitsOnly = formatted.replace(/\D/g, '')
      if (digitsOnly.length === 10) {
        formatted = `+91${digitsOnly}`
      } else {
        formatted = `+${digitsOnly}`
      }
    }

    // Toggle app verification bypass (for development with test phone numbers)
    auth.settings.appVerificationDisabledForTesting = Boolean(bypassVerification)

    // Helper: Clear any existing verifier safely
    const safelyClearVerifier = () => {
      if (window.__recaptchaVerifier) {
        try {
          window.__recaptchaVerifier.clear()
        } catch (err) {
          console.debug('Error clearing existing verifier:', err)
        }
        window.__recaptchaVerifier = null
      }
    }

    safelyClearVerifier()

    // 1. Locate or create parent host element
    let parent =
      typeof containerOrId === 'string'
        ? document.getElementById(containerOrId)
        : containerOrId

    if (!parent) {
      let fallback = document.getElementById('wahm-recaptcha-host')
      if (!fallback) {
        fallback = document.createElement('div')
        fallback.id = 'wahm-recaptcha-host'
        fallback.style.position = 'fixed'
        fallback.style.bottom = '0'
        fallback.style.left = '0'
        fallback.style.zIndex = '9999'
        document.body.appendChild(fallback)
      }
      parent = fallback
    }

    // 2. Clear parent container content completely
    try {
      parent.innerHTML = ''
    } catch {}

    // 3. Create a brand-new child element that Google reCAPTCHA has never encountered
    const freshElement = document.createElement('div')
    freshElement.id = `recaptcha-slot-${Date.now()}-${Math.floor(Math.random() * 10000)}`
    parent.appendChild(freshElement)

    // 4. Instantiation helper
    const buildVerifier = (targetEl) => {
      return new RecaptchaVerifier(auth, targetEl, {
        size,
        callback: () => {
          if (typeof options.onSuccess === 'function') {
            options.onSuccess()
          }
        },
        'expired-callback': () => {
          if (typeof options.onExpired === 'function') {
            options.onExpired()
          }
        },
      })
    }

    let verifier = null
    try {
      verifier = buildVerifier(freshElement)
      window.__recaptchaVerifier = verifier
    } catch (createErr) {
      console.warn('Initial verifier instantiation collision, retrying with fresh slot:', createErr)
      safelyClearVerifier()
      parent.innerHTML = ''
      const retryElement = document.createElement('div')
      retryElement.id = `recaptcha-slot-retry-${Date.now()}`
      parent.appendChild(retryElement)
      verifier = buildVerifier(retryElement)
      window.__recaptchaVerifier = verifier
    }

    try {
      const confirmationResult = await signInWithPhoneNumber(
        auth,
        formatted,
        verifier
      )
      return confirmationResult
    } catch (err) {
      // Auto-recover if reCAPTCHA collision occurred during execution
      if (
        err?.message?.includes('already been rendered') ||
        err?.message?.includes('reCAPTCHA placeholder')
      ) {
        console.warn('reCAPTCHA collision during sign-in, auto-recovering silently...')
        safelyClearVerifier()
        parent.innerHTML = ''
        const recoveryEl = document.createElement('div')
        recoveryEl.id = `recaptcha-recovery-${Date.now()}-${Math.floor(Math.random() * 10000)}`
        parent.appendChild(recoveryEl)

        try {
          const recoveryVerifier = buildVerifier(recoveryEl)
          window.__recaptchaVerifier = recoveryVerifier
          return await signInWithPhoneNumber(auth, formatted, recoveryVerifier)
        } catch (recoveryErr) {
          console.warn('Silent reCAPTCHA recovery failed:', recoveryErr)
          err = recoveryErr
        }
      }

      // Cleanup on failure
      safelyClearVerifier()
      try {
        parent.innerHTML = ''
      } catch {}

      console.warn('Firebase Phone Auth error:', err?.code, err?.message)

      if (
        err?.code === 'auth/operation-not-allowed' ||
        err?.message?.includes('region enabled')
      ) {
        const helpfulError = new Error(
          'Mobile sign-in is temporarily unavailable. Please sign in with Google or Email.'
        )
        helpfulError.code = err.code
        throw helpfulError
      }

      if (err?.code === 'auth/too-many-requests') {
        const helpfulError = new Error(
          'Too many attempts. Please try again later or continue with Google or Email below.'
        )
        helpfulError.code = err.code
        throw helpfulError
      }

      if (err?.code === 'auth/invalid-app-credential') {
        const helpfulError = new Error(
          'Verification could not be completed. Please try again or use Google sign-in.'
        )
        helpfulError.code = err.code
        throw helpfulError
      }

      throw err
    }
  }

  const verifyPhoneOtp = async (confirmationResult, otpCode, name = '') => {
    if (!confirmationResult || typeof confirmationResult.confirm !== 'function') {
      throw new Error('OTP session expired. Please request a new OTP.')
    }
    const result = await confirmationResult.confirm(otpCode)
    if (name?.trim()) {
      try {
        await updateProfile(result.user, { displayName: name.trim() })
      } catch {
        // non-blocking
      }
    }
    const profile = await ensureUserDocument(
      result.user,
      name?.trim()
        ? { name: name.trim(), phone: result.user.phoneNumber }
        : { phone: result.user.phoneNumber }
    )
    return { user: result.user, profile }
  }

  const logout = async () => {
    if (window.__recaptchaVerifier) {
      try {
        window.__recaptchaVerifier.clear()
      } catch {}
      window.__recaptchaVerifier = null
    }
    await signOut(auth)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      loginWithGoogle,
      signupWithEmail,
      loginWithEmail,
      sendPhoneOtp,
      verifyPhoneOtp,
      logout,
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)

export default AuthContext
