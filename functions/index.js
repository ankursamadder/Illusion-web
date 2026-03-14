const express = require('express')
const cors = require('cors')
const Razorpay = require('razorpay')
const { onRequest } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const admin = require('firebase-admin')

const razorpayKeyId = defineSecret('RAZORPAY_KEY_ID')
const razorpayKeySecret = defineSecret('RAZORPAY_KEY_SECRET')

admin.initializeApp()

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

app.get('/health', (req, res) => {
  res.json({ ok: true })
})

app.post('/razorpay/order', async (req, res) => {
  try {
    const { amount, currency = 'INR', receipt, notes } = req.body || {}

    if (!amount || Number.isNaN(Number(amount))) {
      return res.status(400).json({ error: 'Amount is required' })
    }

    const razorpay = new Razorpay({
      key_id: razorpayKeyId.value(),
      key_secret: razorpayKeySecret.value(),
    })

    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount)),
      currency,
      receipt,
      notes,
    })

    return res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (error) {
    console.error('Razorpay order error', error)
    return res.status(500).json({
      error: 'Failed to create Razorpay order',
    })
  }
})

exports.api = onRequest(
  {
    region: 'asia-south1',
    secrets: [razorpayKeyId, razorpayKeySecret],
  },
  app
)
