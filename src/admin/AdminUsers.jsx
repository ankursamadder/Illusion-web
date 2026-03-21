import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import AdminLayout from './AdminLayout'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { useAuth } from '../context/AuthContext'
import { deleteUser, getUsers, updateUser } from '../services/userService'

const roleOptions = ['user', 'admin']

const formatDate = (value) => {
  if (!value) return '-'
  if (typeof value?.toDate === 'function') {
    return value.toDate().toLocaleString()
  }
  return new Date(value).toLocaleString()
}

const UserRow = ({ userItem, isCurrentUser, onSaveRole, onDelete }) => {
  const [role, setRole] = useState(userItem.role ?? 'user')

  return (
    <tr className="border-b border-illusion-black/10">
      <td className="px-3 py-3 text-sm font-medium text-illusion-black">
        {userItem.name ?? 'Unnamed'}
      </td>
      <td className="px-3 py-3 text-sm text-illusion-black/70">{userItem.email}</td>
      <td className="px-3 py-3 text-sm">
        <select
          className="rounded-full border border-illusion-black/10 bg-white px-3 py-1.5 text-xs text-illusion-black outline-none"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          disabled={isCurrentUser}
        >
          {roleOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-3 text-sm text-illusion-black/60">
        {formatDate(userItem.createdAt)}
      </td>
      <td className="px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          {isCurrentUser ? (
            <Badge variant="soft">You</Badge>
          ) : null}
          <Button
            size="sm"
            onClick={() => onSaveRole(userItem.id, role)}
            disabled={isCurrentUser || role === (userItem.role ?? 'user')}
          >
            Save role
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="border border-red-200 text-red-500 hover:text-red-600"
            onClick={() => onDelete(userItem)}
            disabled={isCurrentUser}
          >
            Delete
          </Button>
        </div>
      </td>
    </tr>
  )
}

const AdminUsers = () => {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const loadUsers = async () => {
    setLoading(true)
    try {
      const data = await getUsers()
      setUsers(data)
    } catch (error) {
      toast.error(error?.message ?? 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const handleSaveRole = async (id, role) => {
    try {
      await updateUser(id, { role })
      toast.success('User role updated')
      await loadUsers()
    } catch (error) {
      toast.error(error?.message ?? 'Failed to update role')
    }
  }

  const handleDelete = async (userItem) => {
    const confirmed = window.confirm(
      `Delete user record for ${userItem.email}? This removes Firestore profile data.`
    )
    if (!confirmed) return

    try {
      await deleteUser(userItem.id)
      toast.success('User deleted')
      await loadUsers()
    } catch (error) {
      toast.error(error?.message ?? 'Failed to delete user')
    }
  }

  return (
    <AdminLayout
      title="Manage Users"
      subtitle="Change user roles and remove user profile records."
    >
      {loading ? (
        <Card className="text-sm text-illusion-black/60">Loading users...</Card>
      ) : users.length ? (
        <Card className="overflow-hidden p-0">
          <div className="admin-scroll-mobile overflow-x-auto">
            <table className="min-w-[760px] text-left">
              <thead className="bg-illusion-blush/30">
                <tr>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Name
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Email
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Role
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Created
                  </th>
                  <th className="px-3 py-3 text-xs uppercase tracking-[0.1em] text-illusion-black/60">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((userItem) => (
                  <UserRow
                    key={userItem.id}
                    userItem={userItem}
                    isCurrentUser={userItem.id === user?.uid}
                    onSaveRole={handleSaveRole}
                    onDelete={handleDelete}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card className="text-sm text-illusion-black/60">No users found.</Card>
      )}
    </AdminLayout>
  )
}

export default AdminUsers
