import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
} from 'firebase/firestore'
import { db } from '../firebase/firebase'

const sessionsRef = collection(db, 'activeSessions')
const ACTIVE_THRESHOLD_MS = 2.5 * 60 * 1000 // 2.5 minutes
const STALE_THRESHOLD_MS = 15 * 60 * 1000 // 15 minutes

export const subscribeActiveSessions = (callback) => {
  return onSnapshot(
    sessionsRef,
    (snapshot) => {
      const now = Date.now()
      const all = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }))

      const activeList = all.filter((item) => {
        const time =
          typeof item.lastActive?.toMillis === 'function'
            ? item.lastActive.toMillis()
            : Number(item.lastActiveTime || 0)
        return now - time < ACTIVE_THRESHOLD_MS
      })

      // Background clean-up of stale sessions
      all.forEach((item) => {
        const time =
          typeof item.lastActive?.toMillis === 'function'
            ? item.lastActive.toMillis()
            : Number(item.lastActiveTime || 0)
        if (time && now - time > STALE_THRESHOLD_MS) {
          deleteDoc(doc(db, 'activeSessions', item.id)).catch(() => {})
        }
      })

      callback(activeList)
    },
    (error) => {
      console.warn('Active sessions subscription error:', error)
      callback([])
    }
  )
}
