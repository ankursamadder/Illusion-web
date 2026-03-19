import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Bold, Check, Italic, List, ListOrdered, Plus, Underline, X } from 'lucide-react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import UnderlineExtension from '@tiptap/extension-underline'
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
import Modal from '../components/ui/Modal'
import { storage } from '../firebase/firebase'
import { optimizeImageFile } from '../utils/imageOptimization'
import {
  addProduct,
  getProductById,
  updateProduct,
} from '../services/productService'
import { addCategory, getCategories } from '../services/categoryService'
import {
  addProductLibraryImages,
  getProductImageLibrary,
  removeProductLibraryImage,
  saveProductImageLibrary,
} from '../services/productImageLibraryService'

const ProductForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)
  const libraryUploadRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [price, setPrice] = useState('')
  const [strikePrice, setStrikePrice] = useState('')
  const [stock, setStock] = useState('')
  const [shipmentTime, setShipmentTime] = useState('')
  const [active, setActive] = useState(true)
  const [featured, setFeatured] = useState(false)
  const [mostFavourite, setMostFavourite] = useState(false)
  const [images, setImages] = useState([])
  const [existingImages, setExistingImages] = useState([])
  const [libraryImages, setLibraryImages] = useState([])
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [libraryUploading, setLibraryUploading] = useState(false)
  const [selectedLibraryKeys, setSelectedLibraryKeys] = useState([])
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [addingCategory, setAddingCategory] = useState(false)
  const [savingCategory, setSavingCategory] = useState(false)

  const selectedLibraryKeySet = useMemo(
    () => new Set(selectedLibraryKeys),
    [selectedLibraryKeys]
  )

  const shipmentOptions = [
    '3-5 business days',
    '5-7 business days',
    '7-10 business days',
  ]

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false,
        blockquote: false,
        codeBlock: false,
        horizontalRule: false,
        dropcursor: false,
      }),
      UnderlineExtension,
    ],
    content: description || '',
    onUpdate: ({ editor }) => {
      setDescription(editor.getHTML())
    },
    onFocus: ({ editor }) => {
      if (editor.isEmpty) {
        editor.commands.unsetAllMarks()
      }
    },
  })


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
        setCategory(product.category ?? '')
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

  useEffect(() => {
    if (!editor) return
    const html = editor.getHTML()
    if ((description || '') !== html) {
      editor.commands.setContent(description || '', false)
    }
  }, [description, editor])

  useEffect(() => {
    if (!libraryOpen) return
    const keys = existingImages
      .map((item) => item?.path || item?.url)
      .filter(Boolean)
    setSelectedLibraryKeys(keys)
  }, [existingImages, libraryOpen])

  useEffect(() => {
    let mounted = true

    const loadLibrary = async () => {
      try {
        const data = await getProductImageLibrary()
        if (!mounted) return
        setLibraryImages(data)
      } catch (error) {
        if (mounted) {
          toast.error(error?.message ?? 'Failed to load product image library')
        }
      }
    }

    loadLibrary()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    const loadCategories = async () => {
      try {
        const data = await getCategories()
        if (!mounted) return
        setCategories(data)
      } catch (error) {
        if (mounted) {
          toast.error(error?.message ?? 'Failed to load categories')
        }
      }
    }

    loadCategories()

    return () => {
      mounted = false
    }
  }, [])


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

  const getLibraryKey = (item) => item?.imagePath || item?.imageUrl || ''

  const mapLibraryToProductImage = (item) => ({
    url: item.imageUrl,
    path: item.imagePath ?? '',
    fromLibrary: true,
  })

  const mapProductImagesToLibrary = (items = []) =>
    items
      .map((item) => {
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
      })
      .filter(Boolean)

  const dedupeLibraryImages = (items = []) => {
    const seen = new Set()
    return items.filter((item) => {
      const key = item.imagePath || item.imageUrl
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  const dedupeProductImages = (items = []) => {
    const seen = new Set()
    return items.filter((item) => {
      const key = item?.path || item?.url
      if (!key || seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  const toggleLibrarySelection = (item) => {
    const key = getLibraryKey(item)
    if (!key) return
    setSelectedLibraryKeys((prev) => {
      if (prev.includes(key)) {
        return prev.filter((entry) => entry !== key)
      }
      return [...prev, key]
    })
  }

  const handleApplyLibrarySelection = () => {
    const selectedImages = libraryImages
      .filter((item) => selectedLibraryKeys.includes(getLibraryKey(item)))
      .map(mapLibraryToProductImage)
    if (!selectedImages.length) {
      setLibraryOpen(false)
      return
    }
    setExistingImages((prev) => dedupeProductImages([...prev, ...selectedImages]))
    setLibraryOpen(false)
  }

  const handleUploadLibraryImages = async (event) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    setLibraryUploading(true)
    try {
      const nextLibrary = await addProductLibraryImages(files)
      setLibraryImages(nextLibrary)
      toast.success('Images uploaded to product gallery')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to upload images')
    } finally {
      setLibraryUploading(false)
      event.target.value = ''
    }
  }

  const handleRemoveLibraryImage = async (item) => {
    const key = getLibraryKey(item)
    if (!key) return

    setLibraryUploading(true)
    try {
      const nextLibrary = await removeProductLibraryImage(item)
      setLibraryImages(nextLibrary)
      setSelectedLibraryKeys((prev) => prev.filter((entry) => entry !== key))
      toast.success('Image removed from product gallery')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to remove image')
    } finally {
      setLibraryUploading(false)
    }
  }

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
    if (image.path && !image.fromLibrary) {
      try {
        await deleteObject(ref(storage, image.path))
      } catch {
        toast.error('Failed to remove image from storage')
      }
    }
  }

  const uploadImages = async (productId) => {
    if (!images.length) return []

    const uploads = images.map(async (file, index) => {
      const optimizedFile = await optimizeImageFile(file, {
        maxWidth: 1280,
        maxHeight: 1280,
        quality: 0.74,
      })
      const fileRef = ref(
        storage,
        `products/${productId}/${Date.now()}_${index}_${optimizedFile.name}`
      )
      await uploadBytes(fileRef, optimizedFile, {
        contentType: optimizedFile.type,
        cacheControl: 'public,max-age=31536000,immutable',
      })
      const url = await getDownloadURL(fileRef)
      return { url, path: fileRef.fullPath }
    })

    return Promise.all(uploads)
  }

  const normalizeCategoryName = (value) => value.trim().replace(/\s+/g, ' ')

  const handleAddCategory = async () => {
    const formatted = normalizeCategoryName(newCategory)
    if (!formatted) {
      toast.error('Enter a category name')
      return
    }

    const exists = categories.some(
      (item) => item.name?.toLowerCase() === formatted.toLowerCase()
    )
    if (exists) {
      toast.error('Category already exists')
      return
    }

    setSavingCategory(true)
    try {
      const saved = await addCategory(formatted)
      const updated = [...categories, { id: saved.id, name: formatted }].sort(
        (a, b) => (a.name || '').localeCompare(b.name || '')
      )
      setCategories(updated)
      setCategory(formatted)
      setNewCategory('')
      setAddingCategory(false)
      toast.success('Category added')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to add category')
    } finally {
      setSavingCategory(false)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const plainDescription = description
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim()
    if (!plainDescription) {
      toast.error('Description is required')
      return
    }
    setLoading(true)

    try {
      const payload = {
        name,
        description,
        category: category || null,
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
        const mergedImages = [...existingImages, ...newImages]
        await updateProduct(id, {
          ...payload,
          images: mergedImages,
        })

        const libraryImages = await getProductImageLibrary()
        const mapped = mapProductImagesToLibrary(mergedImages)
        const nextLibrary = dedupeLibraryImages([...libraryImages, ...mapped])
        if (nextLibrary.length !== libraryImages.length) {
          await saveProductImageLibrary(nextLibrary)
        }

        toast.success('Product updated')
      } else {
        const productId = await addProduct({
          ...payload,
          images: [],
        })
        const uploaded = await uploadImages(productId)
        const mergedImages = [...existingImages, ...uploaded]
        await updateProduct(productId, { images: mergedImages })

        const libraryImages = await getProductImageLibrary()
        const mapped = mapProductImagesToLibrary(mergedImages)
        const nextLibrary = dedupeLibraryImages([...libraryImages, ...mapped])
        if (nextLibrary.length !== libraryImages.length) {
          await saveProductImageLibrary(nextLibrary)
        }

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
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_440px] xl:grid-cols-[minmax(0,1fr)_480px]">
          <Card className="space-y-4">
          <Input
            label="Name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
          <label className="text-sm">
            <span className="mb-2 block font-medium text-illusion-black">
              Category
            </span>
            <div className="flex flex-wrap gap-2">
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="min-w-[220px] flex-1 rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black shadow-soft outline-none"
              >
                <option value="">Select category</option>
                {category &&
                !categories.some(
                  (item) =>
                    item.name?.toLowerCase() === category.toLowerCase()
                ) ? (
                  <option value={category}>{category} (current)</option>
                ) : null}
                {categories.map((item) => (
                  <option key={item.id} value={item.name}>
                    {item.name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-[52px] w-[52px] rounded-2xl border border-illusion-black/10 p-0 text-illusion-black"
                onClick={() => setAddingCategory((prev) => !prev)}
                aria-label="Add category"
              >
                <Plus className="h-5 w-5" />
              </Button>
            </div>
            {addingCategory ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  placeholder="New category name"
                  className="min-w-[220px] flex-1 rounded-2xl border border-illusion-black/10 bg-white px-4 py-2 text-sm text-illusion-black shadow-soft outline-none"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddCategory}
                  disabled={savingCategory}
                >
                  {savingCategory ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setAddingCategory(false)
                    setNewCategory('')
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : null}
          </label>
          <label className="text-sm">
            <span className="mb-2 block font-medium text-illusion-black">
              Description
            </span>
            <div className="rounded-2xl border border-illusion-black/10 bg-white shadow-soft">
              <div className="flex flex-wrap items-center gap-2 border-b border-illusion-black/10 px-3 py-2">
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBold().run()}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-illusion-black/10 p-0 text-illusion-black ${editor?.isActive('bold') ? 'bg-illusion-blush/50' : ''}`}
                  aria-label="Bold"
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleItalic().run()}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-illusion-black/10 p-0 text-illusion-black ${editor?.isActive('italic') ? 'bg-illusion-blush/50' : ''}`}
                  aria-label="Italic"
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleUnderline().run()}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-illusion-black/10 p-0 text-illusion-black ${editor?.isActive('underline') ? 'bg-illusion-blush/50' : ''}`}
                  aria-label="Underline"
                  title="Underline"
                >
                  <Underline className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleBulletList().run()}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-illusion-black/10 p-0 text-illusion-black ${editor?.isActive('bulletList') ? 'bg-illusion-blush/50' : ''}`}
                  aria-label="Bulleted list"
                  title="Bulleted list"
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border border-illusion-black/10 p-0 text-illusion-black ${editor?.isActive('orderedList') ? 'bg-illusion-blush/50' : ''}`}
                  aria-label="Numbered list"
                  title="Numbered list"
                >
                  <ListOrdered className="h-4 w-4" />
                </button>
              </div>
              <EditorContent
                editor={editor}
                className="px-4 py-3 text-sm text-illusion-black [&_.ProseMirror]:min-h-[140px] [&_.ProseMirror]:outline-none [&_.ProseMirror]:whitespace-pre-wrap [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-5 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-5 [&_.ProseMirror_li]:my-1"
              />
            </div>
            <p className="mt-2 text-xs text-illusion-black/50">
              Basic formatting: bold, italic, underline, bullets, and numbers.
            </p>
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
            <label className="text-sm">
              <span className="mb-2 block font-medium text-illusion-black">
                Shipment Time
              </span>
              <select
                value={shipmentTime}
                onChange={(event) => setShipmentTime(event.target.value)}
                className="w-full rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black shadow-soft outline-none"
              >
                <option value="">Select shipment time</option>
                {shipmentTime && !shipmentOptions.includes(shipmentTime) ? (
                  <option value={shipmentTime}>{shipmentTime} (current)</option>
                ) : null}
                {shipmentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-illusion-black">
                  Product Images
                </h3>
                <p className="text-sm text-illusion-black/60">
                  Upload up to 3 images.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setLibraryOpen(true)}
              >
                Product Gallery
              </Button>
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
                      <img
                        loading="lazy"
                        decoding="async"
                        src={img.url}
                        alt=""
                        className="h-28 w-full object-cover"
                      />
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
                      <img
                        loading="lazy"
                        decoding="async"
                        src={img.url}
                        alt=""
                        className="h-28 w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>

          <Card className="space-y-3">
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

          <div className="flex flex-wrap justify-end gap-3">
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
        </div>
      </div>

        <Modal
          open={libraryOpen}
          onClose={() => setLibraryOpen(false)}
          title="Product Image Gallery"
          className="max-w-5xl"
          actions={
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setLibraryOpen(false)}
                disabled={libraryUploading}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={handleApplyLibrarySelection}
                disabled={libraryUploading}
              >
                Add Selected
              </Button>
            </>
          }
        >
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => libraryUploadRef.current?.click()}
                disabled={libraryUploading}
              >
                {libraryUploading ? 'Uploading...' : 'Upload Images'}
              </Button>
              <input
                ref={libraryUploadRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleUploadLibraryImages}
                className="hidden"
              />
              <span className="text-xs text-illusion-black/60">
                {selectedLibraryKeys.length} selected
              </span>
            </div>

            {libraryImages.length ? (
              <div className="grid max-h-[55vh] gap-3 overflow-auto sm:grid-cols-2 lg:grid-cols-3">
                {libraryImages.map((item, index) => {
                  const key = getLibraryKey(item)
                  const selected = selectedLibraryKeySet.has(key)

                  return (
                    <div
                      key={key || `${item.imageUrl}_${index}`}
                      className="space-y-2 rounded-2xl border border-illusion-black/10 p-2"
                    >
                      <button
                        type="button"
                        onClick={() => toggleLibrarySelection(item)}
                        className={`relative block w-full overflow-hidden rounded-xl border ${
                          selected
                            ? 'border-illusion-black'
                            : 'border-illusion-black/10'
                        }`}
                      >
                        <img
                          loading="lazy"
                          decoding="async"
                          src={item.imageUrl}
                          alt={`Product library ${index + 1}`}
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
                        disabled={libraryUploading}
                      >
                        Remove
                      </Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-illusion-black/60">
                No images in the product gallery yet.
              </p>
            )}
          </div>
        </Modal>
      </form>
    </AdminLayout>
  )
}

export default ProductForm
