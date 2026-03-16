import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Heart,
  LayoutDashboard,
  MapPin,
  Search,
  ShoppingBag,
  Store,
  User,
  X,
} from 'lucide-react'
import clsx from 'clsx'
import Container from './Container'
import { useAuth } from '../context/AuthContext'
import useCartStore from '../hooks/useCartStore'
import { getProducts } from '../services/productService'
import { formatCurrency } from '../utils/formatCurrency'
import illusionLogo from '../assets/Illusion logo.png'

const iconButtonBase =
  'relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-illusion-black/10 text-illusion-black/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-illusion-black/20 hover:text-illusion-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-illusion-pink/50'

const getSearchableFields = (product) => {
  const categories = Array.isArray(product.categories)
    ? product.categories.join(' ')
    : product.categories

  return [
    product.name,
    product.description,
    product.category,
    categories,
    product.price,
    product.offerPrice,
  ]
    .filter((value) => value !== undefined && value !== null)
    .map((value) => String(value).toLowerCase())
}

const Navbar = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth() || {}
  const { items } = useCartStore()
  const currentUser = user ?? { role: 'user' }

  const [open, setOpen] = useState(false)
  const [pincode, setPincode] = useState('')
  const [searchValue, setSearchValue] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const [searchProducts, setSearchProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  const menuRef = useRef(null)
  const desktopSearchRef = useRef(null)
  const mobileSearchRef = useRef(null)

  useEffect(() => {
    const savedPincode = localStorage.getItem('illusion_delivery_pincode')
    if (savedPincode) {
      setPincode(savedPincode)
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('illusion_delivery_pincode', pincode)
  }, [pincode])

  useEffect(() => {
    let mounted = true

    const loadProducts = async () => {
      setLoadingProducts(true)
      try {
        const products = await getProducts()
        if (!mounted) return
        setSearchProducts(products.filter((product) => product.active !== false))
      } catch {
        if (!mounted) return
        setSearchProducts([])
      } finally {
        if (mounted) setLoadingProducts(false)
      }
    }

    loadProducts()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false)
      }

      const desktopSearchContains = desktopSearchRef.current?.contains(event.target)
      const mobileSearchContains = mobileSearchRef.current?.contains(event.target)

      if (!desktopSearchContains && !mobileSearchContains) {
        setSearchOpen(false)
        setMobileSearchOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const cartCount = useMemo(() => {
    return items.reduce((total, item) => total + (Number(item.quantity) || 0), 0)
  }, [items])

  const searchResults = useMemo(() => {
    const query = searchValue.trim().toLowerCase()
    if (!query) return []

    return searchProducts
      .filter((product) => {
        const fields = getSearchableFields(product)
        return fields.some((field) => field.includes(query))
      })
      .slice(0, 6)
  }, [searchProducts, searchValue])

  const handlePincodeChange = (event) => {
    const nextValue = event.target.value.replace(/\D/g, '').slice(0, 6)
    setPincode(nextValue)
  }

  const handleSelectProduct = (productId) => {
    navigate(`/product/${productId}`)
    setSearchOpen(false)
    setMobileSearchOpen(false)
    setSearchValue('')
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()
    if (!searchResults.length) return
    handleSelectProduct(searchResults[0].id)
  }

  return (
    <header className="sticky top-0 z-40 border-b border-illusion-black/5 bg-white/90 backdrop-blur">
      <Container className="py-3">
        <div className="grid grid-cols-[auto_1fr] items-center gap-3 md:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="flex items-center gap-3">
            <NavLink
              to="/"
              className="inline-flex items-center"
              aria-label="Illusion home"
            >
              <img
                src={illusionLogo}
                alt="Illusion"
                className="h-9 w-auto object-contain"
              />
            </NavLink>

            <div className="hidden items-center gap-2 rounded-2xl border border-illusion-black/10 bg-white px-3 py-2 shadow-soft sm:flex">
              <MapPin className="h-4 w-4 text-illusion-black/70" />
              <div className="min-w-[170px]">
                <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-illusion-black/50">
                  Where to deliver?
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={pincode}
                  onChange={handlePincodeChange}
                  placeholder="Enter pincode"
                  className="w-full border-0 bg-transparent p-0 text-sm text-illusion-black outline-none placeholder:text-illusion-black/35"
                />
              </div>
            </div>
          </div>

          <div className="relative hidden md:block" ref={desktopSearchRef}>
            <form onSubmit={handleSearchSubmit}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-illusion-black/45" />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onFocus={() => {
                  setSearchOpen(true)
                  setMobileSearchOpen(false)
                }}
                placeholder="Search by name, description, category or price"
                className="h-11 w-full rounded-2xl border border-illusion-black/10 bg-white pl-10 pr-4 text-sm text-illusion-black shadow-soft outline-none transition focus:border-illusion-pink focus:ring-2 focus:ring-illusion-blush"
              />
            </form>

            {searchOpen && searchValue.trim() ? (
              <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-2xl border border-illusion-black/10 bg-white p-2 shadow-card">
                {loadingProducts ? (
                  <p className="px-3 py-2 text-sm text-illusion-black/60">Searching...</p>
                ) : searchResults.length ? (
                  <div className="space-y-1">
                    {searchResults.map((product) => {
                      const displayPrice =
                        typeof product.offerPrice === 'number' &&
                        product.offerPrice < product.price
                          ? product.offerPrice
                          : product.price

                      return (
                        <button
                          type="button"
                          key={product.id}
                          onClick={() => handleSelectProduct(product.id)}
                          className="flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-illusion-blush/40"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-illusion-black">
                              {product.name}
                            </p>
                            <p className="truncate text-xs text-illusion-black/55">
                              {product.category || product.description || 'Product'}
                            </p>
                          </div>
                          <p className="shrink-0 text-xs font-medium text-illusion-black/70">
                            {formatCurrency(displayPrice ?? 0)}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="px-3 py-2 text-sm text-illusion-black/60">
                    No matching products found.
                  </p>
                )}
              </div>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              className={clsx(iconButtonBase, 'md:hidden', mobileSearchOpen && 'text-illusion-black')}
              aria-label="Search"
              onClick={() => {
                setMobileSearchOpen((previous) => !previous)
                setSearchOpen(false)
              }}
            >
              {mobileSearchOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </button>

            <NavLink to="/shop" className={iconButtonBase} aria-label="Store">
              <Store className="h-4 w-4" />
            </NavLink>

            <NavLink to="/wishlist" className={iconButtonBase} aria-label="Wishlist">
              <Heart className="h-4 w-4" />
            </NavLink>

            <NavLink to="/cart" className={iconButtonBase} aria-label="Cart">
              <ShoppingBag className="h-4 w-4" />
              {cartCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-illusion-black px-1 text-[10px] font-semibold text-white">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              ) : null}
            </NavLink>

            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className={clsx(iconButtonBase, open && 'text-illusion-black')}
                aria-label="Profile menu"
                aria-expanded={open}
                onClick={() => setOpen((prev) => !prev)}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-illusion-blush/60">
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
                </span>
              </button>

              {open ? (
                <div className="absolute right-0 mt-3 w-52 rounded-2xl border border-illusion-black/10 bg-white p-2 text-sm shadow-card">
                  <NavLink
                    to="/orders"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-illusion-black/70 transition hover:bg-illusion-blush/50 hover:text-illusion-black"
                  >
                    Your Orders
                  </NavLink>
                  <NavLink
                    to="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center justify-between rounded-xl px-3 py-2 text-illusion-black/70 transition hover:bg-illusion-blush/50 hover:text-illusion-black"
                  >
                    Your Profile
                  </NavLink>
                  {currentUser?.role === 'admin' ? (
                    <NavLink
                      to="/admin"
                      onClick={() => setOpen(false)}
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
        </div>

        {mobileSearchOpen ? (
          <div className="relative mt-3 md:hidden" ref={mobileSearchRef}>
            <form onSubmit={handleSearchSubmit}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-illusion-black/45" />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search by name, description, category or price"
                className="h-11 w-full rounded-2xl border border-illusion-black/10 bg-white pl-10 pr-4 text-sm text-illusion-black shadow-soft outline-none transition focus:border-illusion-pink focus:ring-2 focus:ring-illusion-blush"
              />
            </form>

            {searchValue.trim() ? (
              <div className="mt-2 rounded-2xl border border-illusion-black/10 bg-white p-2 shadow-card">
                {loadingProducts ? (
                  <p className="px-3 py-2 text-sm text-illusion-black/60">Searching...</p>
                ) : searchResults.length ? (
                  <div className="space-y-1">
                    {searchResults.map((product) => {
                      const displayPrice =
                        typeof product.offerPrice === 'number' &&
                        product.offerPrice < product.price
                          ? product.offerPrice
                          : product.price

                      return (
                        <button
                          type="button"
                          key={product.id}
                          onClick={() => handleSelectProduct(product.id)}
                          className="flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-illusion-blush/40"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-illusion-black">
                              {product.name}
                            </p>
                            <p className="truncate text-xs text-illusion-black/55">
                              {product.category || product.description || 'Product'}
                            </p>
                          </div>
                          <p className="shrink-0 text-xs font-medium text-illusion-black/70">
                            {formatCurrency(displayPrice ?? 0)}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <p className="px-3 py-2 text-sm text-illusion-black/60">
                    No matching products found.
                  </p>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </Container>
    </header>
  )
}

export default Navbar
