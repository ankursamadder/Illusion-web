import { useEffect, useState } from 'react'
import {
  Check,
  ChevronRight,
  CreditCard,
  Edit2,
  KeyRound,
  Plus,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import Modal from '../components/ui/Modal'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { useAuth } from '../context/AuthContext'
import {
  addAdminUser,
  defaultPermissions,
  deleteAdmin,
  getAdmins,
  rolePresetPermissions,
  updateAdminAccess,
} from '../services/adminUserService'
import {
  defaultPaymentSettings,
  getPaymentSettings,
  savePaymentSettings,
} from '../services/paymentSettingsService'

const roleLabels = {
  superadmin: 'Super Admin',
  admin: 'Admin',
  manager: 'Manager',
  editor: 'Editor',
}

const roleColors = {
  superadmin: 'bg-purple-100 text-purple-800 border-purple-200',
  admin: 'bg-blue-100 text-blue-800 border-blue-200',
  manager: 'bg-teal-100 text-teal-800 border-teal-200',
  editor: 'bg-amber-100 text-amber-800 border-amber-200',
}

const permissionLabels = {
  canManageProducts: 'Manage Products & Inventory',
  canManageOrders: 'Manage Orders & Shipments',
  canManageUsers: 'Manage Customer Users',
  canManageSettings: 'Manage Store Settings & Payments',
  canManagePromotions: 'Manage Banners & Ribbon',
  canManageCoupons: 'Manage Discount Coupons',
}

const AdminSettingsModal = ({ open, onClose }) => {
  const { user: currentUser } = useAuth()
  const [activeTab, setActiveTab] = useState('admins') // 'admins' | 'payments'

  // Admin users state
  const [admins, setAdmins] = useState([])
  const [loadingAdmins, setLoadingAdmins] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState(null)

  // Add admin form state
  const [newAdminEmail, setNewAdminEmail] = useState('')
  const [newAdminName, setNewAdminName] = useState('')
  const [newAdminRole, setNewAdminRole] = useState('admin')
  const [newAdminPermissions, setNewAdminPermissions] = useState(
    rolePresetPermissions.admin
  )
  const [savingNewAdmin, setSavingNewAdmin] = useState(false)

  // Payment settings state
  const [paymentSettings, setPaymentSettings] = useState(defaultPaymentSettings)
  const [paymentSettingsDraft, setPaymentSettingsDraft] = useState(
    defaultPaymentSettings
  )
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [savingPayments, setSavingPayments] = useState(false)

  // Load admins
  const loadAdminsList = async () => {
    setLoadingAdmins(true)
    try {
      const list = await getAdmins()
      setAdmins(list)
    } catch (error) {
      toast.error(error?.message ?? 'Failed to load admin accounts')
    } finally {
      setLoadingAdmins(false)
    }
  }

  // Load payments
  const loadPaymentSettingsData = async () => {
    setLoadingPayments(true)
    try {
      const data = await getPaymentSettings()
      setPaymentSettings(data)
      setPaymentSettingsDraft(data)
    } catch (error) {
      toast.error(error?.message ?? 'Failed to load payment settings')
    } finally {
      setLoadingPayments(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadAdminsList()
      loadPaymentSettingsData()
    }
  }, [open])

  // Handle Add Admin
  const handleRoleChangeForNew = (role) => {
    setNewAdminRole(role)
    if (rolePresetPermissions[role]) {
      setNewAdminPermissions(rolePresetPermissions[role])
    }
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    if (!newAdminEmail.trim()) {
      toast.error('Email is required')
      return
    }

    setSavingNewAdmin(true)
    try {
      await addAdminUser({
        email: newAdminEmail.trim(),
        name: newAdminName.trim(),
        role: newAdminRole,
        permissions: newAdminPermissions,
        status: 'active',
      })
      toast.success(`Admin account created for ${newAdminEmail}`)
      setNewAdminEmail('')
      setNewAdminName('')
      setNewAdminRole('admin')
      setNewAdminPermissions(rolePresetPermissions.admin)
      setIsAddAdminOpen(false)
      await loadAdminsList()
    } catch (error) {
      toast.error(error?.message ?? 'Failed to create admin')
    } finally {
      setSavingNewAdmin(false)
    }
  }

  // Handle Quick Toggle Status
  const handleToggleStatus = async (admin) => {
    if (admin.id === currentUser?.uid || admin.email === currentUser?.email) {
      toast.error('You cannot disable your own admin account')
      return
    }

    const nextStatus = admin.status === 'disabled' ? 'active' : 'disabled'
    try {
      await updateAdminAccess(admin.id, { status: nextStatus })
      toast.success(
        `Admin access ${nextStatus === 'active' ? 'enabled' : 'disabled'} for ${admin.email || admin.name}`
      )
      setAdmins((prev) =>
        prev.map((item) =>
          item.id === admin.id ? { ...item, status: nextStatus } : item
        )
      )
    } catch (error) {
      toast.error(error?.message ?? 'Failed to update admin status')
    }
  }

  // Handle Save Edit Admin
  const handleSaveEditAdmin = async (adminId, updates) => {
    try {
      await updateAdminAccess(adminId, updates)
      toast.success('Admin permissions updated')
      setEditingAdmin(null)
      await loadAdminsList()
    } catch (error) {
      toast.error(error?.message ?? 'Failed to update permissions')
    }
  }

  // Handle Delete Admin
  const handleDeleteAdmin = async (admin) => {
    if (admin.id === currentUser?.uid || admin.email === currentUser?.email) {
      toast.error('You cannot delete your own admin account')
      return
    }

    const confirmed = window.confirm(
      `Remove admin access for ${admin.name || admin.email}? They will no longer be able to access the admin portal.`
    )
    if (!confirmed) return

    try {
      await deleteAdmin(admin.id)
      toast.success('Admin account removed')
      setAdmins((prev) => prev.filter((item) => item.id !== admin.id))
    } catch (error) {
      toast.error(error?.message ?? 'Failed to delete admin')
    }
  }

  // Handle Save Payments
  const handleSavePayments = async () => {
    setSavingPayments(true)
    try {
      await savePaymentSettings(paymentSettingsDraft)
      setPaymentSettings(paymentSettingsDraft)
      toast.success('Payment settings updated')
    } catch (error) {
      toast.error(error?.message ?? 'Failed to save payment settings')
    } finally {
      setSavingPayments(false)
    }
  }

  // Filtered admins
  const filteredAdmins = admins.filter((item) => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return true
    return (
      item.name?.toLowerCase().includes(q) ||
      item.email?.toLowerCase().includes(q) ||
      item.role?.toLowerCase().includes(q)
    )
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="3xl"
      className="max-w-5xl xl:max-w-6xl w-full"
      title="Admin Settings"
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-illusion-black/10">
          <button
            type="button"
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === 'admins'
                ? 'border-illusion-black text-illusion-black'
                : 'border-transparent text-illusion-black/50 hover:text-illusion-black'
            }`}
          >
            <Shield className="h-4 w-4" />
            Admin Users & Access Management
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payments')}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === 'payments'
                ? 'border-illusion-black text-illusion-black'
                : 'border-transparent text-illusion-black/50 hover:text-illusion-black'
            }`}
          >
            <CreditCard className="h-4 w-4" />
            Store Payment Methods
          </button>
        </div>

        {/* TAB 1: ADMIN USERS MANAGEMENT */}
        {activeTab === 'admins' ? (
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-semibold text-illusion-black">
                  Admin Team & Access Control
                </h3>
                <p className="text-xs text-illusion-black/60">
                  Manage permissions, assign administrative roles, and activate or revoke portal access.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={loadAdminsList}
                  disabled={loadingAdmins}
                  className="gap-1.5"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${loadingAdmins ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={() => setIsAddAdminOpen((prev) => !prev)}
                  className="gap-1.5"
                >
                  <Plus className="h-4 w-4" />
                  Add Admin
                </Button>
              </div>
            </div>

            {/* Add Admin Form (Collapsible) */}
            {isAddAdminOpen ? (
              <form
                onSubmit={handleCreateAdmin}
                className="rounded-2xl border border-illusion-black/15 bg-illusion-blush/20 p-4 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-illusion-black flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    New Admin Account
                  </h4>
                  <button
                    type="button"
                    onClick={() => setIsAddAdminOpen(false)}
                    className="rounded-full p-1 text-illusion-black/40 hover:text-illusion-black"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-medium text-illusion-black/70">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@thewahm.in"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-illusion-black/15 bg-white px-3 py-2 text-sm text-illusion-black outline-none focus:border-illusion-black"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-illusion-black/70">
                      Full Name
                    </label>
                    <input
                      type="text"
                      placeholder="Admin Name"
                      value={newAdminName}
                      onChange={(e) => setNewAdminName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-illusion-black/15 bg-white px-3 py-2 text-sm text-illusion-black outline-none focus:border-illusion-black"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-illusion-black/70">
                    Administrative Role
                  </label>
                  <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {Object.keys(roleLabels).map((roleKey) => (
                      <button
                        key={roleKey}
                        type="button"
                        onClick={() => handleRoleChangeForNew(roleKey)}
                        className={`rounded-xl border px-3 py-2 text-xs font-medium transition text-left ${
                          newAdminRole === roleKey
                            ? 'border-illusion-black bg-illusion-black text-white'
                            : 'border-illusion-black/15 bg-white text-illusion-black/70 hover:border-illusion-black/30'
                        }`}
                      >
                        <div className="font-semibold">{roleLabels[roleKey]}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-illusion-black/70">
                    Specific Permissions
                  </label>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {Object.keys(permissionLabels).map((permKey) => (
                      <label
                        key={permKey}
                        className="flex items-center gap-2.5 rounded-xl border border-illusion-black/10 bg-white px-3 py-2 text-xs text-illusion-black/80 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={!!newAdminPermissions[permKey]}
                          onChange={(e) =>
                            setNewAdminPermissions((prev) => ({
                              ...prev,
                              [permKey]: e.target.checked,
                            }))
                          }
                          className="h-3.5 w-3.5 rounded border-illusion-black/20"
                        />
                        <span>{permissionLabels[permKey]}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAddAdminOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" disabled={savingNewAdmin}>
                    {savingNewAdmin ? 'Saving...' : 'Create Admin'}
                  </Button>
                </div>
              </form>
            ) : null}

            {/* Search filter */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-illusion-black/40" />
              <input
                type="text"
                placeholder="Search admin by name, email, or role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-2xl border border-illusion-black/10 bg-illusion-blush/10 pl-9 pr-4 py-2 text-xs text-illusion-black outline-none focus:border-illusion-black/30"
              />
            </div>

            {/* Admins Table */}
            <div className="overflow-x-auto rounded-2xl border border-illusion-black/10">
              <table className="w-full text-left">
                <thead className="border-b border-illusion-black/10 bg-illusion-blush/30 text-[11px] font-semibold uppercase tracking-wider text-illusion-black/60">
                  <tr>
                    <th className="px-4 py-3">Admin User</th>
                    <th className="px-4 py-3">Role</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Permissions</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-illusion-black/10 text-xs">
                  {loadingAdmins ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-illusion-black/50">
                        Loading admin users...
                      </td>
                    </tr>
                  ) : filteredAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-illusion-black/50">
                        No admin accounts found.
                      </td>
                    </tr>
                  ) : (
                    filteredAdmins.map((admin) => {
                      const isMe =
                        admin.id === currentUser?.uid ||
                        admin.email === currentUser?.email
                      const roleBadgeClass =
                        roleColors[admin.role] ||
                        'bg-gray-100 text-gray-800 border-gray-200'
                      const isEditing = editingAdmin?.id === admin.id

                      return (
                        <tr
                          key={admin.id}
                          className={`hover:bg-illusion-blush/20 transition ${
                            admin.status === 'disabled' ? 'opacity-65 bg-red-50/20' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-illusion-blush font-semibold text-illusion-black">
                                {(admin.name?.[0] || admin.email?.[0] || 'A').toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 font-medium text-illusion-black">
                                  <span className="truncate">{admin.name || 'Unnamed Admin'}</span>
                                  {isMe ? (
                                    <span className="rounded-full bg-illusion-black/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-illusion-black">
                                      You
                                    </span>
                                  ) : null}
                                </div>
                                <div className="truncate text-[11px] text-illusion-black/60">
                                  {admin.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            {isEditing ? (
                              <select
                                value={editingAdmin.role || 'admin'}
                                onChange={(e) => {
                                  const nextRole = e.target.value
                                  setEditingAdmin((prev) => ({
                                    ...prev,
                                    role: nextRole,
                                    permissions:
                                      rolePresetPermissions[nextRole] ||
                                      prev.permissions,
                                  }))
                                }}
                                className="rounded-lg border border-illusion-black/20 bg-white px-2 py-1 text-xs outline-none"
                              >
                                {Object.keys(roleLabels).map((rKey) => (
                                  <option key={rKey} value={rKey}>
                                    {roleLabels[rKey]}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${roleBadgeClass}`}
                              >
                                {roleLabels[admin.role] || admin.role || 'Admin'}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => handleToggleStatus(admin)}
                              disabled={isMe}
                              title={isMe ? 'Cannot disable self' : 'Click to toggle access'}
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition ${
                                admin.status === 'disabled'
                                  ? 'border-red-200 bg-red-100 text-red-700 hover:bg-red-200'
                                  : 'border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              } ${isMe ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                            >
                              {admin.status === 'disabled' ? (
                                <>
                                  <UserX className="h-3 w-3" />
                                  Disabled
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-3 w-3" />
                                  Active
                                </>
                              )}
                            </button>
                          </td>

                          <td className="px-4 py-3">
                            {isEditing ? (
                              <div className="space-y-1.5 py-1">
                                {Object.keys(permissionLabels).map((pKey) => (
                                  <label
                                    key={pKey}
                                    className="flex items-center gap-2 text-[11px] text-illusion-black/80 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={!!editingAdmin.permissions?.[pKey]}
                                      onChange={(e) =>
                                        setEditingAdmin((prev) => ({
                                          ...prev,
                                          permissions: {
                                            ...(prev.permissions || {}),
                                            [pKey]: e.target.checked,
                                          },
                                        }))
                                      }
                                      className="h-3 w-3 rounded border-illusion-black/20"
                                    />
                                    <span>{permissionLabels[pKey]}</span>
                                  </label>
                                ))}
                              </div>
                            ) : (
                              <div className="flex flex-wrap gap-1 max-w-xs">
                                {Object.keys(permissionLabels)
                                  .filter(
                                    (pKey) =>
                                      admin.permissions?.[pKey] !== false &&
                                      (admin.role === 'superadmin' ||
                                        admin.permissions?.[pKey])
                                  )
                                  .slice(0, 3)
                                  .map((pKey) => (
                                    <span
                                      key={pKey}
                                      className="rounded bg-illusion-black/5 px-1.5 py-0.5 text-[9px] text-illusion-black/70"
                                    >
                                      {permissionLabels[pKey]?.split(' ')[1] || pKey}
                                    </span>
                                  ))}
                                {Object.keys(permissionLabels).filter(
                                  (pKey) =>
                                    admin.permissions?.[pKey] !== false &&
                                    (admin.role === 'superadmin' ||
                                      admin.permissions?.[pKey])
                                ).length > 3 ? (
                                  <span className="text-[9px] text-illusion-black/50">
                                    +
                                    {Object.keys(permissionLabels).filter(
                                      (pKey) =>
                                        admin.permissions?.[pKey] !== false &&
                                        (admin.role === 'superadmin' ||
                                          admin.permissions?.[pKey])
                                    ).length - 3}{' '}
                                    more
                                  </span>
                                ) : null}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {isEditing ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => setEditingAdmin(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleSaveEditAdmin(admin.id, {
                                        role: editingAdmin.role,
                                        permissions: editingAdmin.permissions,
                                      })
                                    }
                                  >
                                    Save
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingAdmin({
                                        id: admin.id,
                                        role: admin.role || 'admin',
                                        permissions:
                                          admin.permissions ||
                                          rolePresetPermissions[admin.role || 'admin'] ||
                                          defaultPermissions,
                                      })
                                    }
                                    className="rounded-lg p-1.5 text-illusion-black/60 hover:bg-illusion-blush hover:text-illusion-black"
                                    title="Edit Access & Permissions"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  {!isMe ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAdmin(admin)}
                                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700"
                                      title="Remove Admin"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  ) : null}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {/* TAB 2: PAYMENT SETTINGS */}
        {activeTab === 'payments' ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-illusion-black">
                Checkout Payment Gateways
              </h3>
              <p className="text-xs text-illusion-black/60">
                Configure payment gateways available to customers during storefront checkout.
              </p>
            </div>

            <div className="space-y-3">
              <label className="flex items-start justify-between gap-4 rounded-2xl border border-illusion-black/10 bg-white p-4 transition hover:border-illusion-black/25">
                <div>
                  <p className="text-sm font-medium text-illusion-black">
                    Cash on Delivery (COD)
                  </p>
                  <p className="text-xs text-illusion-black/55 mt-0.5">
                    Enable or disable cash payment collection on delivery for customer orders.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={paymentSettingsDraft.codEnabled}
                  onChange={(e) =>
                    setPaymentSettingsDraft((prev) => ({
                      ...prev,
                      codEnabled: e.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-illusion-black/20"
                  disabled={loadingPayments || savingPayments}
                />
              </label>

              <label className="flex items-start justify-between gap-4 rounded-2xl border border-illusion-black/10 bg-white p-4 transition hover:border-illusion-black/25">
                <div>
                  <p className="text-sm font-medium text-illusion-black">
                    Razorpay Online Payments
                  </p>
                  <p className="text-xs text-illusion-black/55 mt-0.5">
                    Accept online payments via UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, and Net Banking.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={paymentSettingsDraft.onlinePaymentEnabled}
                  onChange={(e) =>
                    setPaymentSettingsDraft((prev) => ({
                      ...prev,
                      onlinePaymentEnabled: e.target.checked,
                    }))
                  }
                  className="mt-1 h-4 w-4 rounded border-illusion-black/20"
                  disabled={loadingPayments || savingPayments}
                />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-illusion-black/10">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={handleSavePayments}
                disabled={loadingPayments || savingPayments}
              >
                {savingPayments ? 'Saving...' : 'Save Payment Settings'}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  )
}

export default AdminSettingsModal
