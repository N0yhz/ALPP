'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { useToast } from '../lib/toast-context'
import { Button } from './ui/button'

function useReveal() {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'translateY(0)'
        }
      },
      { threshold: 0.1 }
    )
    el.style.opacity = '0'
    el.style.transform = 'translateY(40px)'
    el.style.transition = '0.8s cubic-bezier(0.16, 1, 0.3, 1)'
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

const features = [
  { icon: '📄', title: 'AI Lesson Plans', desc: 'Generate detailed plans matching curriculum standards instantly.' },
  { icon: '🧪', title: 'Smart Lab', desc: 'Create quizzes, worksheets, and interactive tasks for any grade.' },
  { icon: '📚', title: 'Resource Library', desc: 'Sync with official textbooks and educational materials.' },
  { icon: '🎯', title: 'Teacher Co-Pilot', desc: 'AI suggests real-time improvements and personalized content.' },
  { icon: '📊', title: 'Class Analytics', desc: 'Track student engagement and progress on generated tasks.' },
  { icon: '📑', title: 'Automated Reports', desc: 'Generate academic reports and lesson summaries automatically.' },
]

function FeatureCard({ icon, title, desc }) {
  const ref = useReveal()
  return (
    <div
      ref={ref}
      className="p-10 bg-white rounded-[20px] border border-[var(--ailp-border)] hover:-translate-y-1 hover:border-[var(--ailp-olive)] hover:shadow-lg transition-all duration-300 group"
    >
      <div className="w-16 h-16 rounded-2xl bg-[rgba(141,182,65,0.1)] flex items-center justify-center text-3xl mb-5">
        {icon}
      </div>
      <h4 className="font-[family-name:var(--font-heading)] text-xl font-bold text-[var(--ailp-green)] mb-3">
        {title}
      </h4>
      <p className="text-[var(--ailp-dim)] text-[15px] leading-relaxed">{desc}</p>
    </div>
  )
}

export function LandingPage({ onOpenAuth }) {
  const { showToast } = useToast()
  const mockupRef = useReveal()
  const contactRef = useReveal()
  const sectionTitleRef = useReveal()

  async function handleContact(e) {
    e.preventDefault()
    const btn = e.currentTarget.querySelector('button[type="submit"]')
    const orig = btn.textContent
    btn.textContent = 'Sending...'
    btn.disabled = true
    await new Promise((r) => setTimeout(r, 1000))
    showToast('Message sent successfully! AILP team will contact you soon.', 'info')
    e.target.reset()
    btn.textContent = orig
    btn.disabled = false
  }

  return (
    <>
      {/* Hero */}
      <section className="pt-[180px] pb-24 text-center">
        <div className="max-w-[1240px] mx-auto px-6">
          <p className="text-xs uppercase tracking-[2px] font-extrabold text-[var(--ailp-olive)] mb-6">
            AI-Powered Assistant for Modern Educators
          </p>
          <h1 className="font-[family-name:var(--font-heading)] font-extrabold text-[clamp(2.5rem,7vw,4.5rem)] leading-[1.1] text-[var(--ailp-green)] mb-4 text-balance">
            Plan Lessons in{' '}
            <span className="text-[var(--ailp-olive)]">Minutes, Not Hours</span>
          </h1>
          <p className="text-xl text-[var(--ailp-dim)] max-w-2xl mx-auto mb-12 font-medium leading-relaxed">
            Automatic generation of lesson plans and materials based on MON standards and textbooks.
          </p>
          <div className="flex justify-center">
            <Button
              onClick={onOpenAuth}
              className="bg-gradient-to-br from-[var(--ailp-green)] to-[var(--ailp-olive)] font-bold px-9 h-14 rounded-[12px] text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-none"
            >
              Start Demo
            </Button>
          </div>

          <div
            ref={mockupRef}
            className="relative mt-16 rounded-3xl overflow-hidden border border-[var(--ailp-border)] shadow-[0_30px_80px_rgba(45,71,57,0.1)] bg-white p-2.5"
          >
            <Image
              src="/ALPP_Dashboard.png"
              alt="AILP Analytics Dashboard"
              width={1200}
              height={800}
              className="w-full h-auto block rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-[rgba(141,182,65,0.05)]">
        <div className="max-w-[1240px] mx-auto px-6">
          <h2
            ref={sectionTitleRef}
            className="font-[family-name:var(--font-heading)] text-[2.5rem] font-extrabold text-center text-[var(--ailp-green)] mb-16"
          >
            Elevate Your Teaching
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-24">
        <div className="max-w-[1240px] mx-auto px-6">
          <div
            ref={contactRef}
            className="bg-white border border-[var(--ailp-border)] rounded-3xl p-12 md:p-16 max-w-3xl mx-auto shadow-[0_20px_40px_rgba(45,71,57,0.05)]"
          >
            <div className="mb-8">
              <h2 className="font-[family-name:var(--font-heading)] text-3xl font-extrabold text-[var(--ailp-green)] mb-2">
                Contact Us
              </h2>
              <p className="text-[var(--ailp-dim)]">Bring AILP to your school. Together To The Top!</p>
            </div>
            <form onSubmit={handleContact} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[var(--ailp-green)] uppercase tracking-wide">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Your Full Name"
                  required
                  className="w-full px-4 py-3.5 bg-[var(--ailp-cream)] border border-[var(--ailp-border)] rounded-[10px] text-sm outline-none focus:border-[var(--ailp-olive)] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-[var(--ailp-green)] uppercase tracking-wide">
                  Work Email
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="email@gmail.com"
                  required
                  className="w-full px-4 py-3.5 bg-[var(--ailp-cream)] border border-[var(--ailp-border)] rounded-[10px] text-sm outline-none focus:border-[var(--ailp-olive)] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-2 md:col-span-2">
                <label className="text-xs font-semibold text-[var(--ailp-green)] uppercase tracking-wide">
                  Message
                </label>
                <textarea
                  name="message"
                  placeholder="Tell us about your educational needs..."
                  rows={4}
                  required
                  className="w-full px-4 py-3.5 bg-[var(--ailp-cream)] border border-[var(--ailp-border)] rounded-[10px] text-sm outline-none focus:border-[var(--ailp-olive)] transition-colors resize-none"
                />
              </div>
              <Button
                type="submit"
                className="md:col-span-2 bg-gradient-to-br from-[var(--ailp-green)] to-[var(--ailp-olive)] h-14 rounded-[10px] text-base font-bold text-white shadow-lg hover:-translate-y-0.5 transition-all duration-300 border-none"
              >
                Send Message
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-14 border-t border-[var(--ailp-border)] bg-white">
        <div className="max-w-[1240px] mx-auto px-6 flex items-center justify-between">
          <div>
            <div className="font-[family-name:var(--font-heading)] font-extrabold text-[var(--ailp-green)] text-lg mb-1">
              AI Lesson Planning Platform
            </div>
            <p className="text-sm text-[var(--ailp-dim)]">{"Save teachers' health and time. 2026 © Quadruple T"}</p>
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-[var(--ailp-dim)] hover:text-[var(--ailp-green)] transition-colors">
              Privacy
            </a>
            <a href="#" className="text-sm text-[var(--ailp-dim)] hover:text-[var(--ailp-green)] transition-colors">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </>
  )
}
