import Card from '../components/ui/Card'
import AdminLayout from './AdminLayout'

const AdminDashboard = () => {
  return (
    <AdminLayout
      title="Dashboard"
      subtitle="Monitor operations and track performance."
    >
      <Card>
        <h2 className="text-xl font-semibold text-illusion-black">
          Admin Overview
        </h2>
        <p className="mt-2 text-sm text-illusion-black/60">
          Use the navigation to manage products, orders, customers, and
          promotions. This dashboard area is ready for analytics widgets,
          KPI cards, and workflow queues.
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-illusion-black/50">
            Orders
          </p>
          <h3 className="text-xl font-semibold text-illusion-black">
            0 pending
          </h3>
          <p className="text-sm text-illusion-black/60">
            Pending orders will appear here for review.
          </p>
        </Card>
        <Card className="space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-illusion-black/50">
            Inventory
          </p>
          <h3 className="text-xl font-semibold text-illusion-black">
            0 low stock
          </h3>
          <p className="text-sm text-illusion-black/60">
            Keep track of products that need restocking.
          </p>
        </Card>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboard
