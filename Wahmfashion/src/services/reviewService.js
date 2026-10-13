import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db, collections } from '../firebase/firebase'

const reviewsRef = collection(db, collections.reviews)

const sortByCreatedAtDesc = (items) => {
  return [...items].sort((a, b) => {
    const aTime =
      typeof a.createdAt?.toDate === 'function'
        ? a.createdAt.toDate().getTime()
        : new Date(a.createdAt ?? 0).getTime()
    const bTime =
      typeof b.createdAt?.toDate === 'function'
        ? b.createdAt.toDate().getTime()
        : new Date(b.createdAt ?? 0).getTime()

    return bTime - aTime
  })
}

const getAllReviews = async () => {
  const snapshot = await getDocs(reviewsRef)
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

export const getReviews = async () => {
  const items = await getAllReviews()
  return sortByCreatedAtDesc(items)
}

export const getApprovedReviews = async (max = 12) => {
  const items = await getAllReviews()
  return sortByCreatedAtDesc(items)
    .filter((item) => item.approved === true)
    .slice(0, max)
}

export const getUserReviews = async (userId) => {
  const items = await getAllReviews()
  return sortByCreatedAtDesc(items).filter((item) => item.userId === userId)
}

export const addReview = async (payload) => {
  const docRef = await addDoc(reviewsRef, {
    ...payload,
    approved: payload.approved === true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export const updateReview = async (id, payload) => {
  await updateDoc(doc(db, collections.reviews, id), {
    ...payload,
    updatedAt: serverTimestamp(),
  })
}

export const deleteReview = async (id) => {
  await deleteDoc(doc(db, collections.reviews, id))
}

const reviewService = {
  getReviews,
  getApprovedReviews,
  getUserReviews,
  addReview,
  updateReview,
  deleteReview,
}

export default reviewService
