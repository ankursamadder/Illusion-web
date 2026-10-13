import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, collections } from '../firebase/firebase'

export const getFooterPageContent = async (slug) => {
  if (!slug) return null
  const snapshot = await getDoc(doc(db, collections.footerPages, slug))
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}

export const saveFooterPageContent = async (slug, payload) => {
  if (!slug) return

  await setDoc(
    doc(db, collections.footerPages, slug),
    {
      title: payload.title ?? '',
      subtitle: payload.subtitle ?? '',
      content: payload.content ?? '',
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

const footerPageService = {
  getFooterPageContent,
  saveFooterPageContent,
}

export default footerPageService
