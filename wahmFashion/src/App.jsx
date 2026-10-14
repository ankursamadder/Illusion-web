import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import PromotionsRibbon from './components/PromotionsRibbon'
import HomeNavbarBanner from './components/HomeNavbarBanner'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Shop from './pages/Shop'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import Wishlist from './pages/Wishlist'
import Checkout from './pages/Checkout'
import Orders from './pages/Orders'
import Profile from './pages/Profile'
import Login from './pages/Login'
import NotFound from './pages/NotFound'
import FooterPage from './pages/FooterPage'
import { footerPageDefinitions } from './config/footerPages'
import useScrollReveal from './hooks/useScrollReveal'
import useActivePresence from './hooks/useActivePresence'

function App() {
  const location = useLocation()
  useScrollReveal()
  useActivePresence()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <div className="flex min-h-screen flex-col bg-illusion-white text-illusion-black">
      <PromotionsRibbon />
      <Navbar />
      <HomeNavbarBanner />
      <main className="flex-1">
        <div
          key={location.pathname}
          className="illusion-page-enter"
        >
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {footerPageDefinitions.map((page) => (
              <Route
                key={page.path}
                path={page.path}
                element={<FooterPage definition={page} />}
              />
            ))}
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>
      <Footer />
      <Toaster position="top-right" />
    </div>
  )
}

export default App
