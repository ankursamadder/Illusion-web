import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AdminRoute from './components/AdminRoute'
import AdminLayout from './admin/AdminLayout'
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
  return (
    <div className="min-h-screen bg-illusion-white text-illusion-black">
      <main className="min-h-screen">
        <Routes>
          {/* Public Login Routes */}
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* Authenticated Admin Shell - Persistent Layout */}
          <Route
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            {/* Dashboard */}
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />

            {/* Products */}
            <Route path="/admin/products" element={<AdminProducts />} />
            <Route path="/products" element={<AdminProducts />} />
            <Route path="/admin/products/new" element={<AdminProductForm />} />
            <Route path="/products/new" element={<AdminProductForm />} />
            <Route path="/admin/products/:id" element={<AdminProductForm />} />
            <Route path="/products/:id" element={<AdminProductForm />} />
            <Route path="/admin/products/gallery" element={<AdminProductGallery />} />
            <Route path="/products/gallery" element={<AdminProductGallery />} />

            {/* Orders */}
            <Route path="/admin/orders" element={<AdminOrders />} />
            <Route path="/orders" element={<AdminOrders />} />
            <Route path="/admin/orders/initiated" element={<AdminInitiatedOrders />} />
            <Route path="/orders/initiated" element={<AdminInitiatedOrders />} />

            {/* Enquiries & Careers */}
            <Route path="/admin/enquiries" element={<AdminEnquiries />} />
            <Route path="/enquiries" element={<AdminEnquiries />} />
            <Route path="/admin/careers" element={<AdminCareers />} />
            <Route path="/careers" element={<AdminCareers />} />

            {/* Reviews */}
            <Route path="/admin/reviews" element={<AdminReviews />} />
            <Route path="/reviews" element={<AdminReviews />} />

            {/* Charges */}
            <Route path="/admin/charges" element={<AdminCharges />} />
            <Route path="/charges" element={<AdminCharges />} />

            {/* Users */}
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/users" element={<AdminUsers />} />

            {/* Footer Links */}
            <Route path="/admin/footer-links" element={<AdminFooterLinks />} />
            <Route path="/footer-links" element={<AdminFooterLinks />} />

            {/* Coupons */}
            <Route path="/admin/coupons" element={<AdminCoupons />} />
            <Route path="/coupons" element={<AdminCoupons />} />

            {/* Mail Templates */}
            <Route path="/admin/mail-templates" element={<AdminMailTemplates />} />
            <Route path="/mail-templates" element={<AdminMailTemplates />} />

            {/* Promotions */}
            <Route path="/admin/promotions" element={<AdminPromotionsRibbon />} />
            <Route path="/promotions" element={<AdminPromotionsRibbon />} />
            <Route path="/admin/promotions/ribbon" element={<AdminPromotionsRibbon />} />
          </Route>

          {/* Catch-all redirect to /admin */}
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
      <Toaster position="top-right" />
    </div>
  )
}

export default App
