import React, { createContext, useContext, useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  ChevronDown,
  ClipboardList,
  CreditCard,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  MessageCircle,
  MessageSquare,
  Package,
  PlusCircle,
  Settings,
  Ticket,
  Users,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Container from '../components/Container'
import AdminNotificationsMenu from './AdminNotificationsMenu'
import AdminSettingsModal from './AdminSettingsModal'

export const IsInsideAdminLayoutContext = createContext(false)

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

const getHeaderForPath = (pathname) => {
  if (pathname === '/' || pathname === '/admin') {
    return { title: 'Dashboard', subtitle: 'Monitor operations and track performance.' }
  }
  if (pathname === '/admin/products' || pathname === '/products') {
    return { title: 'Products', subtitle: 'Create, edit, and manage product visibility.' }
  }
  if (pathname === '/admin/products/new' || pathname === '/products/new') {
    return { title: 'Add Product', subtitle: 'Create a new catalog item.' }
  }
  if (pathname === '/admin/products/gallery' || pathname === '/products/gallery') {
    return { title: 'Product Gallery', subtitle: 'Manage reusable image library assets.' }
  }
  if (pathname.startsWith('/admin/products/') || pathname.startsWith('/products/')) {
    return { title: 'Edit Product', subtitle: 'Update product pricing, images, and details.' }
  }
  if (pathname === '/admin/orders' || pathname === '/orders') {
    return { title: 'Manage Orders', subtitle: 'Track and update customer order fulfillment.' }
  }
  if (pathname === '/admin/orders/initiated' || pathname === '/orders/initiated') {
    return { title: 'Initiated Orders', subtitle: 'Review checkout sessions initiated by customers.' }
  }
  if (pathname.startsWith('/admin/orders/') || pathname.startsWith('/orders/')) {
    return { title: 'Order Details', subtitle: 'Review customer purchase information.' }
  }
  if (pathname === '/admin/enquiries' || pathname === '/enquiries') {
    return { title: 'Enquiries', subtitle: 'Review and manage customer contact messages.' }
  }
  if (pathname === '/admin/careers' || pathname === '/careers') {
    return { title: 'Careers', subtitle: 'Review applicant submissions and CVs.' }
  }
  if (pathname === '/admin/reviews' || pathname === '/reviews') {
    return { title: 'Manage Reviews', subtitle: 'Moderate customer ratings and reviews.' }
  }
  if (pathname === '/admin/charges' || pathname === '/charges') {
    return { title: 'Manage Charges', subtitle: 'Configure shipping rates and free shipping threshold.' }
  }
  if (pathname === '/admin/users' || pathname === '/users') {
    return { title: 'Manage Users', subtitle: 'Review and manage customer accounts.' }
  }
  if (pathname === '/admin/footer-links' || pathname === '/footer-links') {
    return { title: 'Footer Links', subtitle: 'Customize policy, about us, and informational pages.' }
  }
  if (pathname === '/admin/coupons' || pathname === '/coupons') {
    return { title: 'Manage Coupons', subtitle: 'Create and distribute discount coupon codes.' }
  }
  if (pathname === '/admin/mail-templates' || pathname === '/mail-templates') {
    return { title: 'Mail Templates', subtitle: 'Customize transactional emails.' }
  }
  if (pathname.startsWith('/admin/promotions') || pathname.startsWith('/promotions')) {
    return { title: 'Promotions', subtitle: 'Configure announcement ribbon and store banners.' }
  }
  return { title: 'Wahm Admin', subtitle: 'Store Management Portal' }
}

const AdminLayout = ({ children }) => {
  const isInside = useContext(IsInsideAdminLayoutContext)

  // If this AdminLayout is inside the persistent root AdminLayout shell,
  // simply pass through children directly into <Outlet /> without nesting or re-renders
  if (isInside) {
    return <>{children}</>
  }

  // ROOT Layout implementation
  return <RootAdminLayout>{children}</RootAdminLayout>
}

const RootAdminLayout = ({ children }) => {
  const location = useLocation()
  const { user, logout } = useAuth()

  // Pure deterministic header based on current route
  const header = getHeaderForPath(location.pathname)

  const [ordersOpen, setOrdersOpen] = useState(
    location.pathname.startsWith('/admin/orders') || location.pathname.startsWith('/orders')
  )
  const [productsOpen, setProductsOpen] = useState(
    location.pathname.startsWith('/admin/products') || location.pathname.startsWith('/products')
  )
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    if (location.pathname.startsWith('/admin/orders') || location.pathname.startsWith('/orders')) {
      setOrdersOpen(true)
    }
  }, [location.pathname])

  useEffect(() => {
    if (location.pathname.startsWith('/admin/products') || location.pathname.startsWith('/products')) {
      setProductsOpen(true)
    }
  }, [location.pathname])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  const openSettings = () => {
    setSettingsOpen(true)
  }

  const baseLinkClasses =
    'flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition'
  const navLinkClasses = (isActive) =>
    `${baseLinkClasses} ${
      isActive
        ? 'bg-illusion-blush/70 text-illusion-black font-semibold'
        : 'text-illusion-black/70 hover:bg-illusion-blush/40 hover:text-illusion-black'
    }`
  const subLinkClasses = (isActive) =>
    `ml-7 flex items-center gap-2 rounded-2xl px-3 py-2 text-xs font-medium transition ${
      isActive
        ? 'bg-illusion-blush/70 text-illusion-black font-semibold'
        : 'text-illusion-black/60 hover:bg-illusion-blush/40 hover:text-illusion-black'
    }`

  const sidebarContent = (
    <>
      <div className="mb-4 flex items-start justify-between gap-3 px-3">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-illusion-black/50">
            Admin
          </p>
          <h2 className="text-lg font-semibold text-illusion-black">
            Wahm Portal
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openSettings}
            className="rounded-2xl border border-illusion-black/10 p-2 text-illusion-black/60 transition hover:bg-illusion-blush/40 hover:text-illusion-black"
            aria-label="Open admin settings"
            title="Admin Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="rounded-full p-2 text-illusion-black/50 transition hover:bg-illusion-blush/40 hover:text-illusion-black lg:hidden"
            aria-label="Close admin menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <nav className="space-y-1">
        {primaryItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.label}
              to={item.href}
              className={({ isActive }) => navLinkClasses(isActive)}
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
              className={({ isActive }) => `${navLinkClasses(isActive)} flex-1`}
            >
              <Package className="h-4 w-4" />
              Products
            </NavLink>
            <button
              type="button"
              onClick={() => setProductsOpen((prev) => !prev)}
              className="rounded-xl p-2 text-illusion-black/50 transition hover:bg-illusion-blush/40 hover:text-illusion-black"
              aria-label="Toggle product options"
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
                className={({ isActive }) => subLinkClasses(isActive)}
              >
                <PlusCircle className="h-4 w-4" />
                Add Product
              </NavLink>
              <NavLink
                to="/admin/products/gallery"
                className={({ isActive }) => subLinkClasses(isActive)}
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
              className={({ isActive }) => `${navLinkClasses(isActive)} flex-1`}
            >
              <ClipboardList className="h-4 w-4" />
              Manage Orders
            </NavLink>
            <button
              type="button"
              onClick={() => setOrdersOpen((prev) => !prev)}
              className="rounded-xl p-2 text-illusion-black/50 transition hover:bg-illusion-blush/40 hover:text-illusion-black"
              aria-label="Toggle order options"
            >
              <ChevronDown
                className={`h-4 w-4 transition ${ordersOpen ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
          {ordersOpen ? (
            <NavLink
              to="/admin/orders/initiated"
              className={({ isActive }) => subLinkClasses(isActive)}
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
              className={({ isActive }) => navLinkClasses(isActive)}
              end={item.href === '/admin'}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          )
        })}

        {/* Dedicated Admin Settings button in sidebar */}
        <button
          type="button"
          onClick={openSettings}
          className={`${baseLinkClasses} w-full text-illusion-black/70 hover:bg-illusion-blush/40 hover:text-illusion-black text-left`}
        >
          <Settings className="h-4 w-4 text-illusion-black/60" />
          Admin Settings
        </button>

        {user ? (
          <div className="pt-4 border-t border-illusion-black/10 mt-4 space-y-2">
            <div className="px-3 py-1">
              <p className="text-[10px] uppercase tracking-wider text-illusion-black/40">Signed in as</p>
              <p className="text-xs font-medium text-illusion-black truncate">{user.email || 'Admin'}</p>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 hover:text-red-700"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        ) : null}
      </nav>
    </>
  )

  return (
    <IsInsideAdminLayoutContext.Provider value={true}>
      <section className="admin-no-reveal bg-illusion-blush/10 py-8 min-h-screen">
        <Container className="max-w-[1700px] px-3 sm:px-4 lg:px-5">
          {mobileNavOpen ? (
            <div className="fixed inset-0 z-40 bg-illusion-black/40 backdrop-blur-sm lg:hidden">
              <button
                type="button"
                className="h-full w-full"
                aria-label="Close admin navigation"
                onClick={() => setMobileNavOpen(false)}
              />
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-5">
            <aside className="hidden rounded-3xl border border-illusion-black/10 bg-white p-4 shadow-card lg:sticky lg:top-8 lg:block lg:max-h-[calc(100vh-4rem)] lg:self-start lg:overflow-y-auto">
              {sidebarContent}
            </aside>

            <aside
              className={`fixed inset-y-0 left-0 z-50 w-[min(88vw,320px)] overflow-y-auto border-r border-illusion-black/10 bg-white p-4 shadow-card transition-transform duration-200 lg:hidden ${
                mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              {sidebarContent}
            </aside>

            <div className="min-w-0 space-y-4 sm:space-y-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div>
                  <div className="mb-3 flex items-center gap-3 lg:hidden">
                    <button
                      type="button"
                      onClick={() => setMobileNavOpen(true)}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-illusion-black/10 bg-white text-illusion-black shadow-soft transition hover:-translate-y-0.5"
                      aria-label="Open admin menu"
                    >
                      <Menu className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={openSettings}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-illusion-black/10 bg-white text-illusion-black shadow-soft transition hover:-translate-y-0.5"
                      aria-label="Open admin settings"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                    <p className="text-xs uppercase tracking-[0.25em] text-illusion-black/50">
                      Admin Panel
                    </p>
                  </div>
                  <h1 className="text-2xl font-semibold text-illusion-black">
                    {header.title}
                  </h1>
                  {header.subtitle ? (
                    <p className="mt-1 text-sm text-illusion-black/60">
                      {header.subtitle}
                    </p>
                  ) : null}
                </div>
                <div className="self-end sm:self-start">
                  <AdminNotificationsMenu />
                </div>
              </div>
              <div className="admin-scroll-mobile min-w-0">
                <div className="min-w-0 space-y-4 sm:space-y-6">
                  {children || <Outlet />}
                </div>
              </div>
            </div>
          </div>
        </Container>

        <AdminSettingsModal
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
        />
      </section>
    </IsInsideAdminLayoutContext.Provider>
  )
}

export default AdminLayout
