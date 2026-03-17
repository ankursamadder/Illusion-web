import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db, collections } from '../firebase/firebase'

const ordersRef = collection(db, collections.orders)
const orderCounterRef = doc(db, collections.orderCounters, 'default')
const ORDER_PREFIX = 'ILF'
const ORDER_COUNTER_START = 10000

const normalizeText = (value) => String(value ?? '').trim().toLowerCase()

const getNextOrderNumber = async () => {
  const nextValue = await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(orderCounterRef)
    const current = snapshot.exists()
      ? Number(snapshot.data()?.lastNumber ?? ORDER_COUNTER_START)
      : ORDER_COUNTER_START
    const next = current + 1

    transaction.set(
      orderCounterRef,
      {
        lastNumber: next,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )

    return next
  })

  return `${ORDER_PREFIX}${nextValue}`
}

export const isCustomerVisibleOrder = (order) => {
  const paymentMethod = normalizeText(order?.paymentMethod)
  const paymentStatus = normalizeText(order?.paymentStatus)

  if (paymentMethod === 'cod') return true
  return paymentStatus === 'success' || paymentStatus === 'paid'
}

export const isInitiatedOrder = (order) => {
  const paymentMethod = normalizeText(order?.paymentMethod)
  const paymentStatus = normalizeText(order?.paymentStatus)

  if (paymentMethod === 'cod') return false
  return (
    paymentStatus === 'initiated' ||
    paymentStatus === 'cancelled' ||
    paymentStatus === 'failed'
  )
}

export const getDisplayOrderStatus = (order) => {
  const paymentMethod = normalizeText(order?.paymentMethod)
  const status = String(order?.status ?? '').trim()

  if (paymentMethod === 'cod') {
    if (!status || normalizeText(status) === 'pending') return 'Placed COD'
    return status
  }

  return status || 'Initiated'
}

export const createOrder = async (payload) => {
  const isCod = normalizeText(payload.paymentMethod) === 'cod'
  const orderNumber = await getNextOrderNumber()
  const paymentStatus = payload.paymentStatus ?? (isCod ? 'COD' : 'Initiated')
  const firstItem = Array.isArray(payload.items) ? payload.items[0] || {} : {}
  const hasOfferPrice =
    typeof firstItem.offerPrice === 'number' &&
    typeof firstItem.price === 'number' &&
    firstItem.offerPrice < firstItem.price
  const productPrice = hasOfferPrice ? firstItem.offerPrice : firstItem.price

  const docRef = await addDoc(ordersRef, {
    ...payload,
    orderNumber,
    userEmail: payload.email ?? payload.userEmail ?? '',
    productName: payload.productName ?? firstItem.name ?? '',
    productPrice: payload.productPrice ?? productPrice ?? 0,
    productImage: payload.productImage ?? firstItem.image ?? '',
    status: isCod ? 'Placed COD' : payload.status ?? 'Initiated',
    paymentStatus,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return {
    id: docRef.id,
    orderNumber,
  }
}

export const getOrders = async () => {
  const snapshot = await getDocs(query(ordersRef, orderBy('createdAt', 'desc')))
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

export const getUserOrders = async (userId) => {
  const snapshot = await getDocs(
    query(ordersRef, where('userId', '==', userId), orderBy('createdAt', 'desc'))
  )

  const allOrders = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
  return allOrders
    .filter((order) => isCustomerVisibleOrder(order))
    .map((order) => ({
      ...order,
      status: getDisplayOrderStatus(order),
    }))
}

export const updateOrder = async (id, payload) => {
  await updateDoc(doc(db, collections.orders, id), {
    ...payload,
    updatedAt: serverTimestamp(),
  })
}

export const deleteOrder = async (id) => {
  await deleteDoc(doc(db, collections.orders, id))
}

const orderService = {
  createOrder,
  getOrders,
  getUserOrders,
  isCustomerVisibleOrder,
  isInitiatedOrder,
  getDisplayOrderStatus,
  updateOrder,
  deleteOrder,
}

export default orderService
