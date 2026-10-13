import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import {
  footerPageDefinitions,
  getFooterPageBySlug,
} from '../config/footerPages'
import {
  getFooterPageContent,
  saveFooterPageContent,
} from '../services/footerPageService'

const AdminFooterLinks = () => {
  const [selectedSlug, setSelectedSlug] = useState(footerPageDefinitions[0]?.slug ?? '')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    let mounted = true
    const definition = getFooterPageBySlug(selectedSlug)
    if (!definition) return undefined

    const loadPage = async () => {
      setLoading(true)
      try {
        const data = await getFooterPageContent(selectedSlug)
        if (!mounted) return

        setTitle(data?.title ?? definition.defaultTitle)
        setSubtitle(data?.subtitle ?? definition.defaultSubtitle)
        setContent(data?.content ?? definition.defaultContent)
      } catch (error) {
        if (mounted) {
          toast.error(error?.message ?? 'Failed to load footer page content')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadPage()

    return () => {
      mounted = false
    }
  }, [selectedSlug])

  const handleSave = async (event) => {
    event.preventDefault()
    if (!selectedSlug) return

    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    setSaving(true)
    try {
      await saveFooterPageContent(selectedSlug, {
        title: title.trim(),
        subtitle: subtitle.trim(),
        content: content.trim(),
      })
      toast.success('Footer page updated')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to save footer page')
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminLayout
      title="Footer Links"
      subtitle="Edit the content for public pages linked from the footer."
    >
      <form className="space-y-4" onSubmit={handleSave}>
        <Card className="space-y-4">
          <label className="flex w-full flex-col gap-2 text-sm">
            <span className="font-medium text-illusion-black">Select page</span>
            <select
              className="w-full rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black shadow-soft outline-none focus:border-illusion-pink focus:ring-2 focus:ring-illusion-blush"
              value={selectedSlug}
              onChange={(event) => setSelectedSlug(event.target.value)}
              disabled={loading || saving}
            >
              {footerPageDefinitions.map((page) => (
                <option key={page.slug} value={page.slug}>
                  {page.label}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            disabled={loading || saving}
          />

          <Input
            label="Subtitle"
            value={subtitle}
            onChange={(event) => setSubtitle(event.target.value)}
            disabled={loading || saving}
          />

          <label className="flex w-full flex-col gap-2 text-sm">
            <span className="font-medium text-illusion-black">Page Content</span>
            <textarea
              rows={8}
              className="w-full rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black shadow-soft outline-none transition-all duration-200 placeholder:text-illusion-black/40 focus:border-illusion-pink focus:ring-2 focus:ring-illusion-blush"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              disabled={loading || saving}
            />
          </label>

          <Button type="submit" disabled={loading || saving}>
            {saving ? 'Saving...' : 'Save Page'}
          </Button>
        </Card>
      </form>
    </AdminLayout>
  )
}

export default AdminFooterLinks
