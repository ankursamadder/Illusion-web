import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  FileText,
  LayoutDashboard,
  Mail,
  Megaphone,
  Package,
  PlusCircle,
  ClipboardList,
  Image as ImageIcon,
  MessageSquare,
  MessageCircle,
  CreditCard,
  Settings,
  Users,
  Ticket,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Container from '../components/Container'
import AdminNotificationsMenu from './AdminNotificationsMenu'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import {
  defaultPaymentSettings,
  getPaymentSettings,
  savePaymentSettings,
} from '../services/paymentSettingsService'

const primaryItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
]

const secondaryItems = [
  { label: 'Enquiries', icon: MessageCircle, href: '/admin/enquiries' },
  { label: 'Manage Reviews', icon: MessageSquare, href: '/admin/reviews' },
  { label: 'Manage Charges', icon: CreditCard, href: '/admin/charges' },
  { label: 'Manage Users', icon: Users, href: '/admin/users' },
  { label: 'Footer Links', icon: FileText, href: '/admin/footer-links' },
  { label: 'Manage Coupons', icon: Ticket, href: '/admin/coupons' },
  { label: 'Mail Templates', icon: Mail, href: '/admin/mail-templates' },
  { label: 'Promotions', icon: Megaphone, href: '/admin/promotions' },
]

