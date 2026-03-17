import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import AdminLayout from './AdminLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import { db, collections } from '../firebase/firebase'
import { getProducts } from '../services/productService'
import { formatCurrency } from '../utils/formatCurrency'

const couponsRef = collection(db, collections.coupons)

const formatDate = (value) => {
  if (!value) return '-'
  if (typeof value?.toDate === 'function') {
    return value.toDate().toLocaleString()
  }
  return new Date(value).toLocaleString()
}

const getDiscountLabel = (coupon) => {
  if (coupon.discountType === 'percentage') {
    return `${coupon.discountValue ?? 0}%`
  }
  return formatCurrency(coupon.discountValue ?? 0)
}

const AdminCoupons = () => {
  const [products, setProducts] = useState([])
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [code, setCode] = useState('')
  const [productId, setProductId] = useState('all')
  const [discountType, setDiscountType] = useState('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('')
  const [showAddCouponForm, setShowAddCouponForm] = useState(false)

  const activeProducts = useMemo(
    () => products.filter((item) => item.active !== false),
    [products]
  )

  const loadData = async () => {
    setLoading(true)
    try {
      const [productItems, couponSnapshot] = await Promise.all([
        getProducts(),
        getDocs(query(couponsRef, orderBy('createdAt', 'desc'))),
      ])

      setProducts(productItems)
      setCoupons(couponSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
    } catch (error) {
      toast.error(error?.message ?? 'Failed to load coupons')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreateCoupon = async (event) => {
    event.preventDefault()

    const normalizedCode = code.trim().toUpperCase()
    const parsedDiscount = Number(discountValue)
    const parsedMaxAmount = Number(maxDiscountAmount)

    if (!normalizedCode) {
      toast.error('Coupon code is required')
      return
    }

    if (!productId) {
      toast.error('Please select coupon scope')
      return
    }

    if (Number.isNaN(parsedDiscount) || parsedDiscount <= 0) {
      toast.error('Discount amount must be greater than 0')
      return
    }

    if (discountType === 'percentage' && parsedDiscount > 100) {
      toast.error('Percentage discount cannot exceed 100')
      return
    }

    if (Number.isNaN(parsedMaxAmount) || parsedMaxAmount <= 0) {
      toast.error('Max amount must be greater than 0')
      return
    }

    const appliesToAll = productId === 'all'
    const selectedProduct = appliesToAll
      ? null
      : products.find((item) => item.id === productId)

    if (!appliesToAll && !selectedProduct) {
      toast.error('Selected product not found')
      return
    }

    const duplicate = coupons.find((item) => item.code === normalizedCode)
    if (duplicate) {
      toast.error('Coupon code already exists')
      return
    }

    setSaving(true)
    try {
      await addDoc(couponsRef, {
        code: normalizedCode,
        appliesToAll,
        productId: appliesToAll ? null : selectedProduct.id,
        productName: appliesToAll ? 'All Products' : selectedProduct.name ?? '',
        discountType,
        discountValue: parsedDiscount,
        maxDiscountAmount: parsedMaxAmount,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      toast.success('Coupon added')
      setCode('')
      setProductId('all')
      setDiscountType('percentage')
      setDiscountValue('')
      setMaxDiscountAmount('')
      setShowAddCouponForm(false)
      await loadData()
    } catch (error) {
      toast.error(error?.message ?? 'Failed to create coupon')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleCoupon = async (coupon) => {
    try {
      await updateDoc(doc(db, collections.coupons, coupon.id), {
        active: coupon.active !== true,
        updatedAt: serverTimestamp(),
      })
      toast.success('Coupon status updated')
      await loadData()
    } catch (error) {
      toast.error(error?.message ?? 'Failed to update coupon')
    }
  }

  const handleDeleteCoupon = async (coupon) => {
    const confirmed = window.confirm(`Delete coupon "${coupon.code}"?`)
    if (!confirmed) return

    try {
      await deleteDoc(doc(db, collections.coupons, coupon.id))
      toast.success('Coupon deleted')
      await loadData()
    } catch (error) {
      toast.error(error?.message ?? 'Failed to delete coupon')
    }
  }

  return (
    <AdminLayout
      title="Manage Coupons"
      subtitle="Create coupon codes for all products or a single product."
    >
      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-illusion-black">Add Coupon</h3>
          <Button
            type="button"
            variant={showAddCouponForm ? 'secondary' : 'primary'}
            onClick={() => setShowAddCouponForm((prev) => !prev)}
          >
            {showAddCouponForm ? 'Close' : 'Add Coupon'}
          </Button>
        </div>

        {showAddCouponForm ? (
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-3" onSubmit={handleCreateCoupon}>
            <Input
              label="Coupon code"
              placeholder="e.g. RING10"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              maxLength={30}
            />

            <label className="flex w-full flex-col gap-2 text-sm">
              <span className="font-medium text-illusion-black">Apply coupon to</span>
              <select
                className="w-full rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black shadow-soft outline-none focus:border-illusion-pink focus:ring-2 focus:ring-illusion-blush"
                value={productId}
                onChange={(event) => setProductId(event.target.value)}
              >
                <option value="all">All Products</option>
                {activeProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex w-full flex-col gap-2 text-sm">
              <span className="font-medium text-illusion-black">Discount type</span>
              <select
                className="w-full rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black shadow-soft outline-none focus:border-illusion-pink focus:ring-2 focus:ring-illusion-blush"
                value={discountType}
                onChange={(event) => setDiscountType(event.target.value)}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed</option>
              </select>
            </label>

            <Input
              label={discountType === 'percentage' ? 'Discount (%)' : 'Discount (fixed)'}
              type="number"
              min="0"
              step="0.01"
              value={discountValue}
              onChange={(event) => setDiscountValue(event.target.value)}
              placeholder={discountType === 'percentage' ? 'e.g. 10' : 'e.g. 199'}
            />

            <Input
              label="Max Amount"
              type="number"
              min="0"
              step="0.01"
              value={maxDiscountAmount}
              onChange={(event) => setMaxDiscountAmount(event.target.value)}
              placeholder="e.g. 500"
            />

            <div className="flex items-end">
              <Button type="submit" disabled={saving || loading} className="w-full md:w-auto">
                {saving ? 'Adding...' : 'Add Coupon'}
              </Button>
            </div>
          </form>
        ) : null}
      </Card>

      {loading ? (
        <Card className="text-sm text-illusion-black/60">Loading coupons...</Card>
      ) : coupons.length ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-illusion-blush/30">
                <tr>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Coupon
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Product
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Discount
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Max Amount
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Status
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Created
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="border-b border-illusion-black/10">
                    <td className="px-3 py-3 text-sm font-semibold text-illusion-black">
                      {coupon.code}
                    </td>
                    <td className="px-3 py-3 text-sm text-illusion-black/80">
                      {coupon.productName ?? '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-illusion-black/80">
                      {getDiscountLabel(coupon)}
                    </td>
                    <td className="px-3 py-3 text-sm text-illusion-black/80">
                      {formatCurrency(coupon.maxDiscountAmount ?? 0)}
                    </td>
                    <td className="px-3 py-3 text-sm text-illusion-black/80">
                      <Badge variant={coupon.active === false ? 'outline' : 'soft'}>
                        {coupon.active === false ? 'Inactive' : 'Active'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-xs text-illusion-black/60">
                      {formatDate(coupon.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleToggleCoupon(coupon)}
                        >
                          {coupon.active === false ? 'Activate' : 'Deactivate'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="border border-red-200 text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteCoupon(coupon)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="text-sm text-illusion-black/60">No coupons added yet.</Card>
      )}
    </AdminLayout>
  )
}

export default AdminCoupons
