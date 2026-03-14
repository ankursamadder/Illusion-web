import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Badge from '../components/ui/Badge'
import { getProducts } from '../services/productService'
import {
  addReview,
  deleteReview,
  getReviews,
  updateReview,
} from '../services/reviewService'

const formatDate = (value) => {
  if (!value) return '-'
  if (typeof value?.toDate === 'function') return value.toDate().toLocaleString()
  return new Date(value).toLocaleString()
}

const renderStars = (rating = 0) => {
  const value = Math.max(1, Math.min(5, Number(rating) || 1))
  return `${value}/5`
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [manualName, setManualName] = useState('')
  const [manualRating, setManualRating] = useState('5')
  const [manualComment, setManualComment] = useState('')
  const [manualProductId, setManualProductId] = useState('')

  const activeProducts = useMemo(
    () => products.filter((item) => item.active !== false),
    [products]
  )

  const loadData = async () => {
    setLoading(true)
    try {
      const [reviewItems, productItems] = await Promise.all([
        getReviews(),
        getProducts(),
      ])
      setReviews(reviewItems)
      setProducts(productItems)
    } catch (error) {
      toast.error(error?.message ?? 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAddManualReview = async (event) => {
    event.preventDefault()

    const ratingValue = Number(manualRating)
    if (Number.isNaN(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      toast.error('Rating must be between 1 and 5')
      return
    }

    if (!manualComment.trim()) {
      toast.error('Review comment is required')
      return
    }

    const selectedProduct = products.find((item) => item.id === manualProductId)

    setSaving(true)
    try {
      await addReview({
        source: 'manual',
        approved: true,
        userName: manualName.trim() || 'Admin',
        userEmail: '',
        userId: null,
        productId: selectedProduct?.id ?? null,
        productName: selectedProduct?.name ?? 'General Store Feedback',
        rating: ratingValue,
        comment: manualComment.trim(),
      })

      toast.success('Review added')
      setManualName('')
      setManualRating('5')
      setManualComment('')
      setManualProductId('')
      await loadData()
    } catch (error) {
      toast.error(error?.message ?? 'Failed to add review')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleApprove = async (review) => {
    try {
      await updateReview(review.id, { approved: review.approved !== true })
      toast.success('Review updated')
      await loadData()
    } catch (error) {
      toast.error(error?.message ?? 'Failed to update review')
    }
  }

  const handleDelete = async (review) => {
    const confirmed = window.confirm('Delete this review permanently?')
    if (!confirmed) return

    try {
      await deleteReview(review.id)
      toast.success('Review deleted')
      await loadData()
    } catch (error) {
      toast.error(error?.message ?? 'Failed to delete review')
    }
  }

  return (
    <AdminLayout
      title="Manage Reviews"
      subtitle="Approve, delete, and manually add customer reviews."
    >
      <Card>
        <form
          className="grid gap-3 md:grid-cols-2"
          onSubmit={handleAddManualReview}
        >
          <Input
            label="Reviewer name"
            value={manualName}
            onChange={(event) => setManualName(event.target.value)}
            placeholder="e.g. Priya"
          />

          <label className="flex w-full flex-col gap-2 text-sm">
            <span className="font-medium text-illusion-black">Product</span>
            <select
              className="w-full rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black shadow-soft outline-none focus:border-illusion-pink focus:ring-2 focus:ring-illusion-blush"
              value={manualProductId}
              onChange={(event) => setManualProductId(event.target.value)}
            >
              <option value="">General feedback</option>
              {activeProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Rating (1-5)"
            type="number"
            min="1"
            max="5"
            value={manualRating}
            onChange={(event) => setManualRating(event.target.value)}
          />

          <label className="flex w-full flex-col gap-2 text-sm md:col-span-2">
            <span className="font-medium text-illusion-black">Comment</span>
            <textarea
              rows={4}
              className="w-full rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black shadow-soft outline-none transition-all duration-200 focus:border-illusion-pink focus:ring-2 focus:ring-illusion-blush"
              value={manualComment}
              onChange={(event) => setManualComment(event.target.value)}
              placeholder="Write review feedback..."
            />
          </label>

          <div className="md:col-span-2">
            <Button type="submit" disabled={saving || loading}>
              {saving ? 'Adding...' : 'Add Review'}
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <Card className="text-sm text-illusion-black/60">Loading reviews...</Card>
      ) : reviews.length ? (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="bg-illusion-blush/30">
                <tr>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Reviewer
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Product
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Rating
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Comment
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Status
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Date
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id} className="border-b border-illusion-black/10 align-top">
                    <td className="px-3 py-3 text-sm text-illusion-black">
                      <p className="font-medium">{review.userName ?? 'Anonymous'}</p>
                      <p className="text-xs text-illusion-black/50">{review.userEmail ?? '-'}</p>
                    </td>
                    <td className="px-3 py-3 text-sm text-illusion-black/70">
                      {review.productName ?? 'General'}
                    </td>
                    <td className="px-3 py-3 text-sm text-illusion-black/70">
                      {renderStars(review.rating)}
                    </td>
                    <td className="max-w-[300px] px-3 py-3 text-sm text-illusion-black/70">
                      {review.comment ?? '-'}
                    </td>
                    <td className="px-3 py-3 text-sm text-illusion-black/70">
                      <Badge variant={review.approved ? 'soft' : 'outline'}>
                        {review.approved ? 'Approved' : 'Pending'}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-xs text-illusion-black/60">
                      {formatDate(review.createdAt)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleToggleApprove(review)}
                        >
                          {review.approved ? 'Unapprove' : 'Approve'}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="border border-red-200 text-red-500 hover:text-red-600"
                          onClick={() => handleDelete(review)}
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
        <Card className="text-sm text-illusion-black/60">No reviews yet.</Card>
      )}
    </AdminLayout>
  )
}

export default AdminReviews
