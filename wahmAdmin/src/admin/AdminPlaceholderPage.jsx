import Card from '../components/ui/Card'
import AdminLayout from './AdminLayout'

const AdminPlaceholderPage = ({ title, subtitle, description }) => {
  return (
    <AdminLayout title={title} subtitle={subtitle}>
      <Card className="space-y-2">
        <h2 className="text-lg font-semibold text-illusion-black">{title}</h2>
        <p className="text-sm text-illusion-black/60">{description}</p>
      </Card>
    </AdminLayout>
  )
}

export default AdminPlaceholderPage
