import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage'
import { db, collections, storage } from '../firebase/firebase'
import { optimizeImageFile } from '../utils/imageOptimization'

const libraryRef = doc(db, collections.productImageLibrary, 'library')

const normalizeLibraryImages = (value) => {
  if (!value) return []
  const items = Array.isArray(value?.images) ? value.images : []
  return items
    .filter((item) => item?.imageUrl)
    .map((item) => ({
      imageUrl: item.imageUrl,
      imagePath: item.imagePath ?? '',
    }))
}

const dedupeLibraryImages = (items = []) => {
  const seen = new Set()
  return items.filter((item) => {
    const key = item.imagePath || item.imageUrl
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const uploadLibraryImage = async (file) => {
  const optimizedFile = await optimizeImageFile(file, {
    maxWidth: 1280,
    maxHeight: 1280,
    quality: 0.74,
  })
  const safeName = `product-library-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.webp`
  const fileRef = ref(storage, `products/library/${safeName}`)

  await uploadBytes(fileRef, optimizedFile, {
    contentType: optimizedFile.type,
    cacheControl: 'public,max-age=31536000,immutable',
  })
  const imageUrl = await getDownloadURL(fileRef)
  return { imageUrl, imagePath: fileRef.fullPath }
}

export const getProductImageLibrary = async () => {
  const snapshot = await getDoc(libraryRef)
  if (!snapshot.exists()) return []
  return dedupeLibraryImages(normalizeLibraryImages(snapshot.data()))
}

export const saveProductImageLibrary = async (images = []) => {
  const normalized = dedupeLibraryImages(images)
  await setDoc(
    libraryRef,
    {
      images: normalized,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export const addProductLibraryImages = async (files = []) => {
  const uploaded = await Promise.all(files.map((file) => uploadLibraryImage(file)))
  const existing = await getProductImageLibrary()
  const merged = dedupeLibraryImages([...existing, ...uploaded])
  await saveProductImageLibrary(merged)
  return merged
}

export const removeProductLibraryImage = async (targetImage) => {
  const existing = await getProductImageLibrary()
  const nextImages = existing.filter(
    (item) =>
      item.imagePath !== targetImage.imagePath && item.imageUrl !== targetImage.imageUrl
  )

  if (targetImage.imagePath) {
    try {
      await deleteObject(ref(storage, targetImage.imagePath))
    } catch {
      // Ignore storage delete errors.
    }
  }

  await saveProductImageLibrary(nextImages)
  return nextImages
}

const productImageLibraryService = {
  getProductImageLibrary,
  saveProductImageLibrary,
  addProductLibraryImages,
  removeProductLibraryImage,
}

export default productImageLibraryService
