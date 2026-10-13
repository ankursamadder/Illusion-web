import {
  addDoc,
  collection,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db, collections } from '../firebase/firebase'

const categoriesRef = collection(db, collections.categories)

export const getCategories = async () => {
  const snapshot = await getDocs(query(categoriesRef, orderBy('name', 'asc')))
  return snapshot.docs.map((docItem) => ({ id: docItem.id, ...docItem.data() }))
}

export const addCategory = async (name) => {
  const payload = {
    name,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  const docRef = await addDoc(categoriesRef, payload)
  return { id: docRef.id, ...payload }
}

const categoryService = {
  getCategories,
  addCategory,
}

export default categoryService
