let razorpayScriptPromise = null

const loadRazorpay = () => {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (window.Razorpay) return Promise.resolve(true)

  if (razorpayScriptPromise) return razorpayScriptPromise

  razorpayScriptPromise = new Promise((resolve) => {
    const existingScript = document.querySelector(
      'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
    )

    if (existingScript) {
      if (window.Razorpay || existingScript.dataset.loaded === 'true') {
        resolve(true)
        return
      }

      let settled = false
      const settle = (value) => {
        if (settled) return
        settled = true
        resolve(value)
      }

      existingScript.addEventListener('load', () => settle(true), { once: true })
      existingScript.addEventListener('error', () => settle(false), { once: true })
      window.setTimeout(() => settle(Boolean(window.Razorpay)), 1800)
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => {
      script.dataset.loaded = 'true'
      resolve(true)
    }
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })

  return razorpayScriptPromise
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

const prewarmPaymentsApi = async () => {
  const baseUrl = getApiBaseUrl()

  try {
    await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      cache: 'no-store',
    })
  } catch {
    // Ignore warmup failures; regular flow will handle real errors.
  }
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

export {
  loadRazorpay,
  prewarmPaymentsApi,
  createRazorpayOrder,
  verifyRazorpayPayment,
}
