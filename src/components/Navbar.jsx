import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Heart,
  MapPin,
  Search,
  ShoppingBag,
  Store,
  User,
  LayoutDashboard,
} from 'lucide-react'
import clsx from 'clsx'
import Container from './Container'
import { useAuth } from '../context/AuthContext'

const iconButtonBase =
  'relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-illusion-black/10 text-illusion-black/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-illusion-black/20 hover:text-illusion-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-illusion-pink/50'

const Navbar = () => {
  const { user, logout } = useAuth() || {}
  const currentUser = user ?? { role: 'user' }
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-illusion-black/5 bg-white/80 backdrop-blur">
      <Container className="flex h-16 items-center justify-between">
        <NavLink to="/" className="text-lg font-semibold text-illusion-black">
          Illusion
        </NavLink>
        <div className="flex items-center gap-2">
          <button type="button" className={iconButtonBase} aria-label="Location">
            <MapPin className="h-4 w-4" />
          </button>
          <button type="button" className={iconButtonBase} aria-label="Search">
            <Search className="h-4 w-4" />
          </button>
          <NavLink to="/shop" className={iconButtonBase} aria-label="Store">
            <Store className="h-4 w-4" />
          </NavLink>
          <NavLink to="/wishlist" className={iconButtonBase} aria-label="Wishlist">
            <Heart className="h-4 w-4" />
          </NavLink>
          <NavLink to="/cart" className={iconButtonBase} aria-label="Cart">
            <ShoppingBag className="h-4 w-4" />
          </NavLink>
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              className={clsx(iconButtonBase, open && 'text-illusion-black')}
              aria-label="Profile menu"
              onClick={() => setOpen((prev) => !prev)}
            >
              {currentUser?.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.name ?? 'Profile'}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <User className="h-4 w-4" />
              )}
            </button>
            {open ? (
              <div className="absolute right-0 mt-3 w-52 rounded-2xl border border-illusion-black/10 bg-white p-2 text-sm shadow-card">
                <NavLink
                  to="/orders"
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-illusion-black/70 transition hover:bg-illusion-blush/50 hover:text-illusion-black"
                >
                  Your Orders
                </NavLink>
                <NavLink
                  to="/profile"
                  className="flex items-center justify-between rounded-xl px-3 py-2 text-illusion-black/70 transition hover:bg-illusion-blush/50 hover:text-illusion-black"
                >
                  Your Profile
                </NavLink>
                {currentUser?.role === 'admin' ? (
                  <NavLink
                    to="/admin"
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-illusion-black/70 transition hover:bg-illusion-blush/50 hover:text-illusion-black"
                  >
                    Admin Dashboard
                    <LayoutDashboard className="h-4 w-4" />
                  </NavLink>
                ) : null}
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-illusion-black/70 transition hover:bg-illusion-blush/50 hover:text-illusion-black"
                >
                  Logout
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </Container>
    </header>
  )
}

export default Navbar
