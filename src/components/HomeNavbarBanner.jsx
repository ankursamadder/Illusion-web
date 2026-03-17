import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { subscribeHomeNavbarBannerPromotion } from '../services/promotionService'

const HomeNavbarBanner = () => {
  const location = useLocation()
  const [banner, setBanner] = useState(null)
  const [activeIndex, setActiveIndex] = useState(0)

  useEffect(() => {
    const unsubscribe = subscribeHomeNavbarBannerPromotion((value) => {
      setBanner(value)
    })

    return () => unsubscribe()
  }, [])

  const images = useMemo(() => {
    if (Array.isArray(banner?.images) && banner.images.length) {
      return banner.images
        .map((item) => item?.imageUrl)
        .filter((imageUrl) => Boolean(imageUrl))
    }

    if (banner?.imageUrl?.trim()) {
      return [banner.imageUrl.trim()]
    }

    return []
  }, [banner])

  useEffect(() => {
    setActiveIndex(0)
  }, [images.length])

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
