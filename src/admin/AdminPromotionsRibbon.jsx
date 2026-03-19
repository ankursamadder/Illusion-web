import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { Check } from 'lucide-react'
import AdminLayout from './AdminLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Modal from '../components/ui/Modal'
import {
  addBannerLibraryImages,
  addBestSellerVideo,
  deleteBestSellerVideo,
  getBannerLibrary,
  getBestSellerVideos,
  getHomeNavbarBannerPromotion,
  getRibbonPromotion,
  removeBannerLibraryImage,
  saveBannerLibrary,
  saveHomeNavbarBannerPromotion,
  saveRibbonPromotion,
  uploadBestSellerVideo,
  uploadMobileHomeNavbarBanner,
  updateBestSellerVideo,
} from '../services/promotionService'
import { getProducts } from '../services/productService'

const REQUIRED_BANNER_WIDTH = 3000
const REQUIRED_BANNER_HEIGHT = 700

const getImageKey = (item) => item?.imagePath || item?.imageUrl || ''

const getBannerImages = (value) => {
  if (!Array.isArray(value?.images)) return []
  return value.images.filter((item) => item?.imageUrl)
}

const getMobileBannerImages = (value) => {
  if (Array.isArray(value?.mobileImages)) {
    return value.mobileImages.filter((item) => item?.imageUrl)
  }

  if (value?.mobileImageUrl) {
    return [
      {
        imageUrl: value.mobileImageUrl,
        imagePath: value.mobileImagePath ?? '',
      },
    ]
  }

  return []
}

const dedupeImages = (items = []) => {
  const seen = new Set()
  return items.filter((item) => {
    const key = getImageKey(item)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const validateBannerDimensions = (file) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    const objectUrl = URL.createObjectURL(file)

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      if (
        image.width !== REQUIRED_BANNER_WIDTH ||
        image.height !== REQUIRED_BANNER_HEIGHT
      ) {
        reject(
          new Error(
            `Banner must be exactly ${REQUIRED_BANNER_WIDTH} x ${REQUIRED_BANNER_HEIGHT}px`
          )
        )
        return
      }
      resolve()
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Invalid image file'))
    }

    image.src = objectUrl
  })