const AdminLayout = ({ title, subtitle, children }) => {
  const location = useLocation()
  const [ordersOpen, setOrdersOpen] = useState(
    location.pathname.startsWith('/admin/orders')
  )
  const [productsOpen, setProductsOpen] = useState(
    location.pathname.startsWith('/admin/products')
  )
  const [paymentSettingsOpen, setPaymentSettingsOpen] = useState(false)
  const [paymentSettingsLoading, setPaymentSettingsLoading] = useState(true)
  const [paymentSettingsSaving, setPaymentSettingsSaving] = useState(false)
  const [paymentSettings, setPaymentSettings] = useState(defaultPaymentSettings)
  const [paymentSettingsDraft, setPaymentSettingsDraft] = useState(defaultPaymentSettings)

  useEffect(() => {
    if (location.pathname.startsWith('/admin/orders')) {
      setOrdersOpen(true)
    }
  }, [location.pathname])

  useEffect(() => {
    if (location.pathname.startsWith('/admin/products')) {
      setProductsOpen(true)
    }
  }, [location.pathname])

  useEffect(() => {
    let mounted = true

    const loadPaymentSettings = async () => {
      setPaymentSettingsLoading(true)
      try {
        const data = await getPaymentSettings()
        if (!mounted) return
        setPaymentSettings(data)
        setPaymentSettingsDraft(data)
      } catch (error) {
        if (mounted) {
          toast.error(error?.message ?? 'Failed to load payment settings')
        }
      } finally {
        if (mounted) setPaymentSettingsLoading(false)
      }
    }

    loadPaymentSettings()

    return () => {
      mounted = false
    }
  }, [])

  const openPaymentSettings = () => {
    setPaymentSettingsDraft(paymentSettings)
    setPaymentSettingsOpen(true)
  }

  const handleSavePaymentSettings = async () => {
    setPaymentSettingsSaving(true)
    try {
      await savePaymentSettings(paymentSettingsDraft)
      setPaymentSettings(paymentSettingsDraft)
      setPaymentSettingsOpen(false)
      toast.success('Payment settings updated')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to save payment settings')
    } finally {
      setPaymentSettingsSaving(false)
    }
  }

  return (
    <section className="admin-no-reveal bg-illusion-blush/10 py-10">
      <Container className="max-w-[1700px] px-3 sm:px-4 lg:px-5">
        <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-illusion-black/10 bg-white p-4 shadow-card lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
            <div className="mb-4 flex items-start justify-between gap-3 px-3">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-illusion-black/50">
                  Admin
                </p>
                <h2 className="text-lg font-semibold text-illusion-black">
                  {title}
                </h2>
              </div>
              <button
                type="button"
                onClick={openPaymentSettings}
                className="rounded-2xl border border-illusion-black/10 p-2 text-illusion-black/60 transition hover:bg-illusion-blush/40 hover:text-illusion-black"
                aria-label="Open payment settings"
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
            <nav className="space-y-1">
              {primaryItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.label}
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'bg-illusion-blush/70 text-illusion-black'
                          : 'text-illusion-black/70 hover:bg-illusion-blush/40 hover:text-illusion-black'
                      }`
                    }
                    end={item.href === '/admin'}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                )
              })}
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <NavLink
                    to="/admin/products"
                    className={({ isActive }) =>
                      `flex flex-1 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'bg-illusion-blush/70 text-illusion-black'
                          : 'text-illusion-black/70 hover:bg-illusion-blush/40 hover:text-illusion-black'
                      }`
                    }
                  >
                    <Package className="h-4 w-4" />
                    Products
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => setProductsOpen((prev) => !prev)}
                    className="rounded-xl p-2 text-illusion-black/50 transition hover:bg-illusion-blush/40 hover:text-illusion-black"
                    aria-label="Toggle add product"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition ${productsOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
                {productsOpen ? (
                  <>
                    <NavLink
                      to="/admin/products/new"
                      className={({ isActive }) =>
                        `ml-7 flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-medium transition ${
                          isActive
                            ? 'bg-illusion-blush/70 text-illusion-black'
                            : 'text-illusion-black/60 hover:bg-illusion-blush/40 hover:text-illusion-black'
                        }`
                      }
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Product
                    </NavLink>
                    <NavLink
                      to="/admin/products/gallery"
                      className={({ isActive }) =>
                        `ml-7 flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-medium transition ${
                          isActive
                            ? 'bg-illusion-blush/70 text-illusion-black'
                            : 'text-illusion-black/60 hover:bg-illusion-blush/40 hover:text-illusion-black'
                        }`
                      }
                    >
                      <ImageIcon className="h-4 w-4" />
                      Product Gallery
                    </NavLink>
                  </>
                ) : null}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <NavLink
                    to="/admin/orders"
                    className={({ isActive }) =>
                      `flex flex-1 items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'bg-illusion-blush/70 text-illusion-black'
                          : 'text-illusion-black/70 hover:bg-illusion-blush/40 hover:text-illusion-black'
                      }`
                    }
                  >
                    <ClipboardList className="h-4 w-4" />
                    Manage Orders
                  </NavLink>
                  <button
                    type="button"
                    onClick={() => setOrdersOpen((prev) => !prev)}
                    className="rounded-xl p-2 text-illusion-black/50 transition hover:bg-illusion-blush/40 hover:text-illusion-black"
                    aria-label="Toggle initiated orders"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition ${ordersOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
                {ordersOpen ? (
                  <NavLink
                    to="/admin/orders/initiated"
                    className={({ isActive }) =>
                      `ml-7 flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-medium transition ${
                        isActive
                          ? 'bg-illusion-blush/70 text-illusion-black'
                          : 'text-illusion-black/60 hover:bg-illusion-blush/40 hover:text-illusion-black'
                      }`
                    }
                  >
                    Initiated Orders
                  </NavLink>
                ) : null}
              </div>
              {secondaryItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.label}
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'bg-illusion-blush/70 text-illusion-black'
                          : 'text-illusion-black/70 hover:bg-illusion-blush/40 hover:text-illusion-black'
                      }`
                    }
                    end={item.href === '/admin'}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>
          </aside>

          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-illusion-black">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="mt-1 text-sm text-illusion-black/60">
                    {subtitle}
                  </p>
                ) : null}
              </div>
              <AdminNotificationsMenu />
            </div>
            {children}
          </div>
        </div>
      </Container>
      <Modal
        open={paymentSettingsOpen}
        title="Payment Settings"
        onClose={() => setPaymentSettingsOpen(false)}
        actions={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPaymentSettingsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSavePaymentSettings}
              disabled={paymentSettingsLoading || paymentSettingsSaving}
            >
              {paymentSettingsSaving ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-illusion-black/60">
            Control which payment methods customers can use during checkout.
          </p>

          <label className="flex items-start justify-between gap-4 rounded-2xl border border-illusion-black/10 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-illusion-black">
                Cash on Delivery
              </p>
              <p className="text-xs text-illusion-black/55">
                Turn COD on or off across the storefront.
              </p>
            </div>
            <input
              type="checkbox"
              checked={paymentSettingsDraft.codEnabled}
              onChange={(event) =>
                setPaymentSettingsDraft((prev) => ({
                  ...prev,
                  codEnabled: event.target.checked,
                }))
              }
              className="mt-1 h-4 w-4 rounded border-illusion-black/20"
              disabled={paymentSettingsLoading || paymentSettingsSaving}
            />
          </label>

          <label className="flex items-start justify-between gap-4 rounded-2xl border border-illusion-black/10 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-illusion-black">
                Online Payment
              </p>
              <p className="text-xs text-illusion-black/55">
                Allow Razorpay checkout for UPI, cards and net banking.
              </p>
            </div>
            <input
              type="checkbox"
              checked={paymentSettingsDraft.onlinePaymentEnabled}
              onChange={(event) =>
                setPaymentSettingsDraft((prev) => ({
                  ...prev,
                  onlinePaymentEnabled: event.target.checked,
                }))
              }
              className="mt-1 h-4 w-4 rounded border-illusion-black/20"
              disabled={paymentSettingsLoading || paymentSettingsSaving}
            />
          </label>
        </div>
      </Modal>
    </section>
  )
}

export default AdminLayout
