import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import Card from '../components/ui/Card'
import { getCareerEnquiries } from '../services/enquiryService'

const formatDate = (value) => {
  if (!value) return '-'
  if (typeof value?.toDate === 'function') return value.toDate().toLocaleString()
  return new Date(value).toLocaleString()
}

const AdminCareers = () => {
  const location = useLocation()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState([])

  useEffect(() => {
    let mounted = true

    const loadItems = async () => {
      setLoading(true)
      try {
        const data = await getCareerEnquiries()
        if (!mounted) return
        setItems(data)
      } catch (error) {
        if (mounted) toast.error(error?.message ?? 'Failed to load career enquiries')
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadItems()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!location.hash) return
    const id = location.hash.replace('#', '')
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [location.hash, items.length])

  return (
    <AdminLayout
      title="Careers"
      subtitle="View all career enquiries and applicant details."
    >
      {loading ? (
        <Card className="text-sm text-illusion-black/60">Loading career enquiries...</Card>
      ) : items.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <Card
              key={item.id}
              id={`career-${item.id}`}
              className="space-y-3 border border-illusion-black/10 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-illusion-black">{item.name || 'Applicant'}</p>
                  <p className="text-xs text-illusion-black/60">{item.email || '-'}</p>
                </div>
                <p className="text-xs text-illusion-black/50">{formatDate(item.createdAt)}</p>
              </div>
              <div className="grid gap-2 text-sm text-illusion-black/70 md:grid-cols-2">
                <p>
                  <span className="font-medium text-illusion-black">Phone:</span> {item.phone || '-'}
                </p>
                <p>
                  <span className="font-medium text-illusion-black">Role:</span> {item.role || '-'}
                </p>
                <p>
                  <span className="font-medium text-illusion-black">Status:</span> {item.status || 'new'}
                </p>
              </div>
              <div className="rounded-2xl border border-illusion-black/10 bg-white p-3 text-sm text-illusion-black/70">
                <p className="font-medium text-illusion-black">Message</p>
                <p className="mt-1 whitespace-pre-line">{item.message || '-'}</p>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-sm text-illusion-black/60">No career enquiries yet.</Card>
      )}
    </AdminLayout>
  )
}

export default AdminCareers
