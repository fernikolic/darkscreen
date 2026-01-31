import type { ReactNode } from 'react'
import { Navigation } from './Navigation'
import { Footer } from './Footer'

interface LayoutProps {
  children: ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg-primary)' }}>
      <div className="noise-overlay" />

      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[600px] rounded-full opacity-30"
          style={{ background: 'radial-gradient(ellipse at center, rgba(59, 130, 246, 0.15) 0%, transparent 70%)', filter: 'blur(80px)' }} />
        <div className="absolute top-1/3 right-0 w-[600px] h-[600px] rounded-full opacity-20"
          style={{ background: 'radial-gradient(ellipse at center, rgba(37, 99, 235, 0.15) 0%, transparent 70%)', filter: 'blur(80px)' }} />
      </div>

      <Navigation />
      {children}
      <Footer />
    </div>
  )
}
