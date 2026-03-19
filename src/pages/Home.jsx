import { useEffect, useMemo, useRef, useState } from 'react'
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
import { getBestSellerVideos } from '../services/promotionService'

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
  if (!loading && !products.length) {
    return null
  }

  return (
    <section className="py-12">
      <Container>
        <div className="mb-6 flex flex-col items-start gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-illusion-black">{title}</h2>
            <p className="text-sm text-illusion-black/60">{subtitle}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onViewAll}>
            View all
          </Button>
        </div>

        {loading ? (
          <Card className="text-sm text-illusion-black/60">Loading products...</Card>
        ) : products.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : null}
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

const BestSellerSection = ({ videos, loading, onBuyNow, sectionRef }) => {
  const videoRefs = useRef([])
  const [activeVideoIndex, setActiveVideoIndex] = useState(0)

  useEffect(() => {
    setActiveVideoIndex(0)
    videoRefs.current = []
  }, [videos.length])

  useEffect(() => {
    if (!videos.length) return undefined

    const attemptPlay = () => {
      const firstVideo = videoRefs.current[0]
      if (!firstVideo) return
      firstVideo.muted = true
      firstVideo.playsInline = true
      const playPromise = firstVideo.play()
      if (typeof playPromise?.catch === 'function') {
        playPromise.catch(() => {})
      }
    }

    const raf = window.requestAnimationFrame(attemptPlay)
    const timeout = window.setTimeout(attemptPlay, 450)

    return () => {
      window.cancelAnimationFrame(raf)
      window.clearTimeout(timeout)
    }
  }, [videos.length])

  useEffect(() => {
    if (!videos.length) return

    const targetVideo = videoRefs.current[activeVideoIndex]
    if (!targetVideo) return

    videoRefs.current.forEach((video, index) => {
      if (!video || index === activeVideoIndex) return
      video.pause()
      video.currentTime = 0
    })

    targetVideo.muted = true
    const playPromise = targetVideo.play()
    if (typeof playPromise?.catch === 'function') {
      playPromise.catch(() => {})
    }
  }, [activeVideoIndex, videos])

  const handleVideoEnded = (index) => {
    if (!videos.length) return
    setActiveVideoIndex((index + 1) % videos.length)
  }

  return (
    <section ref={sectionRef} id="best-seller" className="py-12">
      <Container>
        <div className="mb-8 flex items-end justify-between gap-6">
          <div>
            <h2 className="text-2xl font-semibold text-illusion-black">Best Seller</h2>
            <p className="text-sm text-illusion-black/60">
              Top video picks curated by our promotions team.
            </p>
          </div>
        </div>

        {loading ? (
          <Card className="text-sm text-illusion-black/60">Loading best seller videos...</Card>
        ) : videos.length ? (
          <div className="grid gap-4 md:grid-cols-3">
            {videos.map((video, index) => (
              <Card key={video.id} className="space-y-3 p-3">
                <video
                  ref={(element) => {
                    videoRefs.current = videoRefs.current.slice(0, videos.length)
                    videoRefs.current[index] = element
                  }}
                  src={video.videoUrl}
                  controls
                  autoPlay={index === activeVideoIndex}
                  muted
                  playsInline
                  preload="auto"
                  onPlay={() => setActiveVideoIndex(index)}
                  onEnded={() => handleVideoEnded(index)}
                  className="aspect-[9/16] w-full rounded-2xl bg-black object-cover"
                />
                <p className="truncate text-sm font-medium text-illusion-black">
                  {video.productName || 'Best Seller Product'}
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => onBuyNow(video)}
                  disabled={!video.productId}
                >
                  Buy now
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-sm text-illusion-black/60">
            No best seller videos added yet.
          </Card>
        )}
      </Container>
    </section>
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
  const bestSellerSectionRef = useRef(null)
  const [productsLoading, setProductsLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [bestSellerLoading, setBestSellerLoading] = useState(true)
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [mostLovedProducts, setMostLovedProducts] = useState([])
  const [newArrivals, setNewArrivals] = useState([])
  const [approvedReviews, setApprovedReviews] = useState([])
  const [bestSellerVideos, setBestSellerVideos] = useState([])

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

    const loadBestSellerVideos = async () => {
      setBestSellerLoading(true)
      try {
        const videos = await getBestSellerVideos()
        if (!mounted) return
        setBestSellerVideos(videos.filter((item) => item.active !== false).slice(0, 3))
      } catch (error) {
        toast.error(error?.message ?? 'Failed to load best seller videos')
      } finally {
        if (mounted) setBestSellerLoading(false)
      }
    }

    loadProducts()
    loadReviews()
    loadBestSellerVideos()

    return () => {
      mounted = false
    }
  }, [])

  const handleScrollToBestSeller = () => {
    bestSellerSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleBestSellerBuyNow = (video) => {
    if (!video?.productId) return
    navigate(`/product/${video.productId}`)
  }

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
              <Button variant="secondary" onClick={handleScrollToBestSeller}>
                Best Seller
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

      <BestSellerSection
        sectionRef={bestSellerSectionRef}
        videos={bestSellerVideos}
        loading={bestSellerLoading}
        onBuyNow={handleBestSellerBuyNow}
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
