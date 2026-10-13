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
import { optimizeImageFile } from '../utils/imageOptimization'

const ribbonRef = doc(db, collections.promotions, 'ribbon')
const homeNavbarBannerRef = doc(db, collections.promotions, 'homeNavbarBanner')
const bannerLibraryRef = doc(db, collections.promotions, 'bannerLibrary')
const bestSellerVideosRef = doc(db, collections.promotions, 'bestSellerVideos')

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
  const mobileImages = Array.isArray(value?.mobileImages)
    ? value.mobileImages
        .filter((item) => item?.imageUrl)
        .map((item) => ({
          imageUrl: item.imageUrl,
          imagePath: item.imagePath ?? '',
        }))
    : value?.mobileImageUrl
      ? [
          {
            imageUrl: value.mobileImageUrl,
            imagePath: value.mobileImagePath ?? '',
          },
        ]
      : []

  return {
    ...value,
    images,
    imageUrl: images[0]?.imageUrl ?? '',
    imagePath: images[0]?.imagePath ?? '',
    mobileImages,
    mobileImageUrl: mobileImages[0]?.imageUrl ?? '',
    mobileImagePath: mobileImages[0]?.imagePath ?? '',
  }
}

const normalizeBannerLibrary = (value) => {
  if (!value) return []
  return dedupeBannerImages(normalizeBannerImages(value))
}

const normalizeBestSellerVideos = (value) => {
  if (!Array.isArray(value?.videos)) return []

  return value.videos
    .filter((item) => item?.id && item?.videoUrl)
    .map((item) => ({
      id: item.id,
      videoUrl: item.videoUrl,
      videoPath: item.videoPath ?? '',
      productId: item.productId ?? '',
      productName: item.productName ?? '',
      active: item.active !== false,
      createdAt: item.createdAt ?? Date.now(),
    }))
    .sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0))
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
  const hasDesktopPayload =
    Object.prototype.hasOwnProperty.call(payload, 'images') ||
    Object.prototype.hasOwnProperty.call(payload, 'imageUrl') ||
    Object.prototype.hasOwnProperty.call(payload, 'imagePath')
  const hasMobilePayload =
    Object.prototype.hasOwnProperty.call(payload, 'mobileImages') ||
    Object.prototype.hasOwnProperty.call(payload, 'mobileImageUrl') ||
    Object.prototype.hasOwnProperty.call(payload, 'mobileImagePath')

  const desktopImages = hasDesktopPayload
    ? dedupeBannerImages(normalizeBannerImages(payload))
    : null
  const mobileImages = hasMobilePayload
    ? dedupeBannerImages(
        normalizeBannerImages({
          images: payload.mobileImages,
          imageUrl: payload.mobileImageUrl,
          imagePath: payload.mobileImagePath,
        })
      )
    : null

  const updatePayload = {
    updatedAt: serverTimestamp(),
  }

  if (desktopImages) {
    updatePayload.images = desktopImages
    updatePayload.imageUrl = desktopImages[0]?.imageUrl ?? ''
    updatePayload.imagePath = desktopImages[0]?.imagePath ?? ''
  }

  if (mobileImages) {
    updatePayload.mobileImages = mobileImages
    updatePayload.mobileImageUrl = mobileImages[0]?.imageUrl ?? ''
    updatePayload.mobileImagePath = mobileImages[0]?.imagePath ?? ''
  }

  await setDoc(
    homeNavbarBannerRef,
    updatePayload,
    { merge: true }
  )
}

export const uploadHomeNavbarBanner = async (file) => {
  const optimizedFile = await optimizeImageFile(file, {
    maxWidth: 3000,
    maxHeight: 700,
    quality: 0.78,
  })
  const safeName = `home-navbar-banner-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.webp`
  const bannerRef = ref(storage, `promotions/popup/${safeName}`)

  await uploadBytes(bannerRef, optimizedFile, {
    contentType: optimizedFile.type,
    cacheControl: 'public,max-age=31536000,immutable',
  })
  const imageUrl = await getDownloadURL(bannerRef)

  return {
    imageUrl,
    imagePath: bannerRef.fullPath,
  }
}

export const uploadMobileHomeNavbarBanner = async (file) => {
  const optimizedFile = await optimizeImageFile(file, {
    maxWidth: 1080,
    maxHeight: 1350,
    quality: 0.78,
  })
  const safeName = `home-navbar-banner-mobile-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.webp`
  const bannerRef = ref(storage, `promotions/popup/mobile/${safeName}`)

  await uploadBytes(bannerRef, optimizedFile, {
    contentType: optimizedFile.type,
    cacheControl: 'public,max-age=31536000,immutable',
  })
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

export const getBestSellerVideos = async () => {
  const snapshot = await getDoc(bestSellerVideosRef)
  if (!snapshot.exists()) return []
  return normalizeBestSellerVideos(snapshot.data())
}

export const saveBestSellerVideos = async (videos = []) => {
  await setDoc(
    bestSellerVideosRef,
    {
      videos,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export const addBestSellerVideo = async (payload) => {
  const existing = await getBestSellerVideos()
  const nextVideos = [
    {
      id: payload.id ?? `best_seller_${Date.now()}`,
      videoUrl: payload.videoUrl ?? '',
      videoPath: payload.videoPath ?? '',
      productId: payload.productId ?? '',
      productName: payload.productName ?? '',
      active: payload.active !== false,
      createdAt: payload.createdAt ?? Date.now(),
    },
    ...existing,
  ]
  await saveBestSellerVideos(nextVideos)
  return nextVideos
}

export const updateBestSellerVideo = async (id, payload) => {
  const existing = await getBestSellerVideos()
  const nextVideos = existing.map((item) =>
    item.id === id ? { ...item, ...payload } : item
  )
  await saveBestSellerVideos(nextVideos)
  return nextVideos
}

export const uploadBestSellerVideo = async (file) => {
  const extension = file?.name?.includes('.')
    ? file.name.split('.').pop().toLowerCase()
    : 'mp4'
  const safeExtension = extension || 'mp4'
  const safeName = `best-seller-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${safeExtension}`
  const videoRef = ref(storage, `promotions/best-seller/${safeName}`)

  await uploadBytes(videoRef, file, {
    contentType: file.type || 'video/mp4',
    cacheControl: 'public,max-age=31536000,immutable',
  })
  const videoUrl = await getDownloadURL(videoRef)

  return {
    videoUrl,
    videoPath: videoRef.fullPath,
  }
}

export const deleteBestSellerVideo = async (id) => {
  const existing = await getBestSellerVideos()
  const targetVideo = existing.find((item) => item.id === id)
  if (targetVideo?.videoPath) {
    await deletePromotionAsset(targetVideo.videoPath)
  }
  const nextVideos = existing.filter((item) => item.id !== id)
  await saveBestSellerVideos(nextVideos)
  return nextVideos
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
  uploadMobileHomeNavbarBanner,
  getBannerLibrary,
  saveBannerLibrary,
  addBannerLibraryImages,
  removeBannerLibraryImage,
  getBestSellerVideos,
  saveBestSellerVideos,
  addBestSellerVideo,
  updateBestSellerVideo,
  uploadBestSellerVideo,
  deleteBestSellerVideo,
  deletePromotionAsset,
}

export default promotionService
