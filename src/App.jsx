import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import PromotionsRibbon from './components/PromotionsRibbon'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
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
import AdminDashboard from './admin/AdminDashboard'
import AdminProducts from './admin/AdminProducts'
import AdminProductForm from './admin/AdminProductForm'
import AdminOrders from './admin/AdminOrders'
import AdminEnquiries from './admin/AdminEnquiries'
import AdminReviews from './admin/AdminReviews'
import AdminCharges from './admin/AdminCharges'
import AdminUsers from './admin/AdminUsers'
import AdminFooterLinks from './admin/AdminFooterLinks'
import AdminCoupons from './admin/AdminCoupons'
import AdminPromotionsRibbon from './admin/AdminPromotionsRibbon'
import { footerPageDefinitions } from './config/footerPages'

function App() {
  return (
    <div className="flex min-h-screen flex-col bg-illusion-white text-illusion-black">
      <PromotionsRibbon />
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <Cart />
              </ProtectedRoute>
            }
          />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
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
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products/new"
            element={
              <AdminRoute>
                <AdminProductForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products/:id"
            element={
              <AdminRoute>
                <AdminProductForm />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/enquiries"
            element={
              <AdminRoute>
                <AdminEnquiries />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/reviews"
            element={
              <AdminRoute>
                <AdminReviews />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/charges"
            element={
              <AdminRoute>
                <AdminCharges />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsers />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/footer-links"
            element={
              <AdminRoute>
                <AdminFooterLinks />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/coupons"
            element={
              <AdminRoute>
                <AdminCoupons />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/promotions/ribbon"
            element={
              <AdminRoute>
                <AdminPromotionsRibbon />
              </AdminRoute>
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
      </main>
      <Footer />
      <Toaster position="top-right" />
    </div>
  )
}

export default App
