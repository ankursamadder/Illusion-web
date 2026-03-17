import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'
import googleLogo from '../assets/google-logo.png'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loginWithGoogle, signupWithEmail, loginWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const redirectPath = location.state?.from?.pathname ?? '/'

  useEffect(() => {
    if (user) {
      navigate(redirectPath, { replace: true })
    }
  }, [navigate, redirectPath, user])

  const handleLogin = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await loginWithEmail(email, password)
      toast.success('Logged in successfully')
      navigate(redirectPath)
    } catch (error) {
      toast.error(error?.message ?? 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignup = async () => {
    setSubmitting(true)
    try {
      await signupWithEmail(email, password)
      toast.success('Account created!')
      navigate(redirectPath)
    } catch (error) {
      toast.error(error?.message ?? 'Signup failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGoogle = async () => {
    setSubmitting(true)
    try {
      await loginWithGoogle()
      toast.success('Logged in successfully')
      navigate(redirectPath)
    } catch (error) {
      toast.error(error?.message ?? 'Google login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-[70vh] bg-illusion-blush/20 py-16">
      <div className="mx-auto w-full max-w-lg px-4">
        <Card className="space-y-6">
          <div className="space-y-2 text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-illusion-black/50">
              Illusion
            </p>
            <h1 className="text-3xl font-semibold text-illusion-black">
              Welcome back
            </h1>
            <p className="text-sm text-illusion-black/60">
              Sign in to access your orders and wishlist.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleLogin}>
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
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
            <div className="grid gap-3 sm:grid-cols-2">
              <Button type="submit" disabled={submitting}>
                Login
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={submitting}
                onClick={handleSignup}
              >
                Signup
              </Button>
            </div>
          </form>

          <div className="flex items-center gap-4 text-xs text-illusion-black/40">
            <div className="h-px flex-1 bg-illusion-black/10" />
            or
            <div className="h-px flex-1 bg-illusion-black/10" />
          </div>

          <Button
            type="button"
            variant="ghost"
            className="w-full gap-2 border border-illusion-black/10"
            onClick={handleGoogle}
            disabled={submitting}
          >
            <img loading="lazy" decoding="async" src={googleLogo} alt="Google" className="h-4 w-4" />
            Continue with Google
          </Button>
        </Card>
      </div>
    </div>
  )
}

export default Login
