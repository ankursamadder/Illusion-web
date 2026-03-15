import { NavLink } from 'react-router-dom'
import {
  FileText,
  LayoutDashboard,
  Megaphone,
  Package,
  PlusCircle,
  ClipboardList,
  MessageSquare,
  MessageCircle,
  CreditCard,
  Users,
  Ticket,
} from 'lucide-react'
import Container from '../components/Container'
import AdminNotificationsMenu from './AdminNotificationsMenu'

const sidebarItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Manage Products', icon: Package, href: '/admin/products' },
  { label: 'Add Product', icon: PlusCircle, href: '/admin/products/new' },
  { label: 'Manage Orders', icon: ClipboardList, href: '/admin/orders' },
  { label: 'Enquiries', icon: MessageCircle, href: '/admin/enquiries' },
  { label: 'Manage Reviews', icon: MessageSquare, href: '/admin/reviews' },
  { label: 'Manage Charges', icon: CreditCard, href: '/admin/charges' },
  { label: 'Manage Users', icon: Users, href: '/admin/users' },
  { label: 'Footer Links', icon: FileText, href: '/admin/footer-links' },
  { label: 'Manage Coupons', icon: Ticket, href: '/admin/coupons' },
  { label: 'Promotions Ribbon', icon: Megaphone, href: '/admin/promotions/ribbon' },
]

const AdminLayout = ({ title, subtitle, children }) => {
  return (
    <section className="bg-illusion-blush/10 py-10">
      <Container>
        <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-3xl border border-illusion-black/10 bg-white p-4 shadow-card lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto">
            <div className="mb-4 px-3">
              <p className="text-xs uppercase tracking-[0.3em] text-illusion-black/50">
                Admin
              </p>
              <h2 className="text-lg font-semibold text-illusion-black">
                {title}
              </h2>
            </div>
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
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
    </section>
  )
}

export default AdminLayout
