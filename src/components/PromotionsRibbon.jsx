import { useEffect, useState } from 'react'
import { subscribeRibbonPromotion } from '../services/promotionService'

const PromotionsRibbon = () => {
  const [promotion, setPromotion] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeRibbonPromotion((ribbon) => {
      setPromotion(ribbon)
    })

    return () => unsubscribe()
  }, [])

  if (!promotion?.enabled || !promotion.text?.trim()) {
    return null
  }

  const message = promotion.text.trim()

  return (
    <div className="bg-illusion-black text-illusion-white">
      <div className="illusion-marquee">
        <div className="illusion-marquee__track">
          {Array.from({ length: 6 }).map((_, index) => (
            <span key={`${message}_${index}`} className="illusion-marquee__item">
              {message}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PromotionsRibbon
