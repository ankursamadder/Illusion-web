import {
  doc,
  getDoc,
  onSnapshot,
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

const ribbonRef = doc(db, collections.promotions, 'ribbon')
const homeNavbarBannerRef = doc(db, collections.promotions, 'homeNavbarBanner')
const bannerLibraryRef = doc(db, collections.promotions, 'bannerLibrary')

const normalizeBannerImages = (value) => {
  if (Array.isArray(value?.images)) {
    return value.images
      .filter((item) => item?.imageUrl)
      .map((item) => ({
        imageUrl: item.imageUrl,
        imagePath: item.imagePath ?? '',
      }))
  }

  if (value?.imageUrl) {
    return [
      {
        imageUrl: value.imageUrl,
        imagePath: value.imagePath ?? '',
      },
    ]
  }

  return []
}

const dedupeBannerImages = (items = []) => {
  const seen = new Set()

  return items.filter((item) => {
    const key = item.imagePath || item.imageUrl
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const normalizeHomeNavbarBannerPromotion = (value) => {
  if (!value) return null

  const images = normalizeBannerImages(value)

  return {
    ...value,
    images,
    imageUrl: images[0]?.imageUrl ?? '',
    imagePath: images[0]?.imagePath ?? '',
  }
}

const normalizeBannerLibrary = (value) => {
  if (!value) return []
  return dedupeBannerImages(normalizeBannerImages(value))
}

export const getRibbonPromotion = async () => {
  const snapshot = await getDoc(ribbonRef)
  if (!snapshot.exists()) return null
  return { id: snapshot.id, ...snapshot.data() }
}

export const subscribeRibbonPromotion = (callback) => {
  return onSnapshot(ribbonRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null)
      return
    }

    callback({ id: snapshot.id, ...snapshot.data() })
  })
}

export const saveRibbonPromotion = async (payload) => {
  await setDoc(
    ribbonRef,
    {
      text: payload.text ?? '',
      enabled: payload.enabled === true,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export const getHomeNavbarBannerPromotion = async () => {
  const snapshot = await getDoc(homeNavbarBannerRef)
  if (!snapshot.exists()) return null
  return normalizeHomeNavbarBannerPromotion({
    id: snapshot.id,
    ...snapshot.data(),
  })
}

export const subscribeHomeNavbarBannerPromotion = (callback) => {
  return onSnapshot(homeNavbarBannerRef, (snapshot) => {
    if (!snapshot.exists()) {
      callback(null)
      return
    }

    callback(
      normalizeHomeNavbarBannerPromotion({
        id: snapshot.id,
        ...snapshot.data(),
      })
    )
  })
}

export const saveHomeNavbarBannerPromotion = async (payload) => {
  const images = dedupeBannerImages(normalizeBannerImages(payload))

  await setDoc(
    homeNavbarBannerRef,
    {
      images,
      imageUrl: images[0]?.imageUrl ?? '',
      imagePath: images[0]?.imagePath ?? '',
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export const uploadHomeNavbarBanner = async (file) => {
  const extension = file.name.includes('.') ? file.name.split('.').pop() : 'jpg'
  const safeName = `home-navbar-banner-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${extension}`
  const bannerRef = ref(storage, `promotions/popup/${safeName}`)

  await uploadBytes(bannerRef, file)
  const imageUrl = await getDownloadURL(bannerRef)

  return {
    imageUrl,
    imagePath: bannerRef.fullPath,
  }
}

export const getBannerLibrary = async () => {
  const snapshot = await getDoc(bannerLibraryRef)
  if (!snapshot.exists()) return []
  return normalizeBannerLibrary(snapshot.data())
}

export const saveBannerLibrary = async (images = []) => {
  const normalizedImages = dedupeBannerImages(images)
  await setDoc(
    bannerLibraryRef,
    {
      images: normalizedImages,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export const addBannerLibraryImages = async (files = []) => {
  const uploaded = await Promise.all(files.map((file) => uploadHomeNavbarBanner(file)))
  const existing = await getBannerLibrary()
  const merged = dedupeBannerImages([...existing, ...uploaded])
  await saveBannerLibrary(merged)
  return merged
}

export const removeBannerLibraryImage = async (targetImage) => {
  const existing = await getBannerLibrary()
  const nextImages = existing.filter(
    (item) =>
      item.imagePath !== targetImage.imagePath && item.imageUrl !== targetImage.imageUrl
  )

  if (targetImage.imagePath) {
    await deletePromotionAsset(targetImage.imagePath)
  }
  await saveBannerLibrary(nextImages)
  return nextImages
}

export const deletePromotionAsset = async (path) => {
  if (!path) return

  try {
    await deleteObject(ref(storage, path))
  } catch {
    // Ignore missing files; doc cleanup still matters most.
  }
}

const promotionService = {
  getRibbonPromotion,
  subscribeRibbonPromotion,
  saveRibbonPromotion,
  getHomeNavbarBannerPromotion,
  subscribeHomeNavbarBannerPromotion,
  saveHomeNavbarBannerPromotion,
  uploadHomeNavbarBanner,
  getBannerLibrary,
  saveBannerLibrary,
  addBannerLibraryImages,
  removeBannerLibraryImage,
  deletePromotionAsset,
}

export default promotionService
