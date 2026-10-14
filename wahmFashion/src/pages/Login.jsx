import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import {
  Phone,
  Mail,
  ArrowLeft,
  RefreshCw,
  CheckCircle2,
  X,
  AlertCircle,
} from 'lucide-react'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import { useAuth } from '../context/AuthContext'
import googleLogo from '../assets/google-logo.png'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const {
    user,
    loginWithGoogle,
    signupWithEmail,
    loginWithEmail,
    sendPhoneOtp,
    verifyPhoneOtp,
  } = useAuth()

  const [authMethod, setAuthMethod] = useState('phone') // 'phone' | 'email'
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [phoneStep, setPhoneStep] = useState('input') // 'input' | 'otp'
  const [confirmationResult, setConfirmationResult] = useState(null)
  const [resendTimer, setResendTimer] = useState(0)
  const [phoneError, setPhoneError] = useState('')
  const [phoneErrorCode, setPhoneErrorCode] = useState('')
  const [recaptchaSize, setRecaptchaSize] = useState('invisible') // 'invisible' | 'normal'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const rawFrom = location.state?.from
  const hasPendingCheckout = (() => {
    try {
      return sessionStorage.getItem('wahm_checkout_pending') === 'true'
    } catch {
      return false
    }
  })()

  const redirectPath =
    typeof rawFrom === 'string'
      ? rawFrom
      : rawFrom?.pathname
      ? `${rawFrom.pathname}${rawFrom.search || ''}`
      : location.state?.redirectTo || (hasPendingCheckout ? '/checkout' : '/')

  const finishAuth = () => {
    try {
      sessionStorage.removeItem('wahm_checkout_pending')
    } catch {}
    navigate(redirectPath, { replace: true })
  }

  useEffect(() => {
    if (user) {
      finishAuth()
    }
  }, [navigate, redirectPath, user])

  useEffect(() => {
    // Check if there is an active OTP cooldown from a previous send
    const storedCooldownEnd = sessionStorage.getItem('wahm_otp_cooldown_end')
    if (storedCooldownEnd) {
      const remaining = Math.ceil(
        (parseInt(storedCooldownEnd, 10) - Date.now()) / 1000
      )
      if (remaining > 0) {
        setResendTimer(remaining)
      } else {
        sessionStorage.removeItem('wahm_otp_cooldown_end')
      }
    }
  }, [])

  useEffect(() => {
    let interval = null
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            sessionStorage.removeItem('wahm_otp_cooldown_end')
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [resendTimer])

  useEffect(() => {
    return () => {
      if (window.__recaptchaVerifier) {
        try {
          window.__recaptchaVerifier.clear()
        } catch {}
        window.__recaptchaVerifier = null
      }
      const container = document.getElementById('login-recaptcha')
      if (container) {
        container.innerHTML = ''
      }
    }
  }, [])

  const formatDisplayPhone = (digits) => {
    if (!digits) return ''
    if (digits.length <= 5) return digits
    return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`
  }

  const handlePhoneChange = (e) => {
    const clean = e.target.value.replace(/\D/g, '').slice(0, 10)
    setPhone(clean)
    if (phoneError) {
      setPhoneError('')
      setPhoneErrorCode('')
    }
  }

  const handleSendPhoneOtp = async (e, overrideOptions = {}) => {
    e?.preventDefault?.()
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      toast.error('Please enter a valid 10-digit mobile number')
      return
    }

    if (resendTimer > 0 && phoneStep === 'input' && !overrideOptions.bypassVerification) {
      toast.error(`Please wait ${resendTimer}s before requesting another OTP`)
      return
    }

    setSubmitting(true)
    setPhoneError('')
    setPhoneErrorCode('')

    const sizeToUse = overrideOptions.size ?? recaptchaSize
    const bypassToUse = overrideOptions.bypassVerification ?? false

    try {
      const confirmation = await sendPhoneOtp(cleanPhone, 'login-recaptcha', {
        size: sizeToUse,
        bypassVerification: bypassToUse,
      })
      setConfirmationResult(confirmation)
      setPhoneStep('otp')
      const cooldownSecs = 60
      setResendTimer(cooldownSecs)
      sessionStorage.setItem(
        'wahm_otp_cooldown_end',
        String(Date.now() + cooldownSecs * 1000)
      )
      toast.success('OTP sent successfully via SMS!')
    } catch (err) {
      const code = err?.code || ''
      setPhoneErrorCode(code)

      let msg = err?.message ?? 'Failed to send OTP. Please try again.'
      if (code === 'auth/invalid-app-credential') {
        msg = 'Verification could not be completed. Please try again or sign in with Google.'
        setRecaptchaSize('normal')
      } else if (code === 'auth/operation-not-allowed') {
        msg = 'Mobile sign-in is temporarily unavailable. Please sign in with Google or Email.'
      } else if (code === 'auth/too-many-requests') {
        msg = 'Too many attempts. Please try again later or continue with Google or Email below.'
      } else if (code === 'auth/quota-exceeded') {
        msg = 'SMS service temporarily unavailable. Please sign in with Google or Email.'
      } else if (code === 'auth/invalid-phone-number') {
        msg = 'Please enter a valid 10-digit mobile number.'
      }

      setPhoneError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  const handleVerifyPhoneOtp = async (e, codeOverride) => {
    e?.preventDefault?.()
    if (submitting) return
    const targetOtp = (codeOverride ?? otp).replace(/\D/g, '').slice(0, 6)
    if (!targetOtp || targetOtp.length < 6) {
      toast.error('Please enter the 6-digit OTP')
      return
    }
    if (!confirmationResult) {
      setPhoneError('Session expired. Please request a new OTP.')
      setPhoneStep('input')
      return
    }

    setSubmitting(true)
    setPhoneError('')
    try {
      await verifyPhoneOtp(confirmationResult, targetOtp)
      toast.success('Logged in successfully!')
      finishAuth()
    } catch (err) {
      const msg = err?.message ?? 'Invalid OTP. Please check and try again.'
      setPhoneError(msg)
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  // Auto-fetch SMS OTP on mobile using the WebOTP API
  useEffect(() => {
    if (phoneStep !== 'otp' || !confirmationResult) return
    if (typeof window === 'undefined' || !('OTPCredential' in window)) return

    const ac = new AbortController()
    let active = true

    navigator.credentials
      .get({
        otp: { transport: ['sms'] },
        signal: ac.signal,
      })
      .then((otpCredential) => {
        if (active && otpCredential?.code) {
          const autoCode = otpCredential.code.replace(/\D/g, '').slice(0, 6)
          if (autoCode.length === 6) {
            setOtp(autoCode)
            toast.success('SMS OTP auto-detected!')
            handleVerifyPhoneOtp(null, autoCode)
          }
        }
      })
      .catch((err) => {
        if (err?.name !== 'AbortError') {
          console.debug('WebOTP auto-fetch info:', err?.message)
        }
      })

    return () => {
      active = false
      try {
        ac.abort()
      } catch {}
    }
  }, [phoneStep, confirmationResult])

  const handleLogin = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    try {
      await loginWithEmail(email, password)
      toast.success('Logged in successfully')
      finishAuth()
    } catch (error) {
      toast.error(error?.message ?? 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSignup = async () => {
    if (!email.trim() || !password) {
      toast.error('Please enter email and password')
      return
    }
    setSubmitting(true)
    try {
      await signupWithEmail(email, password)
      toast.success('Account created!')
      finishAuth()
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
      finishAuth()
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
              Wahm
            </p>
            <h1 className="text-3xl font-semibold text-illusion-black">
              {redirectPath === '/checkout' ? 'Sign in to Checkout' : 'Welcome back'}
            </h1>
            <p className="text-sm text-illusion-black/60">
              {redirectPath === '/checkout'
                ? 'Sign in or create an account to enter your delivery address. Your cart and discounts are safely preserved.'
                : 'Sign in to access your orders and wishlist.'}
            </p>
          </div>

          {/* Always-mounted reCAPTCHA container - never unmounted across step transitions */}
          <div id="login-recaptcha" className="flex justify-center empty:hidden"></div>

          {authMethod === 'phone' ? (
            phoneStep === 'input' ? (
              <form className="space-y-4" onSubmit={handleSendPhoneOtp}>
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label
                      htmlFor="mobile-input"
                      className="block text-xs font-medium text-illusion-black"
                    >
                      Mobile Number
                    </label>
                    <span className="text-[11px] font-medium text-illusion-black/45">
                      {phone.length}/10 digits
                    </span>
                  </div>

                  <div className="relative flex items-center rounded-2xl border border-illusion-black/15 bg-white shadow-soft transition-all focus-within:border-illusion-pink focus-within:ring-2 focus-within:ring-illusion-blush/60">
                    {/* Country Code with SVG Flag */}
                    <div className="flex shrink-0 select-none items-center gap-2 rounded-l-2xl border-r border-illusion-black/10 bg-illusion-black/[0.03] px-3.5 py-3 text-sm font-semibold text-illusion-black whitespace-nowrap">
                      <svg
                        className="h-3.5 w-5 shrink-0 overflow-hidden rounded-xs shadow-xs"
                        viewBox="0 0 640 480"
                        aria-hidden="true"
                      >
                        <path fill="#f93" d="M0 0h640v160H0z" />
                        <path fill="#fff" d="M0 160h640v160H0z" />
                        <path fill="#128807" d="M0 320h640v160H0z" />
                        <circle cx="320" cy="240" r="40" fill="#008" />
                        <circle cx="320" cy="240" r="35" fill="#fff" />
                        <circle cx="320" cy="240" r="8" fill="#008" />
                      </svg>
                      <span className="tracking-tight">+91</span>
                    </div>

                    {/* Formatted phone number input */}
                    <input
                      id="mobile-input"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={11}
                      placeholder="98765 43210"
                      value={formatDisplayPhone(phone)}
                      onChange={handlePhoneChange}
                      className="w-full bg-transparent px-3.5 py-3 text-sm font-medium tracking-wide text-illusion-black outline-none placeholder:font-normal placeholder:tracking-normal placeholder:text-illusion-black/35"
                      required
                    />

                    {/* Checkmark when valid or clear button */}
                    {phone.length === 10 ? (
                      <div className="mr-3 flex shrink-0 items-center text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    ) : phone.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPhone('')
                          setPhoneError('')
                          setPhoneErrorCode('')
                        }}
                        className="mr-3 flex shrink-0 items-center text-illusion-black/30 hover:text-illusion-black/70 transition"
                        aria-label="Clear phone number"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>

                {phoneError ? (
                  <div className="flex items-center gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/90 px-3.5 py-3 text-xs text-rose-800 shadow-xs">
                    <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                    <p className="flex-1 text-rose-700 leading-snug">{phoneError}</p>
                  </div>
                ) : null}

                <Button
                  type="submit"
                  className="w-full"
                  disabled={submitting || (resendTimer > 0 && phoneStep === 'input')}
                >
                  {submitting
                    ? 'Sending OTP...'
                    : resendTimer > 0 && phoneStep === 'input'
                    ? `Please wait ${resendTimer}s to send OTP`
                    : 'Send OTP'}
                </Button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleVerifyPhoneOtp}>
                <div className="rounded-2xl border border-illusion-pink/30 bg-illusion-blush/20 p-3.5 text-xs text-illusion-black/80">
                  <div className="flex items-center justify-between">
                    <span>
                      OTP sent to{' '}
                      <strong className="font-semibold text-illusion-black">
                        +91 {phone}
                      </strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneStep('input')
                        setOtp('')
                        setPhoneError('')
                      }}
                      className="inline-flex items-center gap-1 font-semibold text-rose-600 underline hover:text-rose-700"
                    >
                      <ArrowLeft className="h-3 w-3" /> Change
                    </button>
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="login-otp-input" className="block text-xs font-medium text-illusion-black">
                      6-Digit Verification Code (OTP)
                    </label>
                  </div>
                  <input
                    id="login-otp-input"
                    name="one-time-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                      setOtp(val)
                      if (val.length === 6 && !submitting) {
                        handleVerifyPhoneOtp(null, val)
                      }
                    }}
                    className="w-full rounded-2xl border border-illusion-black/15 bg-white px-4 py-3 text-center font-mono text-xl tracking-[0.5em] text-illusion-black shadow-soft outline-none transition-all focus:border-illusion-pink focus:ring-2 focus:ring-illusion-blush placeholder:tracking-normal placeholder:text-illusion-black/30"
                    required
                    autoFocus
                  />
                  <p className="mt-1 text-center text-[11px] text-illusion-black/50">
                    Auto-fills directly from SMS on mobile, or tap the code on your keyboard
                  </p>
                </div>

                {phoneError ? (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">
                    {phoneError}
                  </p>
                ) : null}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? 'Verifying...' : 'Verify OTP & Continue'}
                </Button>

                <div className="flex items-center justify-center pt-1 text-xs">
                  {resendTimer > 0 ? (
                    <span className="text-illusion-black/50">
                      Resend OTP in{' '}
                      <span className="font-semibold text-illusion-black">
                        {resendTimer}s
                      </span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendPhoneOtp}
                      disabled={submitting}
                      className="inline-flex items-center gap-1 font-semibold text-illusion-black underline hover:text-illusion-pink"
                    >
                      <RefreshCw className="h-3 w-3" /> Resend OTP
                    </button>
                  )}
                </div>
              </form>
            )
          ) : (
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
          )}

          <div className="flex items-center gap-4 text-xs text-illusion-black/40">
            <div className="h-px flex-1 bg-illusion-black/10" />
            or
            <div className="h-px flex-1 bg-illusion-black/10" />
          </div>

          <div className="space-y-2.5">
            {authMethod === 'phone' ? (
              <Button
                type="button"
                variant="ghost"
                className="w-full gap-2.5 border border-illusion-black/10 font-medium"
                onClick={() => {
                  setAuthMethod('email')
                  setPhoneError('')
                  setPhoneErrorCode('')
                }}
                disabled={submitting}
              >
                <Mail className="h-4 w-4 text-illusion-black/70" />
                Continue with Email
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                className="w-full gap-2.5 border border-illusion-black/10 font-medium"
                onClick={() => {
                  setAuthMethod('phone')
                  setPhoneError('')
                  setPhoneErrorCode('')
                }}
                disabled={submitting}
              >
                <Phone className="h-4 w-4 text-illusion-black/70" />
                Continue with Mobile Number
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              className="w-full gap-2.5 border border-illusion-black/10 font-medium"
              onClick={handleGoogle}
              disabled={submitting}
            >
              <img
                loading="lazy"
                decoding="async"
                src={googleLogo}
                alt="Google"
                className="h-4 w-4"
              />
              Continue with Google
            </Button>
          </div>

          <p className="pt-1 text-center text-[11px] text-illusion-black/45">
            Protected by reCAPTCHA &bull; Google{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-illusion-black"
            >
              Privacy
            </a>{' '}
            &amp;{' '}
            <a
              href="https://policies.google.com/terms"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-illusion-black"
            >
              Terms
            </a>
          </p>
        </Card>
      </div>
    </div>
  )
}

export default Login
