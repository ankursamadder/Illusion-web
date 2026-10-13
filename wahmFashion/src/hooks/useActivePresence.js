import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebase/firebase'
import { useAuth } from '../context/AuthContext'

const getSessionId = () => {
  if (typeof window === 'undefined') return 'server'
  try {
    let id = sessionStorage.getItem('wahm_visitor_session_id')
    if (!id) {
      id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
      sessionStorage.setItem('wahm_visitor_session_id', id)
    }
    return id
  } catch {
    return `sess_${Date.now()}`
  }
}

export const useActivePresence = () => {
  const location = useLocation()
  const { user } = useAuth() || {}

  useEffect(() => {
    const sessionId = getSessionId()
    const sessionRef = doc(db, 'activeSessions', sessionId)

    const sendHeartbeat = async () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return
      try {
        await setDoc(
          sessionRef,
          {
            sessionId,
            lastActive: serverTimestamp(),
            lastActiveTime: Date.now(),
            path: location.pathname,
            userId: user?.uid ?? null,
            email: user?.email ?? null,
            name: user?.name ?? null,
            device: typeof window !== 'undefined' && window.innerWidth < 768 ? 'Mobile' : 'Desktop',
          },
          { merge: true }
        )
      } catch {
        // Silently handle any network blips
      }
    }

    sendHeartbeat()

    const interval = window.setInterval(sendHeartbeat, 40000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat()
      }
    }

    const handleBeforeUnload = () => {
      try {
        deleteDoc(sessionRef).catch(() => {})
      } catch {}
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [location.pathname, user?.uid])
}

export default useActivePresence
