'use client'

import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import { Bell, User } from 'lucide-react'
import { useToast } from '../lib/toast-context'
import { cn } from '../lib/utils'
import { Button } from './ui/button'

export function Navbar({
  isLoggedIn,
  userName,
  onOpenAuth,
  onOpenWorkspace,
  onManageClasses,
  onLogout,
  onDeleteAccount,
}) {
  const { showToast } = useToast()
  const [profileOpen, setProfileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifBadge, setNotifBadge] = useState(true)
  const profileRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    function handler(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const menuItemClass =
    'block px-5 py-3 text-sm font-medium text-[var(--ailp-dim)] hover:bg-[rgba(45,71,57,0.05)] hover:text-[var(--ailp-green)] transition-colors cursor-pointer'
  const dangerClass =
    'block px-5 py-3 text-sm font-medium text-[var(--ailp-dim)] hover:bg-red-50 hover:text-red-500 transition-colors cursor-pointer'

  return (
    <nav className="fixed top-0 w-full z-[100] backdrop-blur-xl border-b border-[var(--ailp-border)] bg-[rgba(253,249,241,0.85)]">
      <div className="max-w-[1240px] mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image
            src="https://cdn.prod.website-files.com/696e25af0e4b16dae2089a64/6a0890a884b8ef5559158236_Logo%20AILP%201.svg"
            alt="AILP Logo"
            width={32}
            height={32}
            className="h-8 w-auto"
          />
          <span className="font-[family-name:var(--font-heading)] font-extrabold text-xl text-[var(--ailp-green)]">
            AI Lesson Planning Platform
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-10">
          <a href="#features" className="text-sm font-semibold text-[var(--ailp-dim)] hover:text-[var(--ailp-green)] transition-colors">
            Features
          </a>
          <button
            onClick={() => showToast('Pricing coming soon.', 'info')}
            className="text-sm font-semibold text-[var(--ailp-dim)] hover:text-[var(--ailp-green)] transition-colors cursor-pointer"
          >
            Pricing
          </button>
          <a href="#contact" className="text-sm font-semibold text-[var(--ailp-dim)] hover:text-[var(--ailp-green)] transition-colors">
            Contact
          </a>
        </div>

        {/* Auth / Profile */}
        {!isLoggedIn ? (
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onOpenAuth}
              className="font-semibold text-[var(--ailp-dim)] hover:text-[var(--ailp-green)]"
            >
              Log In
            </Button>
            <Button
              onClick={onOpenAuth}
              className="bg-gradient-to-br from-[var(--ailp-green)] to-[var(--ailp-olive)] font-bold px-6 h-10 rounded-[10px] shadow-sm hover:shadow-md transition-all border-none"
            >
              Start Demo
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-5">
            {/* Notifications */}
            <div className="relative" ref={notifRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { setNotifOpen((p) => !p); setNotifBadge(false) }}
                className="relative text-[var(--ailp-dim)] hover:bg-[rgba(45,71,57,0.05)] hover:text-[var(--ailp-green)]"
              >
                <Bell size={20} />
                {notifBadge && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </Button>
              {notifOpen && (
                <div className="absolute top-14 right-0 bg-white border border-[var(--ailp-border)] rounded-xl w-64 shadow-xl z-[2500] overflow-hidden animate-in fade-in-0 zoom-in-95 duration-150">
                  <div className="px-4 py-3 font-bold text-[var(--ailp-green)] border-b border-[var(--ailp-border)] text-sm">
                    Notifications
                  </div>
                  <div className="flex items-start gap-3 px-4 py-3 text-xs text-[var(--ailp-dim)] hover:bg-[rgba(45,71,57,0.04)] cursor-pointer">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--ailp-olive)] flex-shrink-0" />
                    Lesson plan generated successfully.
                  </div>
                </div>
              )}
            </div>

            {/* Username */}
            <span className="text-sm font-semibold text-[var(--ailp-green)]">{userName}</span>

            {/* Avatar dropdown */}
            <div className="relative" ref={profileRef}>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setProfileOpen((p) => !p)}
                className="rounded-full border-[var(--ailp-border)] bg-[var(--ailp-cream)] text-[var(--ailp-dim)] hover:border-[var(--ailp-olive)] hover:text-[var(--ailp-green)]"
              >
                <User size={20} />
              </Button>
              {profileOpen && (
                <div className="absolute top-14 right-0 bg-white border border-[var(--ailp-border)] rounded-xl w-56 shadow-xl z-[2500] py-2 flex flex-col animate-in fade-in-0 zoom-in-95 duration-150">
                  <Button
                    variant="ghost"
                    className={cn(menuItemClass, "justify-start px-5 py-6 h-auto")}
                    onClick={() => { setProfileOpen(false); onOpenWorkspace() }}
                  >
                    🚀 Open Workspace
                  </Button>
                  <hr className="my-2 border-[var(--ailp-border)]" />
                  <Button
                    variant="ghost"
                    className={cn(menuItemClass, "justify-start px-5 py-6 h-auto")}
                    onClick={() => { setProfileOpen(false); showToast('Workspace Settings coming in V2.', 'info') }}
                  >
                    ⚙️ Workspace Settings
                  </Button>
                  <Button
                    variant="ghost"
                    className={cn(menuItemClass, "justify-start px-5 py-6 h-auto")}
                    onClick={() => { setProfileOpen(false); onManageClasses() }}
                  >
                    🏢 Manage Classes
                  </Button>
                  <Button
                    variant="ghost"
                    className={cn(dangerClass, "justify-start px-5 py-6 h-auto hover:bg-red-50 hover:text-red-500")}
                    onClick={() => { setProfileOpen(false); onDeleteAccount() }}
                  >
                    🗑 Delete Account
                  </Button>
                  <hr className="my-2 border-[var(--ailp-border)]" />
                  <Button
                    variant="ghost"
                    className={cn(menuItemClass, "justify-start px-5 py-6 h-auto")}
                    onClick={() => { setProfileOpen(false); onLogout() }}
                  >
                    Log Out
                  </Button>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
