import { getAnalytics } from 'firebase/analytics'
import { getStorage } from 'firebase/storage'
import { app, auth, db } from './config'

const analytics = typeof window !== 'undefined' ? getAnalytics(app) : undefined
const storage = getStorage(app)

const collections = {
  users: 'users',
  products: 'products',
  orders: 'orders',
  reviews: 'reviews',
  coupons: 'coupons',
  charges: 'charges',
  addresses: 'addresses',
}

export { app, auth, db, storage, analytics, collections }
