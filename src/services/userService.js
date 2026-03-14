import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db, collections } from '../firebase/firebase'

export const getUserById = async (id) => {
  const snapshot = await getDoc(doc(db, collections.users, id))
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}

export const upsertUser = async (id, payload) => {
  await setDoc(
    doc(db, collections.users, id),
    {
      ...payload,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export const updateUser = async (id, payload) => {
  await updateDoc(doc(db, collections.users, id), {
    ...payload,
    updatedAt: serverTimestamp(),
  })
}

export const getUsers = async () => {
  const snapshot = await getDocs(collection(db, collections.users))
  const users = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))

  return users.sort((a, b) => {
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

export const deleteUser = async (id) => {
  await deleteDoc(doc(db, collections.users, id))
}

const userService = {
  getUserById,
  upsertUser,
  updateUser,
  getUsers,
  deleteUser,
}

export default userService
