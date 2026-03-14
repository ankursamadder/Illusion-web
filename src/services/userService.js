import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
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

const userService = {
  getUserById,
  upsertUser,
  updateUser,
}

export default userService
