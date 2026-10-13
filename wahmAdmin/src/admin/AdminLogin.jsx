import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'
import wahmLogo from '../assets/wahm logo.png'

const AdminLogin = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loginWithEmail, signupWithEmail, logout } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirectPath = location.state?.from?.pathname ?? '/admin'

  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate(redirectPath, { replace: true })
    }
  }, [navigate, redirectPath, user])

  const handleLogin = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      const res = await loginWithEmail(email, password)
      if (res?.profile?.role !== 'admin' && user?.role !== 'admin') {
        toast.error('Account does not have admin privileges')
      } else {
        toast.success('Admin authenticated successfully')
        navigate(redirectPath)
      }
    } catch (error) {
      toast.error(error?.message ?? 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignup = async (event) => {
    event.preventDefault()
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      await signupWithEmail(email, password, name)
      toast.success('Admin account created successfully!')
      navigate(redirectPath)
    } catch (error) {
      toast.error(error?.message ?? 'Signup failed')
    } finally {
      setSubmitting(false)
    }
  }

  // If already logged in but not an admin
  if (user && user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-illusion-blush/20 p-4">
        <Card className="w-full max-w-md space-y-4 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 font-bold">
            !
          </div>
          <h1 className="text-xl font-bold text-illusion-black">Access Denied</h1>
          <p className="text-sm text-illusion-black/70">
            You are signed in as <strong>{user.email}</strong>, which does not have admin access.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={logout}
          >
            Sign out & switch account
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-illusion-blush/20 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <img src={wahmLogo} alt="Wahm Logo" className="mx-auto h-12 w-auto object-contain mb-2" />
          <h2 className="text-2xl font-bold tracking-tight text-illusion-black">
            Admin Portal
          </h2>
          <p className="mt-1 text-sm text-illusion-black/60">
            {isSignUp
              ? 'Create a new administrator account with email and password'
              : 'Sign in to access store management and analytics'}
          </p>
        </div>

        <Card className="space-y-6">
          {/* Tab Selector */}
          <div className="flex rounded-full bg-illusion-black/5 p-1">
            <button
              type="button"
              onClick={() => setIsSignUp(false)}
              className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-all ${
                !isSignUp
                  ? 'bg-white text-illusion-black shadow-sm'
                  : 'text-illusion-black/60 hover:text-illusion-black'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setIsSignUp(true)}
              className={`flex-1 rounded-full py-2.5 text-sm font-medium transition-all ${
                isSignUp
                  ? 'bg-white text-illusion-black shadow-sm'
                  : 'text-illusion-black/60 hover:text-illusion-black'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Form */}
          {!isSignUp ? (
            <form className="space-y-4" onSubmit={handleLogin}>
              <Input
                label="Admin Email"
                type="email"
                placeholder="admin@wahm.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Authenticating...' : 'Sign In as Admin'}
              </Button>
            </form>
          ) : (
            <form className="space-y-4" onSubmit={handleSignup}>
              <Input
                label="Full Name"
                type="text"
                placeholder="Admin Name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
              <Input
                label="Admin Email"
                type="email"
                placeholder="admin@wahm.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <Input
                label="Password (min 6 characters)"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <Input
                label="Confirm Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Creating Account...' : 'Create Admin Account'}
              </Button>
            </form>
          )}

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => setIsSignUp((prev) => !prev)}
              className="text-xs text-illusion-black/60 hover:text-illusion-black underline"
            >
              {isSignUp
                ? 'Already have an admin account? Sign in here'
                : 'Need a new admin account? Register with email and password'}
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AdminLogin
