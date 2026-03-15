import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import PageShell from './PageShell'
import { getFooterPageContent } from '../services/footerPageService'
import {
  createCareerEnquiry,
  createContactEnquiry,
} from '../services/enquiryService'

const FooterPage = ({ definition }) => {
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  })
  const [careerForm, setCareerForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    message: '',
  })

  useEffect(() => {
    let mounted = true

    const loadPage = async () => {
      setLoading(true)
      try {
        const data = await getFooterPageContent(definition.slug)
        if (!mounted) return
        setContent(data)
      } catch {
        if (mounted) setContent(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadPage()

    return () => {
      mounted = false
    }
  }, [definition.slug])

  const pageTitle = content?.title?.trim() || definition.defaultTitle
  const pageSubtitle = content?.subtitle?.trim() || definition.defaultSubtitle
  const pageContent = content?.content?.trim() || definition.defaultContent

  const paragraphs = useMemo(() => {
    return pageContent
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
  }, [pageContent])

  const isContactPage = definition.slug === 'contact'
  const isCareersPage = definition.slug === 'careers'

  const handleSubmitContact = async (event) => {
    event.preventDefault()
    if (!contactForm.name.trim() || !contactForm.email.trim() || !contactForm.message.trim()) {
      toast.error('Name, email and message are required')
      return
    }

    setSubmitting(true)
    try {
      await createContactEnquiry({
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        phone: contactForm.phone.trim(),
        message: contactForm.message.trim(),
      })
      setContactForm({
        name: '',
        email: '',
        phone: '',
        message: '',
      })
      toast.success('Your enquiry has been submitted')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to submit enquiry')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitCareer = async (event) => {
    event.preventDefault()
    if (!careerForm.name.trim() || !careerForm.email.trim() || !careerForm.role.trim()) {
      toast.error('Name, email and role are required')
      return
    }

    setSubmitting(true)
    try {
      await createCareerEnquiry({
        name: careerForm.name.trim(),
        email: careerForm.email.trim(),
        phone: careerForm.phone.trim(),
        role: careerForm.role.trim(),
        message: careerForm.message.trim(),
      })
      setCareerForm({
        name: '',
        email: '',
        phone: '',
        role: '',
        message: '',
      })
      toast.success('Career enquiry submitted')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to submit career enquiry')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PageShell title={pageTitle} subtitle={pageSubtitle}>
      <Card className="space-y-3">
        {loading ? (
          <p className="text-sm text-illusion-black/60">Loading page content...</p>
        ) : (
          paragraphs.map((paragraph, index) => (
            <p key={`${definition.slug}_${index}`} className="text-sm leading-relaxed text-illusion-black/70">
              {paragraph}
            </p>
          ))
        )}
      </Card>

      {isContactPage ? (
        <Card className="mt-4 space-y-3">
          <h2 className="text-lg font-semibold text-illusion-black">Send an Enquiry</h2>
          <form className="space-y-3" onSubmit={handleSubmitContact}>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Name"
                value={contactForm.name}
                onChange={(event) =>
                  setContactForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
              <Input
                label="Email"
                type="email"
                value={contactForm.email}
                onChange={(event) =>
                  setContactForm((prev) => ({ ...prev, email: event.target.value }))
                }
              />
              <Input
                label="Phone"
                value={contactForm.phone}
                onChange={(event) =>
                  setContactForm((prev) => ({ ...prev, phone: event.target.value }))
                }
              />
            </div>
            <label className="flex w-full flex-col gap-2 text-sm">
              <span className="font-medium text-illusion-black">Message</span>
              <textarea
                rows={4}
                className="w-full rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black shadow-soft outline-none transition-all duration-200 placeholder:text-illusion-black/40 focus:border-illusion-pink focus:ring-2 focus:ring-illusion-blush"
                value={contactForm.message}
                onChange={(event) =>
                  setContactForm((prev) => ({ ...prev, message: event.target.value }))
                }
              />
            </label>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Enquiry'}
            </Button>
          </form>
        </Card>
      ) : null}

      {isCareersPage ? (
        <Card className="mt-4 space-y-3">
          <h2 className="text-lg font-semibold text-illusion-black">Career Enquiry</h2>
          <form className="space-y-3" onSubmit={handleSubmitCareer}>
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                label="Name"
                value={careerForm.name}
                onChange={(event) =>
                  setCareerForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
              <Input
                label="Email"
                type="email"
                value={careerForm.email}
                onChange={(event) =>
                  setCareerForm((prev) => ({ ...prev, email: event.target.value }))
                }
              />
              <Input
                label="Phone"
                value={careerForm.phone}
                onChange={(event) =>
                  setCareerForm((prev) => ({ ...prev, phone: event.target.value }))
                }
              />
              <Input
                label="Role"
                value={careerForm.role}
                onChange={(event) =>
                  setCareerForm((prev) => ({ ...prev, role: event.target.value }))
                }
              />
            </div>
            <label className="flex w-full flex-col gap-2 text-sm">
              <span className="font-medium text-illusion-black">Message</span>
              <textarea
                rows={4}
                className="w-full rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black shadow-soft outline-none transition-all duration-200 placeholder:text-illusion-black/40 focus:border-illusion-pink focus:ring-2 focus:ring-illusion-blush"
                value={careerForm.message}
                onChange={(event) =>
                  setCareerForm((prev) => ({ ...prev, message: event.target.value }))
                }
              />
            </label>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Career Enquiry'}
            </Button>
          </form>
        </Card>
      ) : null}
    </PageShell>
  )
}

export default FooterPage
