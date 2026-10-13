import { useEffect } from 'react'

const updateMetaTag = (attrName, attrValue, content) => {
  if (!content) return
  let element = document.querySelector(`meta[${attrName}="${attrValue}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attrName, attrValue)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

const updateCanonical = (url) => {
  if (!url) return
  let link = document.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }
  link.setAttribute('href', url)
}

const SEO = ({
  title = 'Wahm Jewellery | Fine Jewellery Crafted for Modern Heirlooms',
  description = 'Discover Wahm Jewellery — handcrafted fine jewellery designed for modern heirlooms. Explore curated collections of timeless rings, necklaces, earrings, and bracelets.',
  keywords = 'Wahm jewellery, fine jewellery, modern heirlooms, rings, necklaces, earrings, bracelets, handcrafted jewellery, Indian fine jewellery',
  canonical = 'https://thewahmfashion.web.app/',
  ogImage = 'https://thewahmfashion.web.app/og-image.png',
  ogType = 'website',
  jsonLd,
}) => {
  useEffect(() => {
    document.title = title

    updateMetaTag('name', 'description', description)
    updateMetaTag('name', 'keywords', keywords)
    updateMetaTag('name', 'robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')
    updateMetaTag('name', 'googlebot', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')

    updateCanonical(canonical)

    updateMetaTag('property', 'og:title', title)
    updateMetaTag('property', 'og:description', description)
    updateMetaTag('property', 'og:url', canonical)
    updateMetaTag('property', 'og:type', ogType)
    updateMetaTag('property', 'og:image', ogImage)
    updateMetaTag('property', 'og:site_name', 'Wahm Jewellery')
    updateMetaTag('property', 'og:locale', 'en_IN')

    updateMetaTag('name', 'twitter:card', 'summary_large_image')
    updateMetaTag('name', 'twitter:title', title)
    updateMetaTag('name', 'twitter:description', description)
    updateMetaTag('name', 'twitter:image', ogImage)

    if (jsonLd) {
      let script = document.getElementById('dynamic-json-ld')
      if (!script) {
        script = document.createElement('script')
        script.id = 'dynamic-json-ld'
        script.type = 'application/ld+json'
        document.head.appendChild(script)
      }
      script.text = JSON.stringify(jsonLd)
    }
  }, [title, description, keywords, canonical, ogImage, ogType, jsonLd])

  return null
}

export default SEO
