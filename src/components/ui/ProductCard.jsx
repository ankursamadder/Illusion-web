import { useLocation, useNavigate } from 'react-router-dom'
import { Heart, ShoppingBag } from 'lucide-react'
import Card from './Card'
import Badge from './Badge'
import Button from './Button'
import IconButton from './IconButton'
import BlurImage from './BlurImage'
import { formatCurrency } from '../../utils/formatCurrency'
import useCartStore from '../../hooks/useCartStore'
import useWishlistStore from '../../hooks/useWishlistStore'
import { useAuth } from '../../context/AuthContext'

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
  const { addItem } = useCartStore()
  const { items, addProduct, removeProduct } = useWishlistStore()
  const { name, price, strikePrice, image, images, tag } = product
  const displayImage =
    image || (Array.isArray(images) ? getImageUrl(images[0]) : null)
  const safePrice = Number(price ?? 0)
  const safeStrikePrice = Number(strikePrice ?? 0)
  const hasStrikePrice = safeStrikePrice > safePrice
  const percentOff = hasStrikePrice
    ? Math.round(((safeStrikePrice - safePrice) / safeStrikePrice) * 100)
    : 0
  const isWishlisted = items.some((item) => item.id === product.id)

  const toggleWishlist = () => {
    if (isWishlisted) {
      removeProduct(product.id)
    } else {
      addProduct(product)
    }
  }

  const handleViewDetails = () => {
    if (!product?.id) return
    navigate(`/product/${product.id}`)
  }

  const handleBuyNow = () => {
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }

    addItem(
      {
        ...product,
        image: displayImage,
      },
      1
    )
    navigate('/cart')
  }

  return (
    <Card className="group flex h-full w-full min-w-0 flex-col overflow-hidden !gap-2 !p-1.5 sm:!gap-2.5 sm:!p-2.5">
      <div className="relative overflow-hidden rounded-2xl bg-illusion-blush/50">
        <button
          type="button"
          onClick={handleViewDetails}
          className="block h-44 w-full text-left sm:h-56 lg:h-64"
          aria-label={`View ${name}`}
        >
          {displayImage ? (
            <BlurImage
              src={displayImage}
              alt={name}
              loading="lazy"
              decoding="async"
              fetchPriority="auto"
              wrapperClassName="h-full w-full"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-illusion-black/40">
              Image Placeholder
            </div>
          )}
        </button>
        <div className="absolute left-2 top-2 flex flex-wrap gap-1.5 sm:left-3 sm:top-3 sm:gap-2">
          {product.featured ? (
            <span className="rounded bg-pink-100 px-2 py-1 text-[10px] font-medium text-pink-600 sm:text-xs">
              Featured
            </span>
          ) : null}
          {product.mostFavourite ? (
            <span className="rounded bg-pink-100 px-2 py-1 text-[10px] font-medium text-pink-600 sm:text-xs">
              Most Loved
            </span>
          ) : null}
          {tag ? (
            <Badge variant="dark">
              {tag}
            </Badge>
          ) : null}
        </div>
        <div className="absolute right-2 top-2 sm:right-3 sm:top-3">
          <IconButton
            icon={Heart}
            label="Save to wishlist"
            size="sm"
            active={isWishlisted}
            onClick={toggleWishlist}
          />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-2.5">
        <div className="min-w-0">
          <button type="button" onClick={handleViewDetails} className="min-w-0 text-left">
            <h3 className="min-h-[2.8rem] overflow-hidden break-words text-base font-semibold leading-tight text-illusion-black hover:underline sm:min-h-[3.6rem] sm:text-[1.05rem]">
              {name}
            </h3>
          </button>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
            <span className="font-medium text-illusion-black">
              {formatCurrency(safePrice)}
            </span>
            {hasStrikePrice ? (
              <span className="text-illusion-black/50 line-through">
                {formatCurrency(safeStrikePrice)}
              </span>
            ) : null}
            {hasStrikePrice ? (
              <span className="whitespace-nowrap text-xs font-semibold text-green-600">
                {percentOff}% off
              </span>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleViewDetails}
            className="mt-0.5 text-xs text-illusion-black/60 hover:text-illusion-black hover:underline"
          >
            View details
          </button>
        </div>
        <div className="mt-auto flex flex-col gap-1.5 sm:gap-2">
          <Button size="sm" className="h-10 sm:h-11" onClick={() => addItem(product)}>
            Add to cart
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-10 gap-2 sm:h-11"
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
