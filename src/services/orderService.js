import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
} from 'firebase/firestore'
import { db, collections } from '../firebase/firebase'

const ordersRef = collection(db, collections.orders)

export const createOrder = async (payload) => {
  const docRef = await addDoc(ordersRef, {
    ...payload,
    status: payload.status ?? 'Pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export const getOrders = async () => {
  const snapshot = await getDocs(query(ordersRef, orderBy('createdAt', 'desc')))
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

export const getUserOrders = async (userId) => {
  const snapshot = await getDocs(
    query(
      ordersRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
  )
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

export const updateOrder = async (id, payload) => {
  await updateDoc(doc(db, collections.orders, id), {
    ...payload,
    updatedAt: serverTimestamp(),
  })
}

const orderService = {
  createOrder,
  getOrders,
  getUserOrders,
  updateOrder,
}

export default orderService
