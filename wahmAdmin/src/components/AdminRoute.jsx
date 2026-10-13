import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-illusion-black/60">
        Loading...
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />
  }

  if (user.status === 'disabled') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <div className="rounded-full bg-red-100 p-4 text-red-600">
          <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-illusion-black">Access Suspended</h2>
        <p className="max-w-md text-sm text-illusion-black/60">
          Your admin account has been disabled by an administrator. Please contact your team administrator.
        </p>
      </div>
    )
  }

  return children
}

export default AdminRoute
