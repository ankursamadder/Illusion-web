import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Star } from 'lucide-react'
import Button from '../components/ui/Button'
import ProductCard from '../components/ui/ProductCard'
import Card from '../components/ui/Card'
import Container from '../components/Container'
import {
  getFeaturedProducts,
  getMostFavouriteProducts,
  getNewArrivalProducts,
} from '../services/productService'
import { getApprovedReviews } from '../services/reviewService'

const chunkItems = (items, size) => {
  const chunks = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

const ProductSection = ({
  title,
  subtitle,
  products,
  loading,
  onViewAll,
}) => {
  return (
    <section className="py-12">
      <Container>
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-illusion-black">{title}</h2>
            <p className="text-sm text-illusion-black/60">{subtitle}</p>
          </div>
          <Button variant="ghost" onClick={onViewAll}>
            View all
          </Button>
        </div>

        {loading ? (
          <Card className="text-sm text-illusion-black/60">Loading products...</Card>
        ) : products.length ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <Card className="text-sm text-illusion-black/60">
            No products available in this section.
          </Card>
        )}
      </Container>
    </section>
  )
}

const ReviewCard = ({ review }) => {
  const rating = Math.max(1, Math.min(5, Number(review.rating) || 1))

  return (
    <Card className="h-full p-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-illusion-black">
            {review.userName ?? 'Customer'}
          </p>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, index) => (
              <Star
                key={`${review.id}_star_${index}`}
                className={`h-3.5 w-3.5 ${
                  index < rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-illusion-black/20'
                }`}
              />
            ))}
          </div>
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-illusion-black/50">
          {review.productName ?? 'Store Review'}
        </p>
        <p className="text-sm text-illusion-black/70">"{review.comment}"</p>
      </div>
    </Card>
  )
}

const ReviewsSection = ({ reviews, loading }) => {
  const reviewSlides = useMemo(() => chunkItems(reviews, 4), [reviews])
  const [activeSlide, setActiveSlide] = useState(0)

  useEffect(() => {
    setActiveSlide(0)
  }, [reviews.length])

  useEffect(() => {
    if (reviewSlides.length <= 1) return undefined

    const interval = window.setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % reviewSlides.length)
    }, 3500)

    return () => window.clearInterval(interval)
  }, [reviewSlides.length])

  const handlePrev = () => {
    setActiveSlide((prev) =>
      prev === 0 ? reviewSlides.length - 1 : prev - 1
    )
  }

  const handleNext = () => {
    setActiveSlide((prev) => (prev + 1) % reviewSlides.length)
  }

  return (
    <section className="py-12">
      <Container>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-illusion-black">
              Customer Reviews
            </h2>
            <p className="text-sm text-illusion-black/60">
              Feedback from verified jewellery buyers.
            </p>
          </div>
          {reviewSlides.length > 1 ? (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={handlePrev}>
                Previous
              </Button>
              <Button size="sm" variant="secondary" onClick={handleNext}>
                Next
              </Button>
            </div>
          ) : null}
        </div>

        {loading ? (
          <Card className="text-sm text-illusion-black/60">Loading reviews...</Card>
        ) : reviews.length ? (
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeSlide * 100}%)` }}
            >
              {reviewSlides.map((slide, index) => (
                <div key={index} className="grid min-w-full gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {slide.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Card className="text-sm text-illusion-black/60">
            No approved reviews yet.
          </Card>
        )}
      </Container>
    </section>
  )
}

const Home = () => {
  const navigate = useNavigate()
  const [productsLoading, setProductsLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [mostLovedProducts, setMostLovedProducts] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [approvedReviews, setApprovedReviews] = useState([])

  useEffect(() => {
    let mounted = true

    const loadProducts = async () => {
      setProductsLoading(true)
      try {
        const [featured, loved, arrivals] = await Promise.all([
          getFeaturedProducts(8),
          getMostFavouriteProducts(8),
          getNewArrivalProducts(8),
        ])

        if (!mounted) return
        setFeaturedProducts(featured)
        setMostLovedProducts(loved)
        setNewArrivals(arrivals)
      } catch (error) {
        toast.error(error?.message ?? 'Failed to load homepage products')
      } finally {
        if (mounted) setProductsLoading(false)
      }
    }

    const loadReviews = async () => {
      setReviewsLoading(true)
      try {
        const reviewItems = await getApprovedReviews(16)
        if (!mounted) return
        setApprovedReviews(reviewItems)
      } catch (error) {
        toast.error(error?.message ?? 'Failed to load reviews')
      } finally {
        if (mounted) setReviewsLoading(false)
      }
    }

    loadProducts()
    loadReviews()

    return () => {
      mounted = false
    }
  }, [])

  return (
    <div>
      <section className="bg-illusion-blush/50 py-16">
        <Container className="grid gap-10 md:grid-cols-2 md:items-center">
          <div className="space-y-6">
            <p className="text-sm uppercase tracking-[0.3em] text-illusion-black/60">
              Illusion Jewellery
            </p>
            <h1 className="text-4xl font-semibold text-illusion-black md:text-5xl">
              Fine jewellery crafted for modern heirlooms.
            </h1>
            <p className="text-base text-illusion-black/70">
              Explore curated collections that blend soft shimmer, minimal forms,
              and timeless elegance.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate('/shop')}>Shop New Arrivals</Button>
              <Button variant="secondary" onClick={() => navigate('/shop')}>
                Book a Visit
              </Button>
            </div>
          </div>
          <div className="rounded-3xl bg-white p-10 shadow-card">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.3em] text-illusion-black/50">
                Atelier Notes
              </p>
              <h2 className="text-2xl font-semibold text-illusion-black">
                Ethically sourced, impeccably set.
              </h2>
              <p className="text-sm text-illusion-black/60">
                Each piece is designed with a focus on longevity, soft silhouettes,
                and luminous finishes.
              </p>
            </div>
          </div>
        </Container>
      </section>

      <ProductSection
        title="Featured Collection"
        subtitle="Handpicked spotlight pieces from this season."
        products={featuredProducts}
        loading={productsLoading}
        onViewAll={() => navigate('/shop')}
      />

      <ProductSection
        title="Most Loved Jewellery"
        subtitle="Customer favourites that shine every day."
        products={mostLovedProducts}
        loading={productsLoading}
        onViewAll={() => navigate('/shop')}
      />

      <ProductSection
        title="New Arrivals"
        subtitle="Latest additions to the Illusion collection."
        products={newArrivals}
        loading={productsLoading}
        onViewAll={() => navigate('/shop')}
      />

      <ReviewsSection reviews={approvedReviews} loading={reviewsLoading} />
    </div>
  )
}

export default Home
