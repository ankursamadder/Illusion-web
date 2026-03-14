import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { X } from 'lucide-react'
import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from 'firebase/storage'
import AdminLayout from './AdminLayout'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { storage } from '../firebase/firebase'
import {
  addProduct,
  getProductById,
  updateProduct,
} from '../services/productService'

const ProductForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [strikePrice, setStrikePrice] = useState('')
  const [stock, setStock] = useState('')
  const [shipmentTime, setShipmentTime] = useState('')
  const [active, setActive] = useState(true)
  const [featured, setFeatured] = useState(false)
  const [mostFavourite, setMostFavourite] = useState(false)
  const [images, setImages] = useState([])
  const [existingImages, setExistingImages] = useState([])

  useEffect(() => {
    if (!editing) return

    const loadProduct = async () => {
      setLoading(true)
      try {
        const product = await getProductById(id)
        if (!product) {
          toast.error('Product not found')
          navigate('/admin/products')
          return
        }
        setName(product.name ?? '')
        setDescription(product.description ?? '')
        setPrice(product.price ?? '')
        setStrikePrice(product.strikePrice ?? '')
        setStock(product.stock ?? '')
        setShipmentTime(product.shipmentTime ?? '')
        setActive(product.active !== false)
        setFeatured(product.featured === true)
        setMostFavourite(product.mostFavourite === true)
        setExistingImages(product.images ?? [])
      } catch (error) {
        toast.error(error?.message ?? 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [editing, id, navigate])

  const imagePreviews = useMemo(() => {
    return images.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }))
  }, [images])

  useEffect(() => {
    return () => {
      imagePreviews.forEach((item) => URL.revokeObjectURL(item.url))
    }
  }, [imagePreviews])

  const handleImages = (event) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return

    if (files.length > 3) {
      toast.error('Maximum 3 images allowed')
      return
    }

    setImages(files)
  }

  const removeExistingImage = async (image) => {
    setExistingImages((prev) => prev.filter((item) => item.url !== image.url))
    if (image.path) {
      try {
        await deleteObject(ref(storage, image.path))
      } catch {
        toast.error('Failed to remove image from storage')
      }
    }
  }

  const uploadImages = async (productId) => {
    if (!images.length) return []

    const uploads = images.map(async (file) => {
      const fileRef = ref(storage, `products/${productId}/${file.name}`)
      await uploadBytes(fileRef, file)
      const url = await getDownloadURL(fileRef)
      return { url, path: fileRef.fullPath }
    })

    return Promise.all(uploads)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const payload = {
        name,
        description,
        price: Number(price),
        strikePrice: strikePrice ? Number(strikePrice) : null,
        stock: Number(stock),
        shipmentTime,
        active,
        featured,
        mostFavourite,
      }

      if (editing) {
        const newImages = await uploadImages(id)
        await updateProduct(id, {
          ...payload,
          images: [...existingImages, ...newImages],
        })
        toast.success('Product updated')
      } else {
        const productId = await addProduct({
          ...payload,
          images: [],
        })
        const uploaded = await uploadImages(productId)
        await updateProduct(productId, { images: uploaded })
        toast.success('Product created')
      }

      navigate('/admin/products')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to save product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AdminLayout
      title={editing ? 'Edit Product' : 'Add Product'}
      subtitle="Provide product details and media."
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <Card className="space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <label className="text-sm">
            <span className="mb-2 block font-medium text-illusion-black">
              Description
            </span>
            <textarea
              rows={5}
              className="w-full rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black shadow-soft outline-none"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Write a rich description..."
              required
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Price"
              type="number"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              required
            />
            <Input
              label="Strike Price"
              type="number"
              value={strikePrice}
              onChange={(event) => setStrikePrice(event.target.value)}
            />
            <Input
              label="Stock"
              type="number"
              value={stock}
              onChange={(event) => setStock(event.target.value)}
              required
            />
            <Input
              label="Shipment Time"
              value={shipmentTime}
              onChange={(event) => setShipmentTime(event.target.value)}
              placeholder="e.g. 3-5 business days"
            />
          </div>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={active}
              onChange={(event) => setActive(event.target.checked)}
              className="h-4 w-4 rounded border-illusion-black/20"
            />
            <span>Active product</span>
            <Badge variant={active ? 'soft' : 'outline'}>
              {active ? 'Active' : 'Inactive'}
            </Badge>
          </label>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={featured}
              onChange={(event) => setFeatured(event.target.checked)}
              className="h-4 w-4 rounded border-illusion-black/20"
            />
            <span>Featured product</span>
            <Badge variant={featured ? 'soft' : 'outline'}>
              {featured ? 'Featured' : 'Not featured'}
            </Badge>
          </label>

          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={mostFavourite}
              onChange={(event) => setMostFavourite(event.target.checked)}
              className="h-4 w-4 rounded border-illusion-black/20"
            />
            <span>Most Favourite product</span>
            <Badge variant={mostFavourite ? 'soft' : 'outline'}>
              {mostFavourite ? 'Most loved' : 'Regular'}
            </Badge>
          </label>
        </Card>

        <Card className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-illusion-black">
              Product Images
            </h3>
            <p className="text-sm text-illusion-black/60">
              Upload up to 3 images.
            </p>
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImages}
          />

          {existingImages.length ? (
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-illusion-black/50">
                Existing Images
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {existingImages.map((img) => (
                  <div
                    key={img.url}
                    className="relative overflow-hidden rounded-2xl border border-illusion-black/10"
                  >
                    <img src={img.url} alt="" className="h-28 w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(img)}
                      className="absolute right-2 top-2 rounded-full bg-white/80 p-1 text-illusion-black/70"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {imagePreviews.length ? (
            <div>
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-illusion-black/50">
                New Uploads
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                {imagePreviews.map((img) => (
                  <div
                    key={img.url}
                    className="overflow-hidden rounded-2xl border border-illusion-black/10"
                  >
                    <img src={img.url} alt="" className="h-28 w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={loading}>
            {editing ? 'Save Changes' : 'Create Product'}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/admin/products')}
          >
            Cancel
          </Button>
        </div>
      </form>
    </AdminLayout>
  )
}

export default ProductForm
