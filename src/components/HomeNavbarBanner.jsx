import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { subscribeHomeNavbarBannerPromotion } from '../services/promotionService'

const MOBILE_BREAKPOINT = 768

const extractImageUrls = (items = []) =>
  items
    .map((item) => item?.imageUrl?.trim())
    .filter((imageUrl) => Boolean(imageUrl))

const HomeNavbarBanner = () => {
  const location = useLocation()
  const [banner, setBanner] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
  )

  useEffect(() => {
    const unsubscribe = subscribeHomeNavbarBannerPromotion((value) => {
      setBanner(value)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined

    const handleResize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }

    window.addEventListener('resize', handleResize)

    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const desktopImages = useMemo(() => {
    if (Array.isArray(banner?.images) && banner.images.length) {
      return extractImageUrls(banner.images)
    }

    if (banner?.imageUrl?.trim()) {
      return [banner.imageUrl.trim()]
    }

    return []
  }, [banner])

  const mobileImages = useMemo(() => {
    if (Array.isArray(banner?.mobileImages) && banner.mobileImages.length) {
      return extractImageUrls(banner.mobileImages)
    }

    if (banner?.mobileImageUrl?.trim()) {
      return [banner.mobileImageUrl.trim()]
    }

    return []
  }, [banner])

  const images = useMemo(
    () => (isMobile && mobileImages.length ? mobileImages : desktopImages),
    [desktopImages, isMobile, mobileImages]
  )

  useEffect(() => {
    setActiveIndex(0)
  }, [images])

  useEffect(() => {
    if (images.length <= 1) return undefined

    const timer = window.setInterval(() => {
      setActiveIndex((previous) => (previous + 1) % images.length)
    }, 3500)

    return () => window.clearInterval(timer)
  }, [images.length])

  if (location.pathname !== '/') return null
  if (!images.length) return null

  const shouldSlide = images.length > 1

  return (
    <section className="border-b border-illusion-black/5 bg-white">
      {shouldSlide ? (
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-700 ease-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {images.map((imageUrl, index) => (
              <img
                key={`${imageUrl}_${index}`}
                src={imageUrl}
                alt={`Illusion promotions banner ${index + 1}`}
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'auto'}
                decoding="async"
                className="block h-auto w-full shrink-0 object-cover"
              />
            ))}
          </div>
        </div>
      ) : (
        <img
          src={images[0]}
          alt="Illusion promotions banner"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="block h-auto w-full object-cover"
        />
      )}
    </section>
  )
}

export default HomeNavbarBanner
