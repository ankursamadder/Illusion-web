const crypto = require('crypto')
const express = require('express')
const cors = require('cors')
const Razorpay = require('razorpay')
const nodemailer = require('nodemailer')
const admin = require('firebase-admin')
const { onRequest } = require('firebase-functions/v2/https')
const { onDocumentWritten } = require('firebase-functions/v2/firestore')
const { defineSecret } = require('firebase-functions/params')

const RAZORPAY_KEY_ID = defineSecret('RAZORPAY_KEY_ID')
const RAZORPAY_KEY_SECRET = defineSecret('RAZORPAY_KEY_SECRET')
const EMAIL_USER = defineSecret('EMAIL_USER')
const EMAIL_PASS = defineSecret('EMAIL_PASS')
const ADMIN_EMAIL = defineSecret('ADMIN_EMAIL')

if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp

const notificationSettingsRef = db.collection('notificationSettings').doc('orderEmails')
const adminTemplateRef = db.collection('mailTemplates').doc('adminNewOrder')
const customerTemplateRef = db.collection('mailTemplates').doc('customerOrder')

const defaultAdminTemplate = {
  subject: '\u{1F6D2} New Order Received \u2013 Illusion Jewellery',
  body: `
    <p style="margin: 0 0 12px 0;">A new order has been placed.</p>
    <table style="border-collapse: collapse; width: 100%; max-width: 640px; border: 1px solid #e5e7eb;">
      <tr><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Product Name</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">{{productName}}</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Product Price</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">{{productPrice}}</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Customer Name</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">{{customerName}}</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Customer Email</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">{{customerEmail}}</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Customer Address</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">{{customerAddress}}</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Razorpay Payment ID</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">{{paymentId}}</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Order Date</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">{{orderDate}}</td></tr>
    </table>
  `,
}

const defaultCustomerTemplate = {
  subject: 'Order Confirmation \u2013 Illusion Jewellery',
  body: `
    <p style="margin: 0 0 10px 0;">Hi {{customerName}},</p>
    <p style="margin: 0 0 12px 0;">Thank you for your order with Illusion Jewellery.</p>
    <table style="border-collapse: collapse; width: 100%; max-width: 640px; border: 1px solid #e5e7eb;">
      <tr><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Product</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">{{productName}}</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Price</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">{{productPrice}}</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Payment ID</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">{{paymentId}}</td></tr>
      <tr><td style="padding: 10px; border: 1px solid #e5e7eb;"><strong>Status</strong></td><td style="padding: 10px; border: 1px solid #e5e7eb;">Processing</td></tr>
    </table>
    <p style="margin-top: 12px;">We will notify you when your order is shipped.</p>
  `,
}

let cachedTransporter = null
let cachedTransporterKey = ''

const sanitizeEmails = (value) => {
  const list = Array.isArray(value) ? value : [value]
  const seen = new Set()

  return list
    .map((item) => String(item || '').trim().toLowerCase())
    .filter((item) => item && !seen.has(item) && seen.add(item))
}

const normalizeText = (value) => String(value || '').trim().toLowerCase()

const isOrderEmailEligible = (order = {}) => {
  const paymentMethod = normalizeText(order.paymentMethod)
  const paymentStatus = normalizeText(order.paymentStatus)
  const orderStatus = normalizeText(order.status)

  if (paymentMethod === 'cod') return true

  return (
    paymentStatus === 'success' ||
    paymentStatus === 'paid' ||
    orderStatus === 'paid'
  )
}

