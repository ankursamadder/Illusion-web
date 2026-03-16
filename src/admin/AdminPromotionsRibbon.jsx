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
  getBannerLibrary,
  getHomeNavbarBannerPromotion,
  getRibbonPromotion,
  removeBannerLibraryImage,
  saveBannerLibrary,
  saveHomeNavbarBannerPromotion,
  saveRibbonPromotion,
} from '../services/promotionService'

const REQUIRED_BANNER_WIDTH = 3000
const REQUIRED_BANNER_HEIGHT = 700

const getImageKey = (item) => item?.imagePath || item?.imageUrl || ''

const getBannerImages = (value) => {
  if (!Array.isArray(value?.images)) return []
  return value.images.filter((item) => item?.imageUrl)
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
  const [uploadingLibrary, setUploadingLibrary] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [text, setText] = useState('')
  const [bannerData, setBannerData] = useState(null)
  const [libraryImages, setLibraryImages] = useState([])
  const [selectedKeys, setSelectedKeys] = useState([])
  const [libraryOpen, setLibraryOpen] = useState(false)
  const libraryUploadRef = useRef(null)

  const selectedKeySet = useMemo(() => new Set(selectedKeys), [selectedKeys])
  const activeImages = useMemo(() => getBannerImages(bannerData), [bannerData])

  useEffect(() => {
    let mounted = true

    const loadPromotion = async () => {
      setLoading(true)
      try {
        const [ribbon, banner, library] = await Promise.all([
          getRibbonPromotion(),
          getHomeNavbarBannerPromotion(),
          getBannerLibrary(),
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
      setBannerData({
        images: selectedImages,
        imageUrl: selectedImages[0]?.imageUrl ?? '',
        imagePath: selectedImages[0]?.imagePath ?? '',
      })
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
      setBannerData(null)
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
        setBannerData({
          images: nextActiveImages,
          imageUrl: nextActiveImages[0]?.imageUrl ?? '',
          imagePath: nextActiveImages[0]?.imagePath ?? '',
        })
      }

      toast.success('Image removed from banner folder')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to remove image')
    } finally {
      setUploadingLibrary(false)
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
                <img
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
        </Card>
      </div>

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
                      <img
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
