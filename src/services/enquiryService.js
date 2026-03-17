import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from 'firebase/firestore'
import { db, collections } from '../firebase/firebase'

const contactEnquiriesRef = collection(db, collections.contactEnquiries)
const careerEnquiriesRef = collection(db, collections.careerEnquiries)

const mapSnapshot = (snapshot) => {
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

const sortByCreatedAtDesc = (items) => {
  return [...items].sort((a, b) => {
    const aTime =
      typeof a.createdAt?.toDate === 'function'
        ? a.createdAt.toDate().getTime()
        : new Date(a.createdAt ?? 0).getTime()
    const bTime =
      typeof b.createdAt?.toDate === 'function'
        ? b.createdAt.toDate().getTime()
        : new Date(b.createdAt ?? 0).getTime()
    return bTime - aTime
  })
}

export const createContactEnquiry = async (payload) => {
  await addDoc(contactEnquiriesRef, {
    ...payload,
    status: 'new',
    createdAt: serverTimestamp(),
  })
}

export const createCareerEnquiry = async (payload) => {
  await addDoc(careerEnquiriesRef, {
    ...payload,
    status: 'new',
    createdAt: serverTimestamp(),
  })
}

export const getRecentContactEnquiries = async (max = 5) => {
  const snapshot = await getDocs(
    query(contactEnquiriesRef, orderBy('createdAt', 'desc'), limit(max))
  )
  return mapSnapshot(snapshot)
}

export const getRecentCareerEnquiries = async (max = 5) => {
  const snapshot = await getDocs(
    query(careerEnquiriesRef, orderBy('createdAt', 'desc'), limit(max))
  )
  return mapSnapshot(snapshot)
}

export const getContactEnquiries = async () => {
  const snapshot = await getDocs(
    query(contactEnquiriesRef, orderBy('createdAt', 'desc'))
  )
  return mapSnapshot(snapshot)
}

export const getCareerEnquiries = async () => {
  const snapshot = await getDocs(
    query(careerEnquiriesRef, orderBy('createdAt', 'desc'))
  )
  return mapSnapshot(snapshot)
}

export const getAdminNotifications = async (orders = [], max = 8) => {
  const [contactItems, careerItems] = await Promise.all([
    getRecentContactEnquiries(max),
    getRecentCareerEnquiries(max),
  ])

  const orderItems = orders.slice(0, max).map((order) => ({
    id: order.id,
    type: 'order',
    title: `New order #${order.orderNumber ?? order.id?.slice(0, 8) ?? ''}`,
    detail: order.customerName || order.email || 'Order placed',
    createdAt: order.createdAt ?? null,
    href: `/admin/orders#order-${order.id}`,
  }))

  const notifications = [
    ...orderItems,
    ...contactItems.map((item) => ({
      id: item.id,
      type: 'contact',
      title: 'New contact enquiry',
      detail: `${item.name ?? 'Customer'}${item.email ? ` (${item.email})` : ''}`,
      createdAt: item.createdAt ?? null,
      href: `/admin/enquiries#contact-${item.id}`,
    })),
    ...careerItems.map((item) => ({
      id: item.id,
      type: 'career',
      title: 'New career enquiry',
      detail: `${item.name ?? 'Applicant'}${item.role ? ` - ${item.role}` : ''}`,
      createdAt: item.createdAt ?? null,
      href: `/admin/enquiries#career-${item.id}`,
    })),
  ]

  return sortByCreatedAtDesc(notifications).slice(0, max)
}

const enquiryService = {
  createContactEnquiry,
  createCareerEnquiry,
  getRecentContactEnquiries,
  getRecentCareerEnquiries,
  getContactEnquiries,
  getCareerEnquiries,
  getAdminNotifications,
}

export default enquiryService
