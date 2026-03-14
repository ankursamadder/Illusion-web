const loadRazorpay = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }

    if (window.Razorpay) {
      resolve(true)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const DEFAULT_API_BASE_URL = 'https://api-uk22ijbdfq-el.a.run.app'

const getApiBaseUrl = () => {
  const configured = import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL
  const normalized = configured.trim().replace(/\/+$/, '')
  return normalized.endsWith('/api') ? normalized.slice(0, -4) : normalized
}

const parseErrorMessage = async (response) => {
  try {
    const payload = await response.json()
    if (payload?.error) return payload.error
  } catch {
    // fall through to text parsing
  }

  try {
    const text = await response.text()
    return text || null
  } catch {
    return null
  }
}

const createRazorpayOrder = async ({ amount, currency = 'INR', receipt, notes }) => {
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/razorpay/order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount, currency, receipt, notes }),
  })

  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw new Error(message || 'Failed to create Razorpay order')
  }

  return response.json()
}

const verifyRazorpayPayment = async (payload) => {
  const baseUrl = getApiBaseUrl()
  const response = await fetch(`${baseUrl}/razorpay/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await parseErrorMessage(response)
    throw new Error(message || 'Payment verification failed')
  }

  return response.json()
}

export { loadRazorpay, createRazorpayOrder, verifyRazorpayPayment }
