import {
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import { db, collections } from '../firebase/firebase'

const ribbonRef = doc(db, collections.promotions, 'ribbon')

export const getRibbonPromotion = async () => {
  const snapshot = await getDoc(ribbonRef)
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}

export const subscribeRibbonPromotion = (callback) => {
  return onSnapshot(ribbonRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null)
      return
    }

    callback({ id: snapshot.id, ...snapshot.data() })
  })
}

export const saveRibbonPromotion = async (payload) => {
  await setDoc(
    ribbonRef,
    {
      text: payload.text ?? '',
      enabled: payload.enabled === true,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

const promotionService = {
  getRibbonPromotion,
  subscribeRibbonPromotion,
  saveRibbonPromotion,
}

export default promotionService
