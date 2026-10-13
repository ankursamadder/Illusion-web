import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const REVEAL_SELECTOR = '[data-reveal]'

const isElementNode = (node) => node instanceof HTMLElement
const isInViewport = (element) => {
  const rect = element.getBoundingClientRect()
  const viewportHeight =
    window.innerHeight || document.documentElement.clientHeight

  return rect.bottom >= 0 && rect.top <= viewportHeight * 0.95
}

const useScrollReveal = () => {
  const location = useLocation()

  useEffect(() => {
    if (typeof document === 'undefined') return undefined

    document.documentElement.classList.add('reveal-active')

    return () => {
      document.documentElement.classList.remove('reveal-active')
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined
    }

    const prefersReducedMotion = window
      .matchMedia('(prefers-reduced-motion: reduce)')
      .matches

    let intersectionObserver = null

    if (!prefersReducedMotion && typeof IntersectionObserver !== 'undefined') {
      intersectionObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return
            entry.target.classList.add('is-visible')
            intersectionObserver?.unobserve(entry.target)
          })
        },
        {
          threshold: 0.08,
          rootMargin: '0px 0px -6% 0px',
        }
      )
    }

    const registerElement = (element) => {
      if (!isElementNode(element)) return
      if (!element.matches(REVEAL_SELECTOR)) return

      if (prefersReducedMotion || !intersectionObserver) {
        element.classList.add('is-visible')
        return
      }

      if (element.classList.contains('is-visible')) return

      // Ensure above-the-fold content is visible immediately on first paint.
      if (isInViewport(element)) {
        element.classList.add('is-visible')
        return
      }

      intersectionObserver.observe(element)
    }

    const registerWithin = (root) => {
      if (!isElementNode(root)) return

      registerElement(root)
      root.querySelectorAll(REVEAL_SELECTOR).forEach((item) => {
        registerElement(item)
      })
    }

    registerWithin(document.body)

    const mutationObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!isElementNode(node)) return
          registerWithin(node)
        })
      })
    })

    // Safety net: never leave content hidden if an observer callback is missed.
    const safetyTimer = window.setTimeout(() => {
      document.querySelectorAll(REVEAL_SELECTOR).forEach((element) => {
        if (!isElementNode(element)) return
        element.classList.add('is-visible')
      })
    }, 1800)

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => {
      window.clearTimeout(safetyTimer)
      mutationObserver.disconnect()
      intersectionObserver?.disconnect()
    }
  }, [location.pathname])
}

export default useScrollReveal
