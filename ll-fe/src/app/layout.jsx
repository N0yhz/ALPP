import { Urbanist, Geist } from 'next/font/google'
import '../styles/globals.css'
import { cn } from "../lib/utils";

const urbanist = Urbanist({
  subsets: ['latin'],
  variable: '--font-heading',
  weight: ['700', '800'],
})

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

export const metadata = {
  title: 'AI Lesson Planning Platform',
  description: 'Plan Lessons in Minutes, Not Hours. Automatic generation of lesson plans and materials based on MON standards and textbooks.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={cn("bg-background", urbanist.variable, "font-sans", geist.variable)}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  )
}
