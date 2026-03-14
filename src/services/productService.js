import {
  collection,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { getDownloadURL, ref } from 'firebase/storage'
import { db, collections, storage } from '../firebase/firebase'

const productsRef = collection(db, collections.products)

const resolveImageUrl = async (value) => {
  if (!value) return null
  if (typeof value === 'string') {
    if (value.startsWith('gs://')) {
      return getDownloadURL(ref(storage, value))
    }
    return value
  }

  if (typeof value === 'object') {
    if (value.url) {
      if (value.url.startsWith('gs://')) {
        return getDownloadURL(ref(storage, value.url))
      }
      return value.url
    }

    if (value.path) {
      return getDownloadURL(ref(storage, value.path))
    }
  }

  return null
}

const resolveImageEntry = async (value) => {
  if (!value) return value
  if (typeof value === 'string') {
    return resolveImageUrl(value)
  }
  if (typeof value === 'object') {
    const url = await resolveImageUrl(value)
    return { ...value, url }
  }
  return value
}

const normalizeProduct = async (product) => {
  const images = Array.isArray(product.images)
    ? await Promise.all(product.images.map(resolveImageEntry))
    : product.images
  const image = await resolveImageUrl(product.image)

  return {
    ...product,
    image: image ?? product.image,
    images,
  }
}

export const getProducts = async () => {
  const snapshot = await getDocs(query(productsRef, orderBy('createdAt', 'desc')))
  const products = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
  return Promise.all(products.map(normalizeProduct))
}

export const getProductById = async (id) => {
  const snapshot = await getDoc(doc(db, collections.products, id))
  if (!snapshot.exists()) return null
  return normalizeProduct({ id: snapshot.id, ...snapshot.data() })
}

export const addProduct = async (payload) => {
  const docRef = await addDoc(productsRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return docRef.id
}

export const updateProduct = async (id, payload) => {
  const docRef = doc(db, collections.products, id)
  await updateDoc(docRef, {
    ...payload,
    updatedAt: serverTimestamp(),
  })
}

export const deleteProduct = async (id) => {
  await deleteDoc(doc(db, collections.products, id))
}

const productService = {
  getProducts,
  getProductById,
  addProduct,
  updateProduct,
  deleteProduct,
}

export default productService
