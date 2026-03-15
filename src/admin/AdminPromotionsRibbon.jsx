import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { getRibbonPromotion, saveRibbonPromotion } from '../services/promotionService'

const AdminPromotionsRibbon = () => {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [enabled, setEnabled] = useState(true)
  const [text, setText] = useState('')

  useEffect(() => {
    let mounted = true

    const loadPromotion = async () => {
      setLoading(true)
      try {
        const ribbon = await getRibbonPromotion()
        if (!mounted) return
        setEnabled(ribbon?.enabled ?? true)
        setText(ribbon?.text ?? '')
      } catch (error) {
        if (mounted) {
          toast.error(error?.message ?? 'Failed to load ribbon promotion')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadPromotion()

    return () => {
      mounted = false
    }
  }, [])

  const handleSave = async (event) => {
    event.preventDefault()

    if (enabled && !text.trim()) {
      toast.error('Add ribbon text before enabling the promotion')
      return
    }

    setSaving(true)
    try {
      await saveRibbonPromotion({
        enabled,
        text: text.trim(),
      })
      toast.success('Ribbon promotion saved')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to save ribbon promotion')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout
      title="Promotions Ribbon"
      subtitle="Control the moving offer ribbon shown on the storefront."
    >
      <form className="max-w-3xl" onSubmit={handleSave}>
        <Card className="space-y-4">
          <Input
            label="Ribbon text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="e.g. Flat 10% off on featured rings this weekend"
            disabled={loading}
          />

          <label className="flex items-center gap-3 text-sm text-illusion-black">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.target.checked)}
              className="h-4 w-4 rounded border-illusion-black/20"
              disabled={loading}
            />
            Enable ribbon on storefront
          </label>

          <Button type="submit" disabled={loading || saving}>
            {saving ? 'Saving...' : 'Save Ribbon'}
          </Button>
        </Card>
      </form>
    </AdminLayout>
  )
}

export default AdminPromotionsRibbon
