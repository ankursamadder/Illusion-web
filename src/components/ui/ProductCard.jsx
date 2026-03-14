import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Heart, ShoppingBag } from 'lucide-react'
import Card from './Card'
import Badge from './Badge'
import Button from './Button'
import IconButton from './IconButton'
import { formatCurrency } from '../../utils/formatCurrency'
import useCartStore from '../../hooks/useCartStore'
import useWishlistStore from '../../hooks/useWishlistStore'
import { useAuth } from '../../context/AuthContext'
import { createOrder } from '../../services/orderService'

const getImageUrl = (image) => {
  if (!image) return null
  if (typeof image === 'string') return image
  if (typeof image === 'object' && image.url) return image.url
  return null
}

const ProductCard = ({ product }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { addItem, clear } = useCartStore()
  const { items, addProduct, removeProduct } = useWishlistStore()
  const { name, price, offerPrice, image, images, tag } = product
  const displayImage =
    image || (Array.isArray(images) ? getImageUrl(images[0]) : null)
  const showOffer = typeof offerPrice === 'number' && offerPrice < price
  const isWishlisted = items.some((item) => item.id === product.id)

  const toggleWishlist = () => {
    if (isWishlisted) {
      removeProduct(product.id)
    } else {
      addProduct(product)
    }
  }

  const handleBuyNow = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }

    const unitPrice = showOffer ? offerPrice : price
    const orderItem = {
      id: product.id,
      name: product.name,
      price: product.price ?? 0,
      offerPrice: product.offerPrice ?? null,
      image: displayImage,
      quantity: 1,
    }

    try {
      await createOrder({
        userId: user.uid,
        customerName: user.name ?? '',
        email: user.email ?? '',
        status: 'Pending',
        items: [orderItem],
        total: unitPrice ?? 0,
        paymentMethod: 'upi',
        address: null,
        shipment: {},
      })
      clear()
      toast.success('Order placed successfully')
      navigate('/orders')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to place order')
    }
  }

  return (
    <Card className="group flex h-full flex-col gap-4">
      <div className="relative overflow-hidden rounded-2xl bg-illusion-blush/50">
        {displayImage ? (
          <img
            src={displayImage}
            alt={name}
            className="h-52 w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-52 items-center justify-center text-sm text-illusion-black/40">
            Image Placeholder
          </div>
        )}
        {tag ? (
          <Badge className="absolute left-4 top-4" variant="dark">
            {tag}
          </Badge>
        ) : null}
        <div className="absolute right-4 top-4">
          <IconButton
            icon={Heart}
            label="Save to wishlist"
            size="sm"
            active={isWishlisted}
            onClick={toggleWishlist}
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <div>
          <h3 className="text-lg font-semibold text-illusion-black">{name}</h3>
          <div className="mt-1 flex items-center gap-2 text-sm">
            <span className="font-medium text-illusion-black">
              {formatCurrency(showOffer ? offerPrice : price)}
            </span>
            {showOffer ? (
              <span className="text-illusion-black/50 line-through">
                {formatCurrency(price)}
              </span>
            ) : null}
          </div>
        </div>
        <div className="mt-auto grid gap-2 sm:grid-cols-2">
          <Button size="sm" onClick={() => addItem(product)}>
            Add to cart
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="gap-2"
            onClick={handleBuyNow}
          >
            <ShoppingBag className="h-4 w-4" />
            Buy now
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default ProductCard
