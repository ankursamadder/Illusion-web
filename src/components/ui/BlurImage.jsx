import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'

const BlurImage = ({
  src,
  alt,
  className,
  wrapperClassName,
  skeletonClassName,
  fallback,
  ...imgProps
}) => {
  const imageRef = useRef(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setIsLoaded(false)
    setHasError(false)

    const image = imageRef.current
    if (image?.complete && image.naturalWidth > 0) {
      setIsLoaded(true)
    }
  }, [src])

  if (!src || hasError) {
    return fallback ?? null
  }

  return (
    <div className={clsx('relative overflow-hidden bg-illusion-blush/30', wrapperClassName)}>
      {!isLoaded ? (
        <div
          aria-hidden="true"
          className={clsx(
            'absolute inset-0 animate-pulse bg-gradient-to-br from-illusion-blush/55 via-white/70 to-illusion-blush/35',
            skeletonClassName
          )}
        />
      ) : null}
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={clsx(
          'h-full w-full object-cover transition-[opacity,transform] duration-300 ease-out',
          isLoaded ? 'scale-100 blur-0 opacity-100' : 'scale-[1.02] blur-sm opacity-65',
          className
        )}
        {...imgProps}
      />
    </div>
  )
}

export default BlurImage
