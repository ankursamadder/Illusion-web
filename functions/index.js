const crypto = require('crypto')
const express = require('express')
const cors = require('cors')
const Razorpay = require('razorpay')
const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const admin = require('firebase-admin')

const razorpayKeyId = defineSecret('RAZORPAY_KEY_ID')
const razorpayKeySecret = defineSecret('RAZORPAY_KEY_SECRET')

if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

const createRazorpayClient = () =>
  new Razorpay({
    key_id: razorpayKeyId.value(),
    key_secret: razorpayKeySecret.value(),
  })

const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({ error: message })
}

const signaturesMatch = (signature, expectedSignature) => {
  if (!signature || signature.length !== expectedSignature.length) {
    return false
  }

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'utf8'),
    Buffer.from(expectedSignature, 'utf8')
  )
}

app.get('/health', (req, res) => {
  res.json({ ok: true })
})

app.post('/razorpay/order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body || {}
    const amountInRupees = Number(amount)

    if (!Number.isFinite(amountInRupees) || amountInRupees <= 0) {
      return sendError(res, 400, 'Amount must be a valid rupee value')
    }

    const amountInPaise = Math.round(amountInRupees * 100)
    const razorpay = createRazorpayClient()

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt,
      notes,
    })

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId.value(),
    })
  } catch (error) {
    console.error('Razorpay order error', error)
    return sendError(res, 500, 'Failed to create Razorpay order')
  }
})

app.post('/razorpay/verify', async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      userId = null,
      orderId,
      amount,
      currency = 'INR',
    } = req.body || {}

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return sendError(res, 400, 'Missing payment verification fields')
    }

    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret.value())
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (!signaturesMatch(razorpay_signature, expectedSignature)) {
      return sendError(res, 400, 'Payment verification failed')
    }

    const razorpay = createRazorpayClient()
    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id)
    const internalOrderId = String(
      orderId || razorpayOrder.receipt || razorpay_order_id
    )

    const orderRef = db.collection('orders').doc(internalOrderId)
    const existingOrder = await orderRef.get()
    const timestamp = admin.firestore.FieldValue.serverTimestamp()
    const resolvedAmount =
      typeof razorpayOrder.amount === 'number'
        ? razorpayOrder.amount
        : Number.isFinite(Number(amount))
          ? Math.round(Number(amount))
          : null
    const resolvedCurrency = razorpayOrder.currency || currency

    await orderRef.set(
      {
        orderId: internalOrderId,
        userId,
        amount: resolvedAmount,
        currency: resolvedCurrency,
        razorpay_order_id,
        razorpay_payment_id,
        status: 'Paid',
        paymentStatus: 'Success',
        updatedAt: timestamp,
        ...(existingOrder.exists ? {} : { createdAt: timestamp }),
      },
      { merge: true }
    )

    return res.json({
      verified: true,
      orderId: internalOrderId,
      amount: resolvedAmount,
      currency: resolvedCurrency,
      status: 'Paid',
    })
  } catch (error) {
    console.error('Razorpay verification error', error)
    return sendError(res, 500, 'Failed to verify payment')
  }
})

exports.api = onRequest(
  {
    region: 'asia-south1',
    secrets: [razorpayKeyId, razorpayKeySecret],
  },
  app
)
