import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import {
  getOrderEmailNotificationConfig,
  saveAdminOrderTemplate,
  saveCustomerOrderTemplate,
  saveOrderEmailNotificationSettings,
} from '../services/emailNotificationService'

const parseEmails = (value) => {
  return value
    .split(/[,\n]/g)
    .map((email) => email.trim())
    .filter(Boolean)
}

const AdminMailTemplates = () => {
  const [loading, setLoading] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [savingAdminTemplate, setSavingAdminTemplate] = useState(false)
  const [savingCustomerTemplate, setSavingCustomerTemplate] = useState(false)
  const [adminEnabled, setAdminEnabled] = useState(true)
  const [adminEmails, setAdminEmails] = useState('')
  const [customerEnabled, setCustomerEnabled] = useState(false)
  const [adminSubject, setAdminSubject] = useState('')
  const [adminBody, setAdminBody] = useState('')
  const [customerSubject, setCustomerSubject] = useState('')
  const [customerBody, setCustomerBody] = useState('')

  useEffect(() => {
    let mounted = true

    const loadConfig = async () => {
      setLoading(true)
      try {
        const config = await getOrderEmailNotificationConfig()
        if (!mounted) return

        setAdminEnabled(config.settings.adminEnabled === true)
        setAdminEmails((config.settings.adminRecipientEmails ?? []).join(', '))
        setCustomerEnabled(config.settings.customerEnabled === true)
        setAdminSubject(config.adminTemplate.subject)
        setAdminBody(config.adminTemplate.body)
        setCustomerSubject(config.customerTemplate.subject)
        setCustomerBody(config.customerTemplate.body)
      } catch (error) {
        if (mounted) {
          toast.error(error?.message ?? 'Failed to load email settings')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadConfig()
    return () => {
      mounted = false
    }
  }, [])

  const handleSaveSettings = async (event) => {
    event.preventDefault()
    setSavingSettings(true)
    try {
      await saveOrderEmailNotificationSettings({
        adminEnabled,
        adminRecipientEmails: parseEmails(adminEmails),
        customerEnabled,
      })
      toast.success('Email settings saved')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleSaveAdminTemplate = async (event) => {
    event.preventDefault()
    setSavingAdminTemplate(true)
    try {
      await saveAdminOrderTemplate({
        subject: adminSubject,
        body: adminBody,
      })
      toast.success('Admin template saved')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to save admin template')
    } finally {
      setSavingAdminTemplate(false)
    }
  }

  const handleSaveCustomerTemplate = async (event) => {
    event.preventDefault()
    setSavingCustomerTemplate(true)
    try {
      await saveCustomerOrderTemplate({
        subject: customerSubject,
        body: customerBody,
      })
      toast.success('Customer template saved')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to save customer template')
    } finally {
      setSavingCustomerTemplate(false)
    }
  }

  return (
    <AdminLayout
      title="Mail Templates"
      subtitle="Configure notification emails and editable templates."
    >
      <Card>
        <form className="space-y-4" onSubmit={handleSaveSettings}>
          <label className="flex items-center gap-3 text-sm text-illusion-black">
            <input
              type="checkbox"
              checked={adminEnabled}
              onChange={(event) => setAdminEnabled(event.target.checked)}
              className="h-4 w-4 rounded border-illusion-black/20"
              disabled={loading}
            />
            Enable admin email notifications for new orders
          </label>

          <Input
            label="Admin notification emails"
            value={adminEmails}
            onChange={(event) => setAdminEmails(event.target.value)}
            placeholder="admin@example.com, owner@example.com"
            disabled={loading}
            helperText="Use comma-separated emails."
          />

          <label className="flex items-center gap-3 text-sm text-illusion-black">
            <input
              type="checkbox"
              checked={customerEnabled}
              onChange={(event) => setCustomerEnabled(event.target.checked)}
              className="h-4 w-4 rounded border-illusion-black/20"
              disabled={loading}
            />
            Enable customer email notifications (template ready for future use)
          </label>

          <Button type="submit" disabled={loading || savingSettings}>
            {savingSettings ? 'Saving...' : 'Save Email Settings'}
          </Button>
        </form>
      </Card>

      <Card>
        <form className="space-y-3" onSubmit={handleSaveAdminTemplate}>
          <h3 className="text-lg font-semibold text-illusion-black">Admin New Order Template</h3>
          <Input
            label="Subject"
            value={adminSubject}
            onChange={(event) => setAdminSubject(event.target.value)}
            placeholder="New Order {{orderNumber}} placed"
          />
          <label className="flex w-full flex-col gap-2 text-sm">
            <span className="font-medium text-illusion-black">Body</span>
            <textarea
              rows={8}
              value={adminBody}
              onChange={(event) => setAdminBody(event.target.value)}
              className="w-full rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black shadow-soft outline-none transition-all duration-200 focus:border-illusion-pink focus:ring-2 focus:ring-illusion-blush"
            />
          </label>
          <p className="text-xs text-illusion-black/55">
            Available placeholders: {'{{orderId}}'}, {'{{orderNumber}}'}, {'{{productName}}'}, {'{{productPrice}}'}, {'{{customerName}}'}, {'{{customerEmail}}'}, {'{{customerAddress}}'}, {'{{shippingAddress}}'}, {'{{paymentId}}'}, {'{{paymentMethod}}'}, {'{{paymentStatus}}'}, {'{{orderStatus}}'}, {'{{orderTotal}}'}, {'{{itemsSummary}}'}, {'{{orderDate}}'}
          </p>
          <Button type="submit" disabled={loading || savingAdminTemplate}>
            {savingAdminTemplate ? 'Saving...' : 'Save Admin Template'}
          </Button>
        </form>
      </Card>

      <Card>
        <form className="space-y-3" onSubmit={handleSaveCustomerTemplate}>
          <h3 className="text-lg font-semibold text-illusion-black">Customer Order Template</h3>
          <Input
            label="Subject"
            value={customerSubject}
            onChange={(event) => setCustomerSubject(event.target.value)}
            placeholder="Order Confirmation {{orderNumber}}"
          />
          <label className="flex w-full flex-col gap-2 text-sm">
            <span className="font-medium text-illusion-black">Body</span>
            <textarea
              rows={8}
              value={customerBody}
              onChange={(event) => setCustomerBody(event.target.value)}
              className="w-full rounded-2xl border border-illusion-black/10 bg-white px-4 py-3 text-sm text-illusion-black shadow-soft outline-none transition-all duration-200 focus:border-illusion-pink focus:ring-2 focus:ring-illusion-blush"
            />
          </label>
          <Button type="submit" disabled={loading || savingCustomerTemplate}>
            {savingCustomerTemplate ? 'Saving...' : 'Save Customer Template'}
          </Button>
          <p className="text-xs text-illusion-black/55">
            Suggested placeholders: {'{{orderNumber}}'}, {'{{productName}}'}, {'{{productPrice}}'}, {'{{paymentId}}'}, {'{{orderStatus}}'}, {'{{orderDate}}'}
          </p>
        </form>
      </Card>
    </AdminLayout>
  )
}

export default AdminMailTemplates
