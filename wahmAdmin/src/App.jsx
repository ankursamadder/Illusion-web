import { useEffect } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AdminRoute from './components/AdminRoute'
import AdminDashboard from './admin/AdminDashboard'
import AdminProducts from './admin/AdminProducts'
import AdminProductForm from './admin/AdminProductForm'
import AdminProductGallery from './admin/AdminProductGallery'
import AdminOrders from './admin/AdminOrders'
import AdminInitiatedOrders from './admin/AdminInitiatedOrders'
import AdminEnquiries from './admin/AdminEnquiries'
import AdminCareers from './admin/AdminCareers'
import AdminReviews from './admin/AdminReviews'
import AdminCharges from './admin/AdminCharges'
import AdminUsers from './admin/AdminUsers'
import AdminFooterLinks from './admin/AdminFooterLinks'
import AdminCoupons from './admin/AdminCoupons'
import AdminMailTemplates from './admin/AdminMailTemplates'
import AdminPromotionsRibbon from './admin/AdminPromotionsRibbon'
import AdminLogin from './admin/AdminLogin'

function App() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-illusion-white text-illusion-black">
      <main className="min-h-screen">
        <div key={location.pathname} className="illusion-page-enter">
          <Routes location={location}>
            {/* Public Login Routes */}
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Root & Dashboard */}
            <Route
              path="/"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
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

            {/* Products */}
            <Route
              path="/admin/products"
              element={
                <AdminRoute>
                  <AdminProducts />
                </AdminRoute>
              }
            />
            <Route
              path="/products"
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
              path="/products/new"
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
              path="/products/:id"
              element={
                <AdminRoute>
                  <AdminProductForm />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/products/gallery"
              element={
                <AdminRoute>
                  <AdminProductGallery />
                </AdminRoute>
              }
            />
            <Route
              path="/products/gallery"
              element={
                <AdminRoute>
                  <AdminProductGallery />
                </AdminRoute>
              }
            />

            {/* Orders */}
            <Route
              path="/admin/orders"
              element={
                <AdminRoute>
                  <AdminOrders />
                </AdminRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <AdminRoute>
                  <AdminOrders />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/orders/initiated"
              element={
                <AdminRoute>
                  <AdminInitiatedOrders />
                </AdminRoute>
              }
            />
            <Route
              path="/orders/initiated"
              element={
                <AdminRoute>
                  <AdminInitiatedOrders />
                </AdminRoute>
              }
            />

            {/* Enquiries & Careers */}
            <Route
              path="/admin/enquiries"
              element={
                <AdminRoute>
                  <AdminEnquiries />
                </AdminRoute>
              }
            />
            <Route
              path="/enquiries"
              element={
                <AdminRoute>
                  <AdminEnquiries />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/careers"
              element={
                <AdminRoute>
                  <AdminCareers />
                </AdminRoute>
              }
            />
            <Route
              path="/careers"
              element={
                <AdminRoute>
                  <AdminCareers />
                </AdminRoute>
              }
            />

            {/* Reviews */}
            <Route
              path="/admin/reviews"
              element={
                <AdminRoute>
                  <AdminReviews />
                </AdminRoute>
              }
            />
            <Route
              path="/reviews"
              element={
                <AdminRoute>
                  <AdminReviews />
                </AdminRoute>
              }
            />

            {/* Charges */}
            <Route
              path="/admin/charges"
              element={
                <AdminRoute>
                  <AdminCharges />
                </AdminRoute>
              }
            />
            <Route
              path="/charges"
              element={
                <AdminRoute>
                  <AdminCharges />
                </AdminRoute>
              }
            />

            {/* Users */}
            <Route
              path="/admin/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />
            <Route
              path="/users"
              element={
                <AdminRoute>
                  <AdminUsers />
                </AdminRoute>
              }
            />

            {/* Footer Links */}
            <Route
              path="/admin/footer-links"
              element={
                <AdminRoute>
                  <AdminFooterLinks />
                </AdminRoute>
              }
            />
            <Route
              path="/footer-links"
              element={
                <AdminRoute>
                  <AdminFooterLinks />
                </AdminRoute>
              }
            />

            {/* Coupons */}
            <Route
              path="/admin/coupons"
              element={
                <AdminRoute>
                  <AdminCoupons />
                </AdminRoute>
              }
            />
            <Route
              path="/coupons"
              element={
                <AdminRoute>
                  <AdminCoupons />
                </AdminRoute>
              }
            />

            {/* Mail Templates */}
            <Route
              path="/admin/mail-templates"
              element={
                <AdminRoute>
                  <AdminMailTemplates />
                </AdminRoute>
              }
            />
            <Route
              path="/mail-templates"
              element={
                <AdminRoute>
                  <AdminMailTemplates />
                </AdminRoute>
              }
            />

            {/* Promotions */}
            <Route
              path="/admin/promotions"
              element={
                <AdminRoute>
                  <AdminPromotionsRibbon />
                </AdminRoute>
              }
            />
            <Route
              path="/promotions"
              element={
                <AdminRoute>
                  <AdminPromotionsRibbon />
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

            {/* Catch-all redirect to /admin */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  )
}

export default App
