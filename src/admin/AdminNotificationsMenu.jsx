import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, BriefcaseBusiness, MessageCircle, ShoppingBag } from 'lucide-react'
import { getOrders } from '../services/orderService'
import { getAdminNotifications } from '../services/enquiryService'

const SEEN_NOTIFICATIONS_KEY = 'illusion_admin_seen_notifications'

const getStoredSeenNotifications = () => {
  if (typeof window === 'undefined') return []
  try {
    const parsed = JSON.parse(localStorage.getItem(SEEN_NOTIFICATIONS_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const getNotificationKey = (item) => `${item.type}_${item.id}`

const formatTime = (value) => {
  if (!value) return '-'
  if (typeof value?.toDate === 'function') return value.toDate().toLocaleString()
  return new Date(value).toLocaleString()
}

const getNotificationIcon = (type) => {
  if (type === 'contact') return MessageCircle
  if (type === 'career') return BriefcaseBusiness
  return ShoppingBag
}

const AdminNotificationsMenu = () => {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [seenNotifications, setSeenNotifications] = useState(() =>
    getStoredSeenNotifications()
  )
  const menuRef = useRef(null)

  const seenNotificationSet = useMemo(
    () => new Set(seenNotifications),
    [seenNotifications]
  )
  const visibleNotifications = useMemo(
    () =>
      notifications.filter((item) => !seenNotificationSet.has(getNotificationKey(item))),
    [notifications, seenNotificationSet]
  )

  const unreadCount = visibleNotifications.length

  const loadNotifications = async () => {
    setLoading(true)
    try {
      const orders = await getOrders()
      const data = await getAdminNotifications(orders, 10)
      setNotifications(data)
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markNotificationSeen = (item) => {
    const key = getNotificationKey(item)

    setSeenNotifications((previous) => {
      if (previous.includes(key)) return previous

      const next = [key, ...previous].slice(0, 200)
      if (typeof window !== 'undefined') {
        localStorage.setItem(SEEN_NOTIFICATIONS_KEY, JSON.stringify(next))
      }
      return next
    })

    setNotifications((previous) =>
      previous.filter((entry) => getNotificationKey(entry) !== key)
    )
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleToggle = async () => {
    const next = !open
    setOpen(next)
    if (next) {
      await loadNotifications()
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-illusion-black/10 bg-white text-illusion-black/70 shadow-soft transition hover:-translate-y-0.5 hover:text-illusion-black"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-illusion-black px-1 text-[10px] font-semibold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[360px] rounded-2xl border border-illusion-black/10 bg-white p-2 shadow-card">
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-illusion-black/60">
              Notifications
            </p>
          </div>
          {loading ? (
            <p className="px-2 py-2 text-sm text-illusion-black/60">Loading...</p>
          ) : visibleNotifications.length ? (
            <div className="max-h-[340px] space-y-1 overflow-auto">
              {visibleNotifications.map((item) => {
                const Icon = getNotificationIcon(item.type)
                return (
                  <Link
                    key={`${item.type}_${item.id}`}
                    to={item.href || '/admin'}
                    onClick={() => {
                      markNotificationSeen(item)
                      setOpen(false)
                    }}
                    className="flex items-start gap-3 rounded-xl px-2 py-2 transition hover:bg-illusion-blush/30"
                  >
                    <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-illusion-blush/40 text-illusion-black/70">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-illusion-black">{item.title}</p>
                      <p className="truncate text-xs text-illusion-black/60">{item.detail}</p>
                      <p className="text-[11px] text-illusion-black/45">{formatTime(item.createdAt)}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="px-2 py-2 text-sm text-illusion-black/60">
              No new order or enquiry notifications yet.
            </p>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default AdminNotificationsMenu