const escapeHtml = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const escapeAttribute = (value) => escapeHtml(value).replace(/`/g, '&#96;')

const formatAddress = (address = {}) => {
  if (typeof address === 'string') return address
  const cityStateZip = [address.city, address.state, address.zip]
    .filter(Boolean)
    .join(' ')

  return [address.name, address.line1, cityStateZip, address.phone]
    .filter(Boolean)
    .join(', ')
}

const formatPrice = (value) => {
  const amount = Number(value || 0)
  if (!Number.isFinite(amount)) return 'INR 0.00'
  return `INR ${amount.toFixed(2)}`
}

const getOrderDate = (createdAt) => {
  if (typeof createdAt?.toDate === 'function') return createdAt.toDate().toLocaleString()
  if (createdAt) return new Date(createdAt).toLocaleString()
  return new Date().toLocaleString()
}

const resolveOrderProduct = (order) => {
  const firstItem = Array.isArray(order.items) ? order.items[0] || {} : {}
  const hasOfferPrice =
    typeof firstItem.offerPrice === 'number' &&
    typeof firstItem.price === 'number' &&
    firstItem.offerPrice < firstItem.price
  const itemPrice = hasOfferPrice ? firstItem.offerPrice : firstItem.price

  return {
    name: order.productName || firstItem.name || 'Product',
    price: order.productPrice || itemPrice || 0,
    image: order.productImage || firstItem.image || '',
  }
}

const applyTemplate = (template, tokens) =>
  String(template || '').replace(/\{\{(\w+)\}\}/g, (_, key) => tokens[key] ?? '')

const normalizeTemplateHtml = (value) =>
  String(value || '').replace(/\r\n|\r|\n/g, '<br />')

const wrapEmailHtml = ({ title, bodyHtml, productImage }) => {
  const imageBlock =
    productImage && /^https?:\/\//i.test(productImage)
      ? `
      <div style="margin: 0 0 16px 0;">
        <img src="${escapeAttribute(productImage)}" alt="Product" style="max-width: 160px; border-radius: 8px; border: 1px solid #e5e7eb;" />
      </div>
    `
      : ''

  return `
    <div style="background: #f8f8f8; padding: 20px;">
      <div style="max-width: 700px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 24px; font-family: Arial, sans-serif; color: #111827; border: 1px solid #e5e7eb;">
        <h2 style="margin: 0 0 8px 0;">${escapeHtml(title)}</h2>
        <p style="margin: 0 0 16px 0; color: #6b7280;">Illusion Jewellery</p>
        ${imageBlock}
        ${bodyHtml}
      </div>
    </div>
  `
}

const getMailTransporter = () => {
  const user = EMAIL_USER.value()
  const pass = EMAIL_PASS.value()

  if (!user || !pass) return null

  const nextKey = `${user}:${pass}`
  if (!cachedTransporter || cachedTransporterKey !== nextKey) {
    cachedTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    })
    cachedTransporterKey = nextKey
  }

  return cachedTransporter
}

const getEmailSettingsAndTemplates = async () => {
  const [settingsSnapshot, adminTemplateSnapshot, customerTemplateSnapshot] =
    await Promise.all([
      notificationSettingsRef.get(),
      adminTemplateRef.get(),
      customerTemplateRef.get(),
    ])

  const settings = settingsSnapshot.exists ? settingsSnapshot.data() || {} : {}
  const adminRecipients = sanitizeEmails([
    ADMIN_EMAIL.value(),
    ...(Array.isArray(settings.adminRecipientEmails)
      ? settings.adminRecipientEmails
      : []),
  ])

  return {
    settings: {
      adminEnabled: settings.adminEnabled !== false,
      customerEnabled: settings.customerEnabled !== false,
      adminRecipients,
    },
    adminTemplate: adminTemplateSnapshot.exists
      ? { ...defaultAdminTemplate, ...adminTemplateSnapshot.data() }
      : defaultAdminTemplate,
    customerTemplate: customerTemplateSnapshot.exists
      ? { ...defaultCustomerTemplate, ...customerTemplateSnapshot.data() }
      : defaultCustomerTemplate,
  }
}

const sendMail = async ({ to, subject, html }) => {
  const transporter = getMailTransporter()
  if (!transporter) {
    console.warn('Email transporter is not configured. Skipping send.')
    return false
  }

  const recipients = sanitizeEmails(to)
  if (!recipients.length) return false

  await transporter.sendMail({
    from: EMAIL_USER.value(),
    to: recipients,
    subject,
    html,
  })

  return true
}

const sendAdminEmail = async (order, orderId, config) => {
  if (!config.settings.adminEnabled) return false
  if (!config.settings.adminRecipients.length) return false

  const product = resolveOrderProduct(order)
  const paymentId =
    order.razorpay_payment_id || order.paymentId || order.paymentStatus || 'Pending'
  const customerAddress = formatAddress(order.address || order.customerAddress) || '-'
  const customerEmail =
    order.userEmail || order.customerEmail || order.email || order.user?.email || '-'
  const itemsSummary = Array.isArray(order.items)
    ? order.items
        .map((item) => `${item.name || 'Item'} x${item.quantity || 1}`)
        .join(', ')
    : ''

  const tokens = {
    orderId: escapeHtml(orderId),
    orderNumber: escapeHtml(order.orderNumber || orderId),
    productName: escapeHtml(product.name),
    productPrice: escapeHtml(formatPrice(product.price)),
    customerName: escapeHtml(order.customerName || 'Customer'),
    customerEmail: escapeHtml(customerEmail),
    customerAddress: escapeHtml(customerAddress),
    shippingAddress: escapeHtml(customerAddress),
    paymentId: escapeHtml(paymentId),
    paymentMethod: escapeHtml(order.paymentMethod || '-'),
    paymentStatus: escapeHtml(order.paymentStatus || '-'),
    orderStatus: escapeHtml(order.status || 'Processing'),
    orderTotal: escapeHtml(formatPrice(order.total || order.amount || 0)),
    itemsSummary: escapeHtml(itemsSummary || '-'),
    orderDate: escapeHtml(getOrderDate(order.createdAt)),
  }

  const subject = applyTemplate(config.adminTemplate.subject, tokens)
    .replace(/\s+/g, ' ')
    .trim()
  const body = normalizeTemplateHtml(applyTemplate(config.adminTemplate.body, tokens))

  return sendMail({
    to: config.settings.adminRecipients,
    subject,
    html: wrapEmailHtml({
      title: '\u{1F6D2} New Order Received',
      bodyHtml: body,
      productImage: product.image,
    }),
  })
}

const sendCustomerEmail = async (order, orderId, config) => {
  if (!config.settings.customerEnabled) return false

  const customerEmail =
    order.userEmail || order.customerEmail || order.email || order.user?.email || ''
  if (!customerEmail) return false

  const product = resolveOrderProduct(order)
  const paymentId =
    order.razorpay_payment_id || order.paymentId || order.paymentStatus || 'Pending'

  const tokens = {
    orderId: escapeHtml(orderId),
    orderNumber: escapeHtml(order.orderNumber || orderId),
    productName: escapeHtml(product.name),
    productPrice: escapeHtml(formatPrice(product.price)),
    customerName: escapeHtml(order.customerName || 'Customer'),
    customerEmail: escapeHtml(customerEmail),
    customerAddress: escapeHtml(
      formatAddress(order.address || order.customerAddress) || '-'
    ),
    shippingAddress: escapeHtml(
      formatAddress(order.address || order.customerAddress) || '-'
    ),
    paymentId: escapeHtml(paymentId),
    paymentMethod: escapeHtml(order.paymentMethod || '-'),
    paymentStatus: escapeHtml(order.paymentStatus || '-'),
    orderStatus: escapeHtml(order.status || 'Processing'),
    orderTotal: escapeHtml(formatPrice(order.total || order.amount || 0)),
    orderDate: escapeHtml(getOrderDate(order.createdAt)),
  }

  const subject = applyTemplate(config.customerTemplate.subject, tokens)
    .replace(/\s+/g, ' ')
    .trim()
  const body = normalizeTemplateHtml(applyTemplate(config.customerTemplate.body, tokens))

  return sendMail({
    to: customerEmail,
    subject,
    html: wrapEmailHtml({
      title: 'Order Confirmation \u2013 Illusion Jewellery',
      bodyHtml: body,
      productImage: product.image,
    }),
  })
}

exports.onOrderCreated = onDocumentWritten(
  {
    region: 'asia-south1',
    document: 'orders/{orderId}',
    secrets: [EMAIL_USER, EMAIL_PASS, ADMIN_EMAIL],
  },
  async (event) => {
    const afterSnapshot = event.data?.after
    if (!afterSnapshot?.exists) return

    const beforeSnapshot = event.data?.before
    const previousOrder = beforeSnapshot?.exists ? beforeSnapshot.data() || {} : {}
    const order = afterSnapshot.data() || {}
    const orderId = event.params.orderId

    const eligibleBefore = isOrderEmailEligible(previousOrder)
    const eligibleAfter = isOrderEmailEligible(order)
    if (!eligibleAfter) return

    const shouldRetryMissing =
      (!order.adminNotificationSentAt && normalizeText(order.paymentMethod) === 'cod') ||
      !order.adminNotificationSentAt ||
      !order.customerNotificationSentAt

    if (eligibleBefore && !shouldRetryMissing) return

    const updates = {}

    try {
      const config = await getEmailSettingsAndTemplates()
      const shouldSendAdmin =
        config.settings.adminEnabled && !order.adminNotificationSentAt
      const shouldSendCustomer =
        config.settings.customerEnabled && !order.customerNotificationSentAt

      if (!shouldSendAdmin && !shouldSendCustomer) return

      const [adminResult, customerResult] = await Promise.allSettled([
        shouldSendAdmin
          ? sendAdminEmail(order, orderId, config)
          : Promise.resolve(false),
        shouldSendCustomer
          ? sendCustomerEmail(order, orderId, config)
          : Promise.resolve(false),
      ])

      if (shouldSendAdmin && adminResult.status === 'fulfilled' && adminResult.value) {
        updates.adminNotificationSentAt = serverTimestamp()
      }
      if (
        shouldSendCustomer &&
        customerResult.status === 'fulfilled' &&
        customerResult.value
      ) {
        updates.customerNotificationSentAt = serverTimestamp()
      }

      if (shouldSendAdmin && adminResult.status === 'rejected') {
        console.error('Admin order email failed', adminResult.reason)
      }
      if (shouldSendCustomer && customerResult.status === 'rejected') {
        console.error('Customer order email failed', customerResult.reason)
      }
    } catch (error) {
      console.error('Order email trigger failed', error)
    }

    if (Object.keys(updates).length) {
      await afterSnapshot.ref.set(
        {
          ...updates,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
    }
  }
)

const createRazorpayClient = () =>
  new Razorpay({
    key_id: RAZORPAY_KEY_ID.value(),
    key_secret: RAZORPAY_KEY_SECRET.value(),
  })

const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({ error: message })
}

const signaturesMatch = (signature, expectedSignature) => {
  if (!signature || signature.length !== expectedSignature.length) return false

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'utf8'),
    Buffer.from(expectedSignature, 'utf8')
  )
}

const app = express()
app.use(cors({ origin: true }))
app.use(express.json())

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
      keyId: RAZORPAY_KEY_ID.value(),
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
      .createHmac('sha256', RAZORPAY_KEY_SECRET.value())
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (!signaturesMatch(razorpay_signature, expectedSignature)) {
      return sendError(res, 400, 'Payment verification failed')
    }

    const razorpay = createRazorpayClient()
    const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id)
    const internalOrderId = String(orderId || razorpayOrder.receipt || razorpay_order_id)

    const orderRef = db.collection('orders').doc(internalOrderId)
    const existingOrder = await orderRef.get()
    const timestamp = serverTimestamp()
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
    secrets: [RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET],
  },
  app
)
