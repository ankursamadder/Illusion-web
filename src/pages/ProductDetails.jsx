import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Heart, Share2 } from 'lucide-react'
import PageShell from './PageShell'
import Button from '../components/ui/Button'
import IconButton from '../components/ui/IconButton'
import ProductCard from '../components/ui/ProductCard'
import Card from '../components/ui/Card'
import { getProductById, getProducts } from '../services/productService'
import { formatCurrency } from '../utils/formatCurrency'
import useCartStore from '../hooks/useCartStore'
import useWishlistStore from '../hooks/useWishlistStore'
import { useAuth } from '../context/AuthContext'

const getImageUrl = (image) => {
  if (!image) return null
  if (typeof image === 'string') return image
  if (typeof image === 'object' && image.url) return image.url
  return null
}

const ProductDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { addItem } = useCartStore()
  const { items: wishlistItems, addProduct, removeProduct } = useWishlistStore()
  const [product, setProduct] = useState(null)
  const [similar, setSimilar] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState('')

  useEffect(() => {
    let mounted = true

    const loadProduct = async () => {
      setLoading(true)
      try {
        const data = await getProductById(id)
        if (!data) {
          toast.error('Product not found')
          if (mounted) setProduct(null)
          return
        }
        if (mounted) setProduct(data)

        const allProducts = await getProducts()
        const matches = allProducts.filter((item) => item.id !== id)
        if (mounted) setSimilar(matches.slice(0, 3))
      } catch (error) {
        toast.error(error?.message ?? 'Failed to load product')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadProduct()

    return () => {
      mounted = false
    }
  }, [id])

  const images = useMemo(() => {
    if (!product) return []
    if (Array.isArray(product.images) && product.images.length) {
      return product.images.map(getImageUrl).filter(Boolean)
    }
    if (product.image) return [product.image]
    return []
  }, [product])

  useEffect(() => {
    if (images.length) {
      setSelectedImage(images[0])
    }
  }, [images])

  const plainDescription = useMemo(() => {
    const raw = product?.description ?? ''
    return raw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
  }, [product?.description])

  const descriptionHtml = useMemo(() => {
    const raw = product?.description ?? ''
    if (/<[a-z][\s\S]*>/i.test(raw)) return raw
    return raw.replace(/\n/g, '<br />')
  }, [product?.description])

  if (loading) {
    return (
      <PageShell title="Product" subtitle="Loading product details.">
        <Card className="text-sm text-illusion-black/60">Loading...</Card>
      </PageShell>
    )
  }

  if (!product) {
    return (
      <PageShell title="Product" subtitle="Product not found.">
        <Card className="text-sm text-illusion-black/60">
          We couldn't find this product.
        </Card>
      </PageShell>
    )
  }

  const offerPrice = product.offerPrice
  const showOffer = typeof offerPrice === 'number' && offerPrice < product.price
  const isWishlisted = wishlistItems.some((item) => item.id === product.id)

  const toggleWishlist = () => {
    if (isWishlisted) {
      removeProduct(product.id)
    } else {
      addProduct(product)
    }
  }

  const handleBuyNow = () => {
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }

    addItem(
      {
        ...product,
        image: selectedImage || images[0] || product.image,
      },
      1
    )
    navigate('/cart')
  }

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: plainDescription,
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied')
      }
    } catch {
      toast.error('Unable to share')
    }
  }

  return (
    <PageShell title={product.name} subtitle={product.category ?? ''}>
      <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
            <div className="flex gap-3 sm:flex-col">
              {images.length ? (
                images.map((img) => (
                  <button
                    key={img}
                    type="button"
                    onClick={() => setSelectedImage(img)}
                    className={`h-20 w-20 overflow-hidden rounded-2xl border bg-illusion-blush/40 transition ${
                      selectedImage === img
                        ? 'border-illusion-pink/60 ring-2 ring-illusion-pink/30'
                        : 'border-illusion-black/10'
                    }`}
                  >
                    <img loading="lazy" decoding="async" src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-dashed border-illusion-black/20 text-xs text-illusion-black/40">
                  No image
                </div>
              )}
            </div>
            <div className="overflow-hidden rounded-3xl bg-illusion-blush/40">
              {selectedImage ? (
                <img loading="lazy" decoding="async"
                  src={selectedImage}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-80 items-center justify-center text-sm text-illusion-black/40">
                  Image placeholder
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold text-illusion-black">
                {product.name}
              </h1>
              <div
                className="mt-2 text-sm text-illusion-black/60 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:text-illusion-black"
                dangerouslySetInnerHTML={{ __html: descriptionHtml }}
              />
            </div>
            <div className="flex gap-2">
              <IconButton
                icon={Heart}
                label="Add to wishlist"
                active={isWishlisted}
                onClick={toggleWishlist}
              />
              <IconButton icon={Share2} label="Share product" onClick={handleShare} />
            </div>
          </div>

          <Card className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-illusion-black/50">
                Price
              </p>
              <div className="mt-2 flex items-center gap-3">
                <span className="text-2xl font-semibold text-illusion-black">
                  {formatCurrency(showOffer ? offerPrice : product.price)}
                </span>
                {showOffer ? (
                  <span className="text-sm text-illusion-black/50 line-through">
                    {formatCurrency(product.price)}
                  </span>
                ) : null}
              </div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-illusion-black/50">
                Shipment Time
              </p>
              <p className="text-sm text-illusion-black">
                {product.shipmentTime ?? '3-5 business days'}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button onClick={() => addItem(product)}>Add to Cart</Button>
              <Button variant="secondary" onClick={handleBuyNow}>
                Buy Now
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-12">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-illusion-black">
              Similar Products
            </h2>
            <p className="text-sm text-illusion-black/60">
              Handpicked styles you might love.
            </p>
          </div>
        </div>
        {similar.length ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        ) : (
          <Card className="text-sm text-illusion-black/60">
            No similar products found.
          </Card>
        )}
      </div>
    </PageShell>
  )
}

export default ProductDetails
