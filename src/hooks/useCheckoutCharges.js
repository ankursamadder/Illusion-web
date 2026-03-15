import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { doc, getDoc } from 'firebase/firestore'
import { db, collections } from '../firebase/firebase'

const defaultCharges = {
  taxPercentage: 0,
  shippingCharge: 0,
  platformCharge: 0,
}

const useCheckoutCharges = () => {
  const [loading, setLoading] = useState(true)
  const [charges, setCharges] = useState(defaultCharges)

  useEffect(() => {
    let mounted = true

    const loadCharges = async () => {
      setLoading(true)
      try {
        const snapshot = await getDoc(doc(db, collections.charges, 'default'))
        if (!mounted) return

        if (!snapshot.exists()) {
          setCharges(defaultCharges)
          return
        }

        const data = snapshot.data()
        setCharges({
          taxPercentage: Number(data.taxPercentage) || 0,
          shippingCharge: Number(data.shippingCharge) || 0,
          platformCharge: Number(data.platformCharge) || 0,
        })
      } catch (error) {
        if (mounted) {
          toast.error(error?.message ?? 'Failed to load charges')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadCharges()

    return () => {
      mounted = false
    }
  }, [])

  return { charges, chargesLoading: loading }
}

export default useCheckoutCharges
