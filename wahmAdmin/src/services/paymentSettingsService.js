import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, collections } from '../firebase/firebase'

const paymentSettingsRef = doc(db, collections.storeSettings, 'paymentMethods')

export const defaultPaymentSettings = {
  codEnabled: true,
  onlinePaymentEnabled: true,
}

export const getPaymentSettings = async () => {
  const snapshot = await getDoc(paymentSettingsRef)
  if (!snapshot.exists()) return defaultPaymentSettings

  const data = snapshot.data()
  return {
    codEnabled: data.codEnabled !== false,
    onlinePaymentEnabled: data.onlinePaymentEnabled !== false,
  }
}

export const savePaymentSettings = async (payload) => {
  await setDoc(
    paymentSettingsRef,
    {
      codEnabled: payload.codEnabled !== false,
      onlinePaymentEnabled: payload.onlinePaymentEnabled !== false,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

const paymentSettingsService = {
  defaultPaymentSettings,
  getPaymentSettings,
  savePaymentSettings,
}

export default paymentSettingsService
