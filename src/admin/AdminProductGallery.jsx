import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Check, Trash2, Upload } from 'lucide-react'
import AdminLayout from './AdminLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import {
  addProductLibraryImages,
  getProductImageLibrary,
  removeProductLibraryImage,
  saveProductImageLibrary,
} from '../services/productImageLibraryService'
import { getProducts, updateProduct } from '../services/productService'

const getLibraryKey = (item) => item?.imagePath || item?.imageUrl || ''

const mapProductImageToLibrary = (item) => {
  if (!item) return null
  if (typeof item === 'string') {
    return { imageUrl: item, imagePath: '' }
  }
  if (typeof item === 'object') {
    const imageUrl = item.url || item.imageUrl || item.image || ''
    const imagePath = item.path || item.imagePath || ''
    if (!imageUrl) return null
    return { imageUrl, imagePath }
  }
  return null
}

const dedupeLibraryImages = (items = []) => {
  const seen = new Set()
  return items.filter((item) => {
    const key = getLibraryKey(item)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const getProductImageKey = (item) => {
  if (!item) return ''
  if (typeof item === 'string') return item
  if (typeof item === 'object') {
    return item.path || item.imagePath || item.url || item.imageUrl || item.image || ''
  }
  return ''
}

const AdminProductGallery = () => {
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [removing, setRemoving] = useState('')
  const [libraryImages, setLibraryImages] = useState([])
  const [products, setProducts] = useState([])

  const usageMap = useMemo(() => {
    const map = new Map()
    products.forEach((product) => {
      const items = [
        ...(Array.isArray(product.images) ? product.images : []),
        ...(product.image ? [product.image] : []),
      ]
      items.forEach((image) => {
        const key = getProductImageKey(image)
        if (!key) return
        const entry = map.get(key) || new Set()
        entry.add(product.name || product.id)
        map.set(key, entry)
      })
    })
    return map
  }, [products])

  useEffect(() => {
    let mounted = true

    const loadGallery = async () => {
      setLoading(true)
      try {
        const [library, productList] = await Promise.all([
          getProductImageLibrary(),
          getProducts(),
        ])
        if (!mounted) return

        const productImages = productList
          .flatMap((product) => [
            ...(Array.isArray(product.images) ? product.images : []),
            ...(product.image ? [product.image] : []),
          ])
          .map(mapProductImageToLibrary)
          .filter(Boolean)

        const merged = dedupeLibraryImages([...library, ...productImages])
        if (merged.length !== library.length) {
          await saveProductImageLibrary(merged)
        }

        setLibraryImages(merged)
        setProducts(productList)
      } catch (error) {
        toast.error(error?.message ?? 'Failed to load product gallery')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadGallery()

    return () => {
      mounted = false
    }
  }, [])

  const handleUpload = async (event) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    setUploading(true)
    try {
      const nextLibrary = await addProductLibraryImages(files)
      setLibraryImages(nextLibrary)
      toast.success('Images uploaded to product gallery')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to upload images')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const handleRemove = async (item) => {
    const key = getLibraryKey(item)
    if (!key) return

    const usedBy = usageMap.get(key)
    if (usedBy?.size) {
      const confirm = window.confirm(
        `This image is used in ${usedBy.size} product(s). Remove it anyway?`
      )
      if (!confirm) return
    }

    setRemoving(key)
    try {
      const updatedProducts = []

      for (const product of products) {
        const images = Array.isArray(product.images) ? product.images : []
        const filteredImages = images.filter(
          (img) => getProductImageKey(img) !== key
        )
        const imageMatch = getProductImageKey(product.image) === key

        if (
          filteredImages.length !== images.length ||
          imageMatch
        ) {
          await updateProduct(product.id, {
            images: filteredImages,
            image: imageMatch ? null : product.image ?? null,
          })
          updatedProducts.push({
            ...product,
            images: filteredImages,
            image: imageMatch ? null : product.image ?? null,
          })
        } else {
          updatedProducts.push(product)
        }
      }

      const nextLibrary = await removeProductLibraryImage(item)
      setLibraryImages(nextLibrary)
      setProducts(updatedProducts)
      toast.success('Image removed from product gallery')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to remove image')
    } finally {
      setRemoving('')
    }
  }

  return (
    <AdminLayout
      title="Product Gallery"
      subtitle="Browse, upload, and manage all product images."
    >
      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-illusion-black">
              All Product Images
            </h2>
            <p className="text-sm text-illusion-black/60">
              Every product image stored in Firebase appears here.
            </p>
          </div>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-illusion-black/10 bg-white px-4 py-2 text-xs text-illusion-black shadow-soft">
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : 'Upload Images'}
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        </div>

        {loading ? (
          <p className="text-sm text-illusion-black/60">Loading gallery...</p>
        ) : libraryImages.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {libraryImages.map((item, index) => {
              const key = getLibraryKey(item)
              const usedBy = usageMap.get(key)

              return (
                <div
                  key={key || `${item.imageUrl}_${index}`}
                  className="space-y-2 rounded-2xl border border-illusion-black/10 bg-white p-3"
                >
                  <div className="relative overflow-hidden rounded-xl border border-illusion-black/10">
                    <img
                      loading="lazy"
                      decoding="async"
                      src={item.imageUrl}
                      alt={`Product image ${index + 1}`}
                      className="h-32 w-full object-cover"
                    />
                    {usedBy?.size ? (
                      <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-illusion-black px-2 py-1 text-[10px] text-white">
                        <Check className="h-3 w-3" />
                        Used in {usedBy.size}
                      </span>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="w-full gap-2"
                    onClick={() => handleRemove(item)}
                    disabled={removing === key}
                  >
                    <Trash2 className="h-4 w-4" />
                    {removing === key ? 'Removing...' : 'Delete'}
                  </Button>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-illusion-black/60">
            No product images found yet.
          </p>
        )}
      </Card>
    </AdminLayout>
  )
}

export default AdminProductGallery
