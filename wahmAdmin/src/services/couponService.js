import { collection, getDocs, limit, query, where } from 'firebase/firestore'
import { db, collections } from '../firebase/firebase'

const couponsRef = collection(db, collections.coupons)

export const normalizeCouponCode = (value = '') => value.trim().toUpperCase()

export const getCouponByCode = async (code) => {
  const normalizedCode = normalizeCouponCode(code)
  if (!normalizedCode) return null

  const snapshot = await getDocs(
    query(couponsRef, where('code', '==', normalizedCode), limit(1))
  )

  if (snapshot.empty) return null

  const item = snapshot.docs[0]
  return { id: item.id, ...item.data() }
}

const couponService = {
  getCouponByCode,
  normalizeCouponCode,
}

export default couponService
