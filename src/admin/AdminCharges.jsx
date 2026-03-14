import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import AdminLayout from './AdminLayout'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import { db, collections } from '../firebase/firebase'
import { formatCurrency } from '../utils/formatCurrency'

const chargesDocRef = doc(db, collections.charges, 'default')

const formatDate = (value) => {
  if (!value) return '-'
  if (typeof value?.toDate === 'function') return value.toDate().toLocaleString()
  return new Date(value).toLocaleString()
}

const AdminCharges = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [taxPercentage, setTaxPercentage] = useState('')
  const [shippingCharge, setShippingCharge] = useState('')
  const [platformCharge, setPlatformCharge] = useState('')
  const [updatedAt, setUpdatedAt] = useState(null)

  const loadCharges = async () => {
    setLoading(true)
    try {
      const snapshot = await getDoc(chargesDocRef)
      if (snapshot.exists()) {
        const data = snapshot.data()
        setTaxPercentage(String(data.taxPercentage ?? ''))
        setShippingCharge(String(data.shippingCharge ?? ''))
        setPlatformCharge(String(data.platformCharge ?? ''))
        setUpdatedAt(data.updatedAt ?? null)
      }
    } catch (error) {
      toast.error(error?.message ?? 'Failed to load charges')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCharges()
  }, [])

  const preview = useMemo(() => {
    const base = 1000
    const tax = Number(taxPercentage) || 0
    const shipping = Number(shippingCharge) || 0
    const platform = Number(platformCharge) || 0
    const taxAmount = (base * tax) / 100

    return {
      base,
      taxAmount,
      shipping,
      platform,
      total: base + taxAmount + shipping + platform,
    }
  }, [taxPercentage, shippingCharge, platformCharge])

  const handleSave = async (event) => {
    event.preventDefault()

    const taxValue = Number(taxPercentage)
    const shippingValue = Number(shippingCharge)
    const platformValue = Number(platformCharge)

    if (Number.isNaN(taxValue) || taxValue < 0) {
      toast.error('Tax percentage must be 0 or higher')
      return
    }

    if (Number.isNaN(shippingValue) || shippingValue < 0) {
      toast.error('Shipping charge must be 0 or higher')
      return
    }

    if (Number.isNaN(platformValue) || platformValue < 0) {
      toast.error('Platform charge must be 0 or higher')
      return
    }

    setSaving(true)
    try {
      const payload = {
        taxPercentage: taxValue,
        shippingCharge: shippingValue,
        platformCharge: platformValue,
        updatedAt: serverTimestamp(),
      }

      if (!updatedAt) {
        payload.createdAt = serverTimestamp()
      }

      await setDoc(
        chargesDocRef,
        payload,
        { merge: true }
      )
      toast.success('Charges updated')
      await loadCharges()
    } catch (error) {
      toast.error(error?.message ?? 'Failed to save charges')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout
      title="Manage Charges"
      subtitle="Configure checkout tax and fixed platform charges."
    >
      <form className="grid gap-4 lg:grid-cols-[1.2fr_1fr]" onSubmit={handleSave}>
        <Card className="space-y-4">
          <Input
            label="Tax (%)"
            type="number"
            min="0"
            step="0.01"
            value={taxPercentage}
            onChange={(event) => setTaxPercentage(event.target.value)}
            placeholder="e.g. 18"
          />

          <Input
            label="Shipping Charge (fixed)"
            type="number"
            min="0"
            step="0.01"
            value={shippingCharge}
            onChange={(event) => setShippingCharge(event.target.value)}
            placeholder="e.g. 79"
          />

          <Input
            label="Platform Charge (fixed)"
            type="number"
            min="0"
            step="0.01"
            value={platformCharge}
            onChange={(event) => setPlatformCharge(event.target.value)}
            placeholder="e.g. 29"
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-illusion-black/50">
              Last updated: {formatDate(updatedAt)}
            </p>
            <Button type="submit" disabled={saving || loading}>
              {saving ? 'Saving...' : 'Save Charges'}
            </Button>
          </div>
        </Card>

        <Card className="space-y-3">
          <h3 className="text-lg font-semibold text-illusion-black">Preview</h3>
          <p className="text-sm text-illusion-black/60">
            Example for base product price {formatCurrency(preview.base)}
          </p>

          <div className="space-y-2 text-sm text-illusion-black/70">
            <div className="flex items-center justify-between">
              <span>Tax ({Number(taxPercentage) || 0}%)</span>
              <span>{formatCurrency(preview.taxAmount)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping (fixed)</span>
              <span>{formatCurrency(preview.shipping)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Platform (fixed)</span>
              <span>{formatCurrency(preview.platform)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-illusion-black/10 pt-2 font-semibold text-illusion-black">
              <span>Total</span>
              <span>{formatCurrency(preview.total)}</span>
            </div>
          </div>
        </Card>
      </form>
    </AdminLayout>
  )
}

export default AdminCharges
