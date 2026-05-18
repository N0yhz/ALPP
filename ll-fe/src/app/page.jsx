'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ToastProvider, useToast } from '../lib/toast-context'
import { Navbar } from '../components/navbar'
import { LandingPage } from '../components/landing'
import { AuthModal } from '../components/auth-modal'
import { api } from '../lib/api'

// Placeholders for missing components to prevent crash
const Workspace = () => null
const ManageClassesModal = () => null
const ConfirmModal = () => null


const INITIAL_CLASSES = [
  { name: 'Grade 10B Biology', mainSubject: 'Biology', standardTags: ['Ph.9.3.2'] },
]

function AppContent() {
  const { showToast } = useToast()
  const router = useRouter()

  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('Educator')

  useEffect(() => {
    api.getMe()
      .then((user) => {
        setIsLoggedIn(true)
        setUserName(user.email.split('@')[0])
        router.push('/chat')
      })
      .catch(() => {
        setIsLoggedIn(false)
      })
  }, [router])

  // Modal state
  const [authOpen, setAuthOpen] = useState(false)
  const [manageClassesOpen, setManageClassesOpen] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)

  // Data
  const [classes, setClasses] = useState(INITIAL_CLASSES)

  function handleLoginSuccess(email) {
    setIsLoggedIn(true)
    setUserName(email.split('@')[0])
    router.push('/chat')
  }

  async function handleLogout() {
    try {
      await api.logout()
    } catch (err) {
      console.error('Logout failed', err)
    }
    setIsLoggedIn(false)
    setUserName('Educator')
    document.body.style.overflow = 'auto'
    setLogoutConfirmOpen(false)
    showToast('Logged out.', 'info')
  }

  async function handleDeleteAccount() {
    try {
      await api.deleteAccount()
      showToast('Account deleted permanently.', 'info')
    } catch (err) {
      showToast('Failed to delete account: ' + err.message, 'error')
      return
    }
    setIsLoggedIn(false)
    setUserName('Educator')
    document.body.style.overflow = 'auto'
    setDeleteAccountOpen(false)
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[var(--ailp-cream)]">
      {/* Decorative background */}
      <div className="fixed inset-0 -z-10 bg-[var(--ailp-cream)]">
        {/* Paper texture */}
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/natural-paper.png')" }}
        />
        {/* Circuit grid */}
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage: 'radial-gradient(rgba(45,71,57,0.15) 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />
        {/* Glow spheres */}
        <div
          className="ball-green absolute w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: 'var(--ailp-olive)', filter: 'blur(120px)', top: '-100px', left: '-200px' }}
        />
        <div
          className="ball-gold absolute w-[400px] h-[400px] rounded-full opacity-10"
          style={{ background: 'var(--ailp-gold)', filter: 'blur(120px)', bottom: '-100px', right: '-100px' }}
        />
      </div>

      <Navbar
        isLoggedIn={isLoggedIn}
        userName={userName}
        onOpenAuth={() => setAuthOpen(true)}
        onOpenWorkspace={() => router.push('/chat')}
        onManageClasses={() => setManageClassesOpen(true)}
        onLogout={() => setLogoutConfirmOpen(true)}
        onDeleteAccount={() => setDeleteAccountOpen(true)}
      />

      <LandingPage onOpenAuth={() => setAuthOpen(true)} />

      {/* Auth modal */}
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Manage Classes */}
      <ManageClassesModal
        open={manageClassesOpen}
        classes={classes}
        onClose={() => setManageClassesOpen(false)}
        onChange={setClasses}
      />

      {/* Logout confirm */}
      {logoutConfirmOpen && (
        <ConfirmModal
          title="Log Out?"
          message="Are you sure you want to log out of AILP?"
          confirmLabel="Log Out"
          onCancel={() => setLogoutConfirmOpen(false)}
          onConfirm={handleLogout}
        />
      )}

      {/* Delete account confirm */}
      {deleteAccountOpen && (
        <ConfirmModal
          title="Delete Account?"
          message="This action is permanent. All your classes and lesson plans will be lost."
          confirmLabel="Delete"
          onCancel={() => setDeleteAccountOpen(false)}
          onConfirm={handleDeleteAccount}
          danger
        />
      )}
    </div>
  )
}

export default function Page() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}
