import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, collections } from '../firebase/firebase'
import { formatCurrency } from '../utils/formatCurrency'

const orderEmailSettingsRef = doc(db, collections.notificationSettings, 'orderEmails')
const adminNewOrderTemplateRef = doc(db, collections.mailTemplates, 'adminNewOrder')
const customerOrderTemplateRef = doc(db, collections.mailTemplates, 'customerOrder')
const mailQueueRef = collection(db, collections.mail)

const defaultSettings = {
  adminEnabled: true,
  adminRecipientEmails: [],
  customerEnabled: false,
}

const defaultAdminTemplate = {
  subject: 'New Order {{orderNumber}} placed',
  body: `A new order has been placed.\n\nOrder Number: {{orderNumber}}\nCustomer: {{customerName}}\nEmail: {{customerEmail}}\nAddress: {{shippingAddress}}\nAmount: {{orderTotal}}\nPayment Method: {{paymentMethod}}\nPayment Status: {{paymentStatus}}\nItems: {{itemsSummary}}\nDate: {{orderDate}}`,
}

const defaultCustomerTemplate = {
  subject: 'Order Confirmation {{orderNumber}}',
  body: `Hello {{customerName}},\n\nYour order {{orderNumber}} is confirmed.\nAmount: {{orderTotal}}\nStatus: {{orderStatus}}\n\nThank you for shopping with us.`,
}

const normalizeTemplate = (template, fallback) => ({
  subject: String(template?.subject ?? fallback.subject),
  body: String(template?.body ?? fallback.body),
})

const sanitizeEmails = (emails = []) => {
  const seen = new Set()
  return emails
    .map((email) => String(email ?? '').trim().toLowerCase())
    .filter((email) => email && !seen.has(email) && seen.add(email))
}

const applyTemplate = (input, tokens) => {
  return String(input).replace(/\{\{(\w+)\}\}/g, (_, key) => tokens[key] ?? '')
}

const toHtmlMessage = (value) => value.replace(/\n/g, '<br />')

export const getOrderEmailNotificationConfig = async () => {
  const [settingsSnapshot, adminTemplateSnapshot, customerTemplateSnapshot] =
    await Promise.all([
      getDoc(orderEmailSettingsRef),
      getDoc(adminNewOrderTemplateRef),
      getDoc(customerOrderTemplateRef),
    ])

  const settings = settingsSnapshot.exists()
    ? { ...defaultSettings, ...settingsSnapshot.data() }
    : defaultSettings

  return {
    settings: {
      ...settings,
      adminRecipientEmails: sanitizeEmails(settings.adminRecipientEmails),
    },
    adminTemplate: normalizeTemplate(
      adminTemplateSnapshot.exists() ? adminTemplateSnapshot.data() : null,
      defaultAdminTemplate
    ),
    customerTemplate: normalizeTemplate(
      customerTemplateSnapshot.exists() ? customerTemplateSnapshot.data() : null,
      defaultCustomerTemplate
    ),
  }
}

export const saveOrderEmailNotificationSettings = async (payload) => {
  await setDoc(
    orderEmailSettingsRef,
    {
      adminEnabled: payload.adminEnabled === true,
      adminRecipientEmails: sanitizeEmails(payload.adminRecipientEmails),
      customerEnabled: payload.customerEnabled === true,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export const saveAdminOrderTemplate = async (payload) => {
  await setDoc(
    adminNewOrderTemplateRef,
    {
      subject: String(payload.subject ?? '').trim(),
      body: String(payload.body ?? ''),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export const saveCustomerOrderTemplate = async (payload) => {
  await setDoc(
    customerOrderTemplateRef,
    {
      subject: String(payload.subject ?? '').trim(),
      body: String(payload.body ?? ''),
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export const queueEmailNotification = async ({ to, subject, html }) => {
  const recipients = Array.isArray(to) ? to : [to]
  const sanitizedRecipients = sanitizeEmails(recipients)
  if (!sanitizedRecipients.length) return

  await addDoc(mailQueueRef, {
    to: sanitizedRecipients,
    message: {
      subject: String(subject ?? '').trim(),
      html: String(html ?? ''),
    },
    createdAt: serverTimestamp(),
  })
}

export const sendAdminNewOrderEmail = async (order) => {
  const { settings, adminTemplate } = await getOrderEmailNotificationConfig()

  if (!settings.adminEnabled) return
  if (!settings.adminRecipientEmails.length) return

  const itemsSummary = (order.items ?? [])
    .map((item) => `${item.name ?? 'Item'} x${item.quantity ?? 1}`)
    .join(', ')
  const shippingAddress = [
    order.address?.name,
    order.address?.line1,
    [order.address?.city, order.address?.state, order.address?.zip]
      .filter(Boolean)
      .join(' '),
    order.address?.phone,
  ]
    .filter(Boolean)
    .join(', ')

  const orderDate = new Date().toLocaleString()
  const tokens = {
    orderNumber: order.orderNumber ?? order.id ?? '',
    customerName: order.customerName ?? 'Customer',
    customerEmail: order.email ?? '',
    orderTotal: formatCurrency(order.total ?? 0),
    paymentMethod: order.paymentMethod ?? '-',
    paymentStatus: order.paymentStatus ?? '-',
    orderStatus: order.status ?? '-',
    itemsSummary: itemsSummary || '-',
    shippingAddress: shippingAddress || '-',
    orderDate,
  }

  const subject = applyTemplate(adminTemplate.subject, tokens)
  const body = toHtmlMessage(applyTemplate(adminTemplate.body, tokens))

  await queueEmailNotification({
    to: settings.adminRecipientEmails,
    subject,
    html: body,
  })
}

const emailNotificationService = {
  getOrderEmailNotificationConfig,
  saveOrderEmailNotificationSettings,
  saveAdminOrderTemplate,
  saveCustomerOrderTemplate,
  queueEmailNotification,
  sendAdminNewOrderEmail,
}

export default emailNotificationService