const AdminPromotions = () => {
  const [loading, setLoading] = useState(true)
  const [savingRibbon, setSavingRibbon] = useState(false)
  const [savingBanners, setSavingBanners] = useState(false)
  const [savingMobileBanners, setSavingMobileBanners] = useState(false)
  const [uploadingLibrary, setUploadingLibrary] = useState(false)
  const [uploadingMobileBanners, setUploadingMobileBanners] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [text, setText] = useState('')
  const [bannerData, setBannerData] = useState(null)
  const [libraryImages, setLibraryImages] = useState([])
  const [selectedKeys, setSelectedKeys] = useState([])
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [products, setProducts] = useState([])
  const [bestSellerVideos, setBestSellerVideos] = useState([])
  const [bestSellerVideoUrl, setBestSellerVideoUrl] = useState('')
  const [bestSellerVideoPath, setBestSellerVideoPath] = useState('')
  const [bestSellerProductId, setBestSellerProductId] = useState('')
  const [videoProductDrafts, setVideoProductDrafts] = useState({})
  const [savingBestSeller, setSavingBestSeller] = useState(false)
  const [uploadingBestSellerVideo, setUploadingBestSellerVideo] = useState(false)
  const libraryUploadRef = useRef(null)
  const mobileBannerUploadRef = useRef(null)
  const bestSellerVideoUploadRef = useRef(null)

  const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys])
  const activeImages = useMemo(() => getBannerImages(bannerData), [bannerData])
  const activeMobileImages = useMemo(
    () => getMobileBannerImages(bannerData),
    [bannerData]
  )

  useEffect(() => {
    let mounted = true

    const loadPromotion = async () => {
      setLoading(true)
      try {
        const [ribbon, banner, library, bestSellers, productItems] = await Promise.all([
          getRibbonPromotion(),
          getHomeNavbarBannerPromotion(),
          getBannerLibrary(),
          getBestSellerVideos(),
          getProducts(),
        ])
        if (!mounted) return

        const active = getBannerImages(banner)
        const mergedLibrary = dedupeImages([...library, ...active])
        const activeKeys = active.map(getImageKey).filter(Boolean)

        setEnabled(ribbon?.enabled ?? true)
        setText(ribbon?.text ?? '')
        setBannerData(banner ?? null)
        setLibraryImages(mergedLibrary)
        setSelectedKeys(activeKeys)
        setBestSellerVideos(bestSellers.slice(0, 3))
        setProducts(productItems.filter((item) => item.active !== false))

        if (mergedLibrary.length !== library.length) {
          saveBannerLibrary(mergedLibrary).catch(() => {})
        }
      } catch (error) {
        if (mounted) {
          toast.error(error?.message ?? 'Failed to load promotions')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadPromotion()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!bestSellerVideos.length) {
      setVideoProductDrafts({})
      return
    }

    setVideoProductDrafts((previous) => {
      const next = {}
      bestSellerVideos.forEach((video) => {
        next[video.id] = previous[video.id] ?? video.productId ?? ''
      })
      return next
    })
  }, [bestSellerVideos])

  const handleSaveRibbon = async (event) => {
    event.preventDefault()

    if (enabled && !text.trim()) {
      toast.error('Add ribbon text before enabling the promotion')
      return
    }

    setSavingRibbon(true)
    try {
      await saveRibbonPromotion({
        enabled,
        text: text.trim(),
      })
      toast.success('Ribbon promotion saved')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to save ribbon promotion')
    } finally {
      setSavingRibbon(false)
    }
  }

  const handleUploadLibraryImages = async (event) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    try {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          throw new Error('Please select only image files')
        }
        await validateBannerDimensions(file)
      }

      setUploadingLibrary(true)
      const nextLibrary = await addBannerLibraryImages(files)
      setLibraryImages(nextLibrary)
      toast.success('Images uploaded to banner folder')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to upload images')
    } finally {
      setUploadingLibrary(false)
      event.target.value = ''
    }
  }

  const toggleImageSelection = (item) => {
    const key = getImageKey(item)
    if (!key) return

    setSelectedKeys((previous) => {
      if (previous.includes(key)) {
        return previous.filter((entry) => entry !== key)
      }
      return [...previous, key]
    })
  }

  const handleApplySelected = async () => {
    const selectedImages = libraryImages.filter((item) =>
      selectedKeySet.has(getImageKey(item))
    )

    setSavingBanners(true)
    try {
      await saveHomeNavbarBannerPromotion({ images: selectedImages })
      setBannerData((previous) => ({
        ...(previous ?? {}),
        images: selectedImages,
        imageUrl: selectedImages[0]?.imageUrl ?? '',
        imagePath: selectedImages[0]?.imagePath ?? '',
      }))
      toast.success('Banner images updated')
      setLibraryOpen(false)
    } catch (error) {
      toast.error(error?.message ?? 'Failed to update banners')
    } finally {
      setSavingBanners(false)
    }
  }

  const handleClearBanners = async () => {
    setSavingBanners(true)
    try {
      await saveHomeNavbarBannerPromotion({ images: [] })
      setBannerData((previous) => ({
        ...(previous ?? {}),
        images: [],
        imageUrl: '',
        imagePath: '',
      }))
      setSelectedKeys([])
      toast.success('Banner images cleared')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to clear banners')
    } finally {
      setSavingBanners(false)
    }
  }

  const handleRemoveLibraryImage = async (item) => {
    const key = getImageKey(item)
    if (!key) return

    setUploadingLibrary(true)
    try {
      const nextLibrary = await removeBannerLibraryImage(item)
      setLibraryImages(nextLibrary)
      setSelectedKeys((previous) => previous.filter((entry) => entry !== key))

      const nextActiveImages = activeImages.filter(
        (activeItem) => getImageKey(activeItem) !== key
      )

      if (nextActiveImages.length !== activeImages.length) {
        await saveHomeNavbarBannerPromotion({ images: nextActiveImages })
        setBannerData((previous) => ({
          ...(previous ?? {}),
          images: nextActiveImages,
          imageUrl: nextActiveImages[0]?.imageUrl ?? '',
          imagePath: nextActiveImages[0]?.imagePath ?? '',
        }))
      }

      toast.success('Image removed from banner folder')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to remove image')
    } finally {
      setUploadingLibrary(false)
    }
  }

  const handleUploadMobileBanners = async (event) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select only image files')
        event.target.value = ''
        return
      }
    }

    setUploadingMobileBanners(true)
    try {
      const uploaded = await Promise.all(
        files.map((file) => uploadMobileHomeNavbarBanner(file))
      )
      const nextMobileImages = dedupeImages([...activeMobileImages, ...uploaded])
      await saveHomeNavbarBannerPromotion({ mobileImages: nextMobileImages })
      setBannerData((previous) => ({
        ...(previous ?? {}),
        mobileImages: nextMobileImages,
        mobileImageUrl: nextMobileImages[0]?.imageUrl ?? '',
        mobileImagePath: nextMobileImages[0]?.imagePath ?? '',
      }))
      toast.success('Mobile banner variant updated')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to upload mobile banners')
    } finally {
      setUploadingMobileBanners(false)
      event.target.value = ''
    }
  }

  const handleClearMobileBanners = async () => {
    setSavingMobileBanners(true)
    try {
      await saveHomeNavbarBannerPromotion({ mobileImages: [] })
      setBannerData((previous) => ({
        ...(previous ?? {}),
        mobileImages: [],
        mobileImageUrl: '',
        mobileImagePath: '',
      }))
      toast.success('Mobile banner variant cleared')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to clear mobile banners')
    } finally {
      setSavingMobileBanners(false)
    }
  }

  const handleUploadBestSellerVideo = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('video/')) {
      toast.error('Please select a valid video file')
      event.target.value = ''
      return
    }

    setUploadingBestSellerVideo(true)
    try {
      const uploaded = await uploadBestSellerVideo(file)
      setBestSellerVideoUrl(uploaded.videoUrl)
      setBestSellerVideoPath(uploaded.videoPath)
      toast.success('Video uploaded to Firebase Storage')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to upload video')
    } finally {
      setUploadingBestSellerVideo(false)
      event.target.value = ''
    }
  }

  const handleAddBestSellerVideo = async (event) => {
    event.preventDefault()

    if (!bestSellerVideoUrl.trim()) {
      toast.error('Add a video URL')
      return
    }

    if (!bestSellerProductId) {
      toast.error('Select a product for Buy Now action')
      return
    }

    if (bestSellerVideos.length >= 3) {
      toast.error('You can add only 3 best seller videos')
      return
    }

    const selectedProduct = products.find((item) => item.id === bestSellerProductId)
    if (!selectedProduct) {
      toast.error('Selected product not found')
      return
    }

    setSavingBestSeller(true)
    try {
      const nextVideos = await addBestSellerVideo({
        id: `best_seller_${Date.now()}`,
        videoUrl: bestSellerVideoUrl.trim(),
        videoPath: bestSellerVideoPath,
        productId: selectedProduct.id,
        productName: selectedProduct.name ?? '',
        active: true,
        createdAt: Date.now(),
      })
      setBestSellerVideos(nextVideos.slice(0, 3))
      setBestSellerVideoUrl('')
      setBestSellerVideoPath('')
      setBestSellerProductId('')
      toast.success('Best seller video added')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to add best seller video')
    } finally {
      setSavingBestSeller(false)
    }
  }

  const handleToggleBestSellerVideo = async (videoItem) => {
    setSavingBestSeller(true)
    try {
      const nextVideos = await updateBestSellerVideo(videoItem.id, {
        active: videoItem.active !== false ? false : true,
      })
      setBestSellerVideos(nextVideos.slice(0, 3))
      toast.success('Best seller video updated')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to update video')
    } finally {
      setSavingBestSeller(false)
    }
  }

  const handleDeleteBestSellerVideo = async (videoItem) => {
    const confirmed = window.confirm('Delete this best seller video?')
    if (!confirmed) return

    setSavingBestSeller(true)
    try {
      const nextVideos = await deleteBestSellerVideo(videoItem.id)
      setBestSellerVideos(nextVideos.slice(0, 3))
      toast.success('Best seller video deleted')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to delete video')
    } finally {
      setSavingBestSeller(false)
    }
  }

  const handleSaveBestSellerVideoLink = async (videoItem) => {
    const nextProductId = videoProductDrafts[videoItem.id] ?? ''
    if (!nextProductId) {
      toast.error('Select a product to update Buy Now link')
      return
    }

    const selectedProduct = products.find((item) => item.id === nextProductId)
    if (!selectedProduct) {
      toast.error('Selected product not found')
      return
    }

    setSavingBestSeller(true)
    try {
      const nextVideos = await updateBestSellerVideo(videoItem.id, {
        productId: selectedProduct.id,
        productName: selectedProduct.name ?? '',
      })
      setBestSellerVideos(nextVideos.slice(0, 3))
      toast.success('Buy Now link updated')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to update Buy Now link')
    } finally {
      setSavingBestSeller(false)
    }
  }

  return (
    <AdminLayout
      title="Promotions"
      subtitle="Manage storefront ribbon text and home navbar banner."
    >
      <div className="grid gap-4 xl:grid-cols-2">
        <form className="space-y-4" onSubmit={handleSaveRibbon}>
          <Card className="space-y-4">
            <h2 className="text-lg font-semibold text-illusion-black">Offer Ribbon</h2>
            <Input
              label="Ribbon text"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="e.g. Flat 10% off on featured rings this weekend"
              disabled={loading}
            />

            <label className="flex items-center gap-3 text-sm text-illusion-black">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(event) => setEnabled(event.target.checked)}
                className="h-4 w-4 rounded border-illusion-black/20"
                disabled={loading}
              />
              Enable ribbon on storefront
            </label>

            <Button type="submit" disabled={loading || savingRibbon}>
              {savingRibbon ? 'Saving...' : 'Save Ribbon'}
            </Button>
          </Card>
        </form>

        <Card className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-illusion-black">Home Navbar Banner</h2>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setLibraryOpen(true)}
              disabled={loading}
            >
              Banner Images
            </Button>
          </div>

          {activeImages.length ? (
            <div className="grid gap-2 md:grid-cols-2">
              {activeImages.map((item, index) => (
                <img loading="lazy" decoding="async"
                  key={getImageKey(item) || `${item.imageUrl}_${index}`}
                  src={item.imageUrl}
                  alt={`Home navbar banner ${index + 1}`}
                  className="w-full rounded-2xl border border-illusion-black/10 object-cover"
                />
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClearBanners}
              disabled={loading || savingBanners || !activeImages.length}
            >
              Clear Banners
            </Button>
          </div>

          <div className="space-y-3 rounded-2xl border border-illusion-black/10 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-illusion-black">
                  Mobile Banner Variant
                </h3>
                <p className="text-xs text-illusion-black/60">
                  Upload separate mobile images. Recommended size: 1080 x 1350.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => mobileBannerUploadRef.current?.click()}
                  disabled={loading || uploadingMobileBanners}
                >
                  {uploadingMobileBanners ? 'Uploading...' : 'Upload Mobile'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleClearMobileBanners}
                  disabled={loading || savingMobileBanners || !activeMobileImages.length}
                >
                  {savingMobileBanners ? 'Clearing...' : 'Clear Mobile'}
                </Button>
                <input
                  ref={mobileBannerUploadRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleUploadMobileBanners}
                  className="hidden"
                />
              </div>
            </div>

            {activeMobileImages.length ? (
              <div className="grid gap-2 grid-cols-2">
                {activeMobileImages.map((item, index) => (
                  <img
                    loading="lazy"
                    decoding="async"
                    key={getImageKey(item) || `${item.imageUrl}_${index}`}
                    src={item.imageUrl}
                    alt={`Mobile home navbar banner ${index + 1}`}
                    className="w-full rounded-2xl border border-illusion-black/10 object-cover"
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-illusion-black/60">
                No mobile-specific banner selected yet. Desktop banner will be used.
              </p>
            )}
          </div>
        </Card>
      </div>

      <Card className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-illusion-black">
            Best Seller Videos
          </h2>
          <p className="text-sm text-illusion-black/60">
            Add up to 3 vertical videos (9:16) for the home Best Seller section.
          </p>
        </div>

        <form
          className="grid gap-3 md:grid-cols-[1.3fr_1fr_auto]"
          onSubmit={handleAddBestSellerVideo}
        >
          <Input
            label="Video URL"
            value={bestSellerVideoUrl}
            onChange={(event) => {
              setBestSellerVideoUrl(event.target.value)
              setBestSellerVideoPath('')
            }}
            placeholder="https://...mp4"
          />

          <label className="flex w-full flex-col gap-2 text-sm">
            <span className="font-medium text-illusion-black">Linked product</span>
            <select
              className="w-full rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black shadow-soft outline-none"
              value={bestSellerProductId}
              onChange={(event) => setBestSellerProductId(event.target.value)}
            >
              <option value="">Choose product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end">
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => bestSellerVideoUploadRef.current?.click()}
                disabled={uploadingBestSellerVideo || loading}
              >
                {uploadingBestSellerVideo ? 'Uploading...' : 'Upload Video'}
              </Button>
              <Button
                type="submit"
                disabled={savingBestSeller || loading || uploadingBestSellerVideo}
              >
                Add Video
              </Button>
              <input
                ref={bestSellerVideoUploadRef}
                type="file"
                accept="video/*"
                onChange={handleUploadBestSellerVideo}
                className="hidden"
              />
            </div>
          </div>
        </form>
        {bestSellerVideoPath ? (
          <p className="text-xs text-green-700">
            Uploaded file ready. Click `Add Video` to save it in best seller list.
          </p>
        ) : null}

        {bestSellerVideos.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {bestSellerVideos.map((video) => (
              <div
                key={video.id}
                className="space-y-3 rounded-2xl border border-illusion-black/10 p-3"
              >
                <video
                  src={video.videoUrl}
                  controls
                  muted
                  playsInline
                  className="aspect-[9/16] w-full rounded-2xl bg-black object-cover"
                />
                <p className="text-xs font-medium text-illusion-black/70">
                  {video.productName || 'Product not linked'}
                </p>
                <label className="flex w-full flex-col gap-1 text-xs">
                  <span className="font-medium text-illusion-black/70">Buy Now link</span>
                  <select
                    className="w-full rounded-xl border border-illusion-black/10 bg-white px-2 py-1.5 text-xs text-illusion-black shadow-soft outline-none"
                    value={videoProductDrafts[video.id] ?? ''}
                    onChange={(event) =>
                      setVideoProductDrafts((prev) => ({
                        ...prev,
                        [video.id]: event.target.value,
                      }))
                    }
                  >
                    <option value="">Choose product</option>
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSaveBestSellerVideoLink(video)}
                    disabled={savingBestSeller}
                  >
                    Save Link
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => handleToggleBestSellerVideo(video)}
                    disabled={savingBestSeller}
                  >
                    {video.active === false ? 'Activate' : 'Deactivate'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="border border-red-200 text-red-500 hover:text-red-600"
                    onClick={() => handleDeleteBestSellerVideo(video)}
                    disabled={savingBestSeller}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-illusion-black/60">No best seller videos yet.</p>
        )}
      </Card>

      <Modal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        title="Banner Folder"
        className="max-w-5xl"
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setLibraryOpen(false)}
              disabled={savingBanners}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleApplySelected}
              disabled={savingBanners}
            >
              {savingBanners ? 'Saving...' : 'Apply Selected'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => libraryUploadRef.current?.click()}
              disabled={uploadingLibrary}
            >
              {uploadingLibrary ? 'Uploading...' : 'Upload Images'}
            </Button>
            <input
              ref={libraryUploadRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUploadLibraryImages}
              className="hidden"
            />
          </div>

          {libraryImages.length ? (
            <div className="grid max-h-[55vh] gap-3 overflow-auto sm:grid-cols-2 lg:grid-cols-3">
              {libraryImages.map((item, index) => {
                const key = getImageKey(item)
                const selected = selectedKeySet.has(key)

                return (
                  <div
                    key={key || `${item.imageUrl}_${index}`}
                    className="space-y-1 rounded-2xl border border-illusion-black/10 p-2"
                  >
                    <button
                      type="button"
                      onClick={() => toggleImageSelection(item)}
                      className={`relative block w-full overflow-hidden rounded-xl border ${
                        selected
                          ? 'border-illusion-black'
                          : 'border-illusion-black/10'
                      }`}
                    >
                      <img loading="lazy" decoding="async"
                        src={item.imageUrl}
                        alt={`Banner library ${index + 1}`}
                        className="h-28 w-full object-cover"
                      />
                      {selected ? (
                        <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-illusion-black text-white">
                          <Check className="h-4 w-4" />
                        </span>
                      ) : null}
                    </button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="w-full"
                      onClick={() => handleRemoveLibraryImage(item)}
                      disabled={uploadingLibrary}
                    >
                      Remove
                    </Button>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      </Modal>
    </AdminLayout>
  )
}

export default AdminPromotions
