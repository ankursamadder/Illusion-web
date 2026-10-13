import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../firebase/config'

const ADMINS_COLLECTION = 'admins'

export const defaultPermissions = {
  canManageProducts: true,
  canManageOrders: true,
  canManageUsers: true,
  canManageSettings: true,
  canManagePromotions: true,
  canManageCoupons: true,
}

export const rolePresetPermissions = {
  superadmin: {
    canManageProducts: true,
    canManageOrders: true,
    canManageUsers: true,
    canManageSettings: true,
    canManagePromotions: true,
    canManageCoupons: true,
  },
  admin: {
    canManageProducts: true,
    canManageOrders: true,
    canManageUsers: true,
    canManageSettings: false,
    canManagePromotions: true,
    canManageCoupons: true,
  },
  manager: {
    canManageProducts: true,
    canManageOrders: true,
    canManageUsers: false,
    canManageSettings: false,
    canManagePromotions: true,
    canManageCoupons: true,
  },
  editor: {
    canManageProducts: true,
    canManageOrders: false,
    canManageUsers: false,
    canManageSettings: false,
    canManagePromotions: true,
    canManageCoupons: false,
  },
}

export const getAdmins = async () => {
  const snapshot = await getDocs(collection(db, ADMINS_COLLECTION))
  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }))
}

export const updateAdminAccess = async (adminId, updates) => {
  const adminRef = doc(db, ADMINS_COLLECTION, adminId)
  await setDoc(
    adminRef,
    {
      ...updates,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  )
}

export const deleteAdmin = async (adminId) => {
  const adminRef = doc(db, ADMINS_COLLECTION, adminId)
  await deleteDoc(adminRef)
}

export const addAdminUser = async ({
  email,
  name = '',
  role = 'admin',
  permissions = defaultPermissions,
  status = 'active',
}) => {
  const cleanEmail = email.trim().toLowerCase()
  // Use a predictable or auto-generated id
  const adminRef = doc(collection(db, ADMINS_COLLECTION))
  const payload = {
    email: cleanEmail,
    name: name.trim() || cleanEmail.split('@')[0],
    role,
    status,
    permissions: {
      ...defaultPermissions,
      ...(permissions || {}),
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  }
  await setDoc(adminRef, payload)
  return { id: adminRef.id, ...payload }
}
