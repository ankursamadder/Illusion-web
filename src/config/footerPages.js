export const footerPageDefinitions = [
  {
    slug: 'contact',
    path: '/contact',
    label: 'Contact',
    defaultTitle: 'Contact',
    defaultSubtitle: 'Reach our support and jewellery concierge team.',
    defaultContent:
      'For order help, product questions, and support requests, please use the enquiry form below.\n\nOur team typically responds within one business day.',
  },
  {
    slug: 'shipping',
    path: '/shipping',
    label: 'Shipping',
    defaultTitle: 'Shipping',
    defaultSubtitle: 'Shipping timelines and delivery information.',
    defaultContent:
      'Standard orders are typically delivered within 3-7 business days depending on your location and product availability.\n\nTracking details are shared as soon as your order is packed and dispatched.',
  },
  {
    slug: 'returns',
    path: '/returns',
    label: 'Returns',
    defaultTitle: 'Returns',
    defaultSubtitle: 'Return and exchange support for eligible items.',
    defaultContent:
      'Returns can be requested within 7 days from delivery for eligible products in unused condition with original packaging.\n\nPlease contact support with your order ID to start the return process.',
  },
  {
    slug: 'size-guide',
    path: '/size-guide',
    label: 'Size Guide',
    defaultTitle: 'Size Guide',
    defaultSubtitle: 'Helpful sizing references for rings and bracelets.',
    defaultContent:
      'Use a flexible measuring tape to note circumference and compare with standard size charts before ordering.\n\nIf you are between sizes, we recommend selecting the larger size for a comfortable fit.',
  },
  {
    slug: 'about',
    path: '/about',
    label: 'About',
    defaultTitle: 'About',
    defaultSubtitle: 'The story behind Illusion jewellery.',
    defaultContent:
      'Illusion designs modern heirloom pieces with a focus on elegant silhouettes and everyday wearability.\n\nOur collections are curated to blend craftsmanship, comfort, and timeless detail.',
  },
  {
    slug: 'careers',
    path: '/careers',
    label: 'Careers',
    defaultTitle: 'Careers',
    defaultSubtitle: 'Build the next chapter with our team.',
    defaultContent:
      'We are always open to connecting with designers, operations specialists, and customer experience professionals.\n\nShare your profile at careers@illusion.com and include your portfolio where relevant.',
  },
  {
    slug: 'press',
    path: '/press',
    label: 'Press',
    defaultTitle: 'Press',
    defaultSubtitle: 'Media and partnership inquiries.',
    defaultContent:
      'For interviews, collaborations, and media kits, please write to press@illusion.com.',
  },
  {
    slug: 'sustainability',
    path: '/sustainability',
    label: 'Sustainability',
    defaultTitle: 'Sustainability',
    defaultSubtitle: 'Our approach to responsible sourcing and design.',
    defaultContent:
      'We continue to improve our sourcing standards and packaging practices to reduce environmental impact.\n\nDurability and long-term wear are central to our product design decisions.',
  },
  {
    slug: 'terms-and-conditions',
    path: '/terms-and-conditions',
    label: 'Terms and Conditions',
    defaultTitle: 'Terms and Conditions',
    defaultSubtitle: 'General terms for using our services.',
    defaultContent:
      'By using this website, you agree to our platform policies regarding product availability, payments, and order processing.',
  },
  {
    slug: 'privacy-policy',
    path: '/privacy-policy',
    label: 'Privacy Policy',
    defaultTitle: 'Privacy Policy',
    defaultSubtitle: 'How we collect and use your information.',
    defaultContent:
      'We use personal information only to process orders, improve service quality, and communicate important updates.',
  },
  {
    slug: 'refund-policy',
    path: '/refund-policy',
    label: 'Refund Policy',
    defaultTitle: 'Refund Policy',
    defaultSubtitle: 'Refund eligibility and timelines.',
    defaultContent:
      'Approved refunds are processed back to the original payment method within standard banking timelines after quality checks.',
  },
]

export const getFooterPageBySlug = (slug) =>
  footerPageDefinitions.find((item) => item.slug === slug)

const getPathBySlug = (slug) => getFooterPageBySlug(slug)?.path ?? '/'

export const footerLinkGroups = [
  {
    title: 'Shop',
    links: [
      { label: 'New Arrivals', to: '/shop' },
      { label: 'Rings', to: '/shop' },
      { label: 'Necklaces', to: '/shop' },
      { label: 'Earrings', to: '/shop' },
    ],
  },
  {
    title: 'Customer Service',
    links: [
      { label: 'Contact', to: getPathBySlug('contact') },
      { label: 'Shipping', to: getPathBySlug('shipping') },
      { label: 'Returns', to: getPathBySlug('returns') },
      { label: 'Size Guide', to: getPathBySlug('size-guide') },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: getPathBySlug('about') },
      { label: 'Careers', to: getPathBySlug('careers') },
      { label: 'Press', to: getPathBySlug('press') },
      { label: 'Sustainability', to: getPathBySlug('sustainability') },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms and Conditions', to: getPathBySlug('terms-and-conditions') },
      { label: 'Privacy Policy', to: getPathBySlug('privacy-policy') },
      { label: 'Refund Policy', to: getPathBySlug('refund-policy') },
    ],
  },
]
