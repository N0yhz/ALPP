'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { useToast } from '../lib/toast-context'
import { cn } from '../lib/utils'
import { Button } from './ui/button'
import { api } from '../lib/api'

const inputClass =
  'w-full px-4 py-3.5 bg-[var(--ailp-cream)] border border-[var(--ailp-border)] rounded-[10px] text-sm outline-none focus:border-[var(--ailp-olive)] transition-colors font-sans'

const labelClass = 'block text-xs font-semibold text-[var(--ailp-green)] mb-2 uppercase tracking-wide'

function Field({ label, children }) {
  return (
    <div className="flex flex-col">
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  )
}

export function AuthModal({ open, onClose, onLoginSuccess }) {
  const { showToast } = useToast()
  const [view, setView] = useState('login')
  const [activeTab, setActiveTab] = useState('login')
  const [loading, setLoading] = useState(false)

  // Verify modal state
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [tempEmail, setTempEmail] = useState('')
  const [tempResetEmail, setTempResetEmail] = useState('')

  if (!open && !verifyOpen) return null

  // ---- Login ----
  async function handleLogin(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = fd.get('email')
    const password = fd.get('password')
    
    setLoading(true)
    try {
      await api.login(email, password)
      onLoginSuccess(email)
      onClose()
      showToast('Successfully logged in!', 'info')
      e.target.reset()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // ---- Signup ----
  async function handleSignup(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = fd.get('email')
    const password = fd.get('password')
    
    setLoading(true)
    try {
      await api.register({ email, password })
      // OTP is disabled in backend, users can login immediately
      showToast('Account created! You can now log in.', 'info')
      setView('login')
      setActiveTab('login')
      e.target.reset()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // ---- Forgot ----
  async function handleForgot(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = fd.get('email')
    
    setLoading(true)
    try {
      await api.requestPasswordReset(email)
      setTempResetEmail(email)
      showToast('Reset code sent.', 'info')
      setView('reset')
      e.target.reset()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // ---- Reset ----
  async function handleReset(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    
    setLoading(true)
    try {
      await api.resetPassword(tempResetEmail, fd.get('code'), fd.get('newPassword'))
      showToast('Password updated. Please log in.', 'info')
      setView('login')
      setActiveTab('login')
      e.target.reset()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // ---- Verify ----
  async function handleVerify(e) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    
    setLoading(true)
    try {
      await api.verify(tempEmail, fd.get('code'))
      setVerifyOpen(false)
      // Note: Typically you'd log them in automatically after verify if possible, 
      // or redirect to login. Here we just show success.
      showToast('Email verified successfully. Please log in.', 'info')
      setView('login')
      setActiveTab('login')
      e.target.reset()
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  // ---- Verify Modal ----
  if (verifyOpen) {
    return (
      <div className="fixed inset-0 bg-[rgba(26,38,31,0.7)] flex items-center justify-center z-[3000] backdrop-blur-sm">
        <div className="bg-white border border-[var(--ailp-border)] rounded-3xl p-10 w-[420px] relative shadow-2xl text-center animate-in zoom-in-95 duration-200">
          <h3 className="font-[family-name:var(--font-heading)] text-2xl font-extrabold text-[var(--ailp-green)] mb-3">
            Verify Email
          </h3>
          <p className="text-[var(--ailp-dim)] text-sm mb-8">Enter the 6-digit code sent to your inbox.</p>
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <input
              name="code"
              type="text"
              maxLength={6}
              required
              placeholder="000000"
              className="w-full px-4 py-4 bg-[var(--ailp-cream)] border border-[var(--ailp-border)] rounded-[10px] outline-none focus:border-[var(--ailp-olive)] text-center tracking-[8px] text-2xl font-bold transition-colors"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-gradient-to-br from-[var(--ailp-green)] to-[var(--ailp-olive)] font-bold text-base rounded-[10px] text-white border-none shadow-md hover:-translate-y-0.5 transition-all"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>
          </form>
        </div>
      </div>
    )
  }

  const showTabs = view === 'login' || view === 'signup'

  return (
    <div className="fixed inset-0 bg-[rgba(26,38,31,0.7)] flex items-center justify-center z-[3000] backdrop-blur-sm">
      <div className="bg-white border border-[var(--ailp-border)] rounded-3xl p-10 w-[420px] relative shadow-2xl animate-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[var(--ailp-dim)] hover:text-[var(--ailp-green)] transition-colors"
        >
          <X size={22} />
        </button>

        {/* Tabs */}
        {showTabs && (
          <div className="bg-[var(--ailp-cream)] border border-[var(--ailp-border)] rounded-xl p-1.5 mb-6 flex gap-2">
            {['login', 'signup'].map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? "default" : "ghost"}
                onClick={() => { setActiveTab(tab); setView(tab) }}
                className={cn(
                  'flex-1 h-10 rounded-lg text-sm font-bold transition-all duration-200',
                  activeTab === tab
                    ? 'bg-[var(--ailp-green)] text-white shadow-sm'
                    : 'text-[var(--ailp-dim)] hover:text-[var(--ailp-green)] hover:bg-white/50'
                )}
              >
                {tab === 'login' ? 'Log In' : 'Sign Up'}
              </Button>
            ))}
          </div>
        )}

        {/* Login */}
        {view === 'login' && (
          <form onSubmit={handleLogin} className="flex flex-col gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
            <Field label="Email">
              <input name="email" type="email" placeholder="email@gmail.com" required className={inputClass} />
            </Field>
            <Field
              label={
                <span className="flex justify-between items-center">
                  Password
                  <button
                    type="button"
                    onClick={() => setView('forgot')}
                    className="text-[var(--ailp-green)] text-xs font-semibold normal-case tracking-normal hover:underline"
                  >
                    Forgot?
                  </button>
                </span>
              }
            >
              <input name="password" type="password" placeholder="••••••••" required className={inputClass} />
            </Field>
            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2 h-14 bg-gradient-to-br from-[var(--ailp-green)] to-[var(--ailp-olive)] font-bold text-base rounded-[10px] text-white border-none shadow-md hover:-translate-y-0.5"
            >
              {loading ? 'Connecting...' : 'Log In'}
            </Button>
          </form>
        )}


        {/* Signup */}
        {view === 'signup' && (
          <form onSubmit={handleSignup} className="flex flex-col gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
            <Field label="Work Email">
              <input name="email" type="email" placeholder="email@gmail.com" required className={inputClass} />
            </Field>
            <Field label="Password">
              <input name="password" type="password" placeholder="Create password" required className={inputClass} />
            </Field>
            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2 h-14 bg-gradient-to-br from-[var(--ailp-green)] to-[var(--ailp-olive)] font-bold text-base rounded-[10px] text-white border-none shadow-md hover:-translate-y-0.5"
            >
              {loading ? 'Registering...' : 'Create Account'}
            </Button>
          </form>
        )}

        {/* Forgot */}
        {view === 'forgot' && (
          <form onSubmit={handleForgot} className="flex flex-col gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
            <div className="mb-2">
              <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--ailp-green)] mb-1">
                Reset Password
              </h3>
              <p className="text-xs text-[var(--ailp-dim)]">Enter your email to receive a 6-digit reset code.</p>
            </div>
            <Field label="Email">
              <input name="email" type="email" placeholder="email@gmail.com" required className={inputClass} />
            </Field>
            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2 h-14 bg-gradient-to-br from-[var(--ailp-green)] to-[var(--ailp-olive)] font-bold text-base rounded-[10px] text-white border-none shadow-md hover:-translate-y-0.5"
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </Button>
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => { setView('login'); setActiveTab('login') }}
                className="text-xs text-[var(--ailp-dim)] hover:text-[var(--ailp-green)] transition-colors"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}

        {/* Reset */}
        {view === 'reset' && (
          <form onSubmit={handleReset} className="flex flex-col gap-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">
            <div className="mb-2">
              <h3 className="font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--ailp-green)] mb-1">
                Set New Password
              </h3>
              <p className="text-xs text-[var(--ailp-dim)]">Enter the 6-digit code sent to your email.</p>
            </div>
            <Field label="6-Digit Code">
              <input
                name="code"
                type="text"
                maxLength={6}
                required
                placeholder="000000"
                className="w-full px-4 py-3.5 bg-[var(--ailp-cream)] border border-[var(--ailp-border)] rounded-[10px] outline-none focus:border-[var(--ailp-olive)] text-center tracking-[8px] text-xl font-bold transition-colors"
              />
            </Field>
            <Field label="New Password">
              <input name="newPassword" type="password" required className={inputClass} />
            </Field>
            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-2 h-14 bg-gradient-to-br from-[var(--ailp-green)] to-[var(--ailp-olive)] font-bold text-base rounded-[10px] text-white border-none shadow-md hover:-translate-y-0.5"
            >
              {loading ? 'Confirming...' : 'Confirm Password'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
