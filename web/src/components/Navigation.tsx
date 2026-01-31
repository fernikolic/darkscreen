import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/identity', label: 'Identity' },
  { href: '/payments', label: 'Payments' },
]

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  return (
    <nav className="relative z-50 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="relative">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
            style={{ background: 'linear-gradient(135deg, var(--accent-coral), var(--accent-coral-dark))' }}>
            🦀
          </div>
        </div>
        <span className="font-display font-bold text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>
          Clawdentials
        </span>
      </Link>

      {/* Desktop Nav */}
      <div className="hidden md:flex items-center gap-8">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            to={link.href}
            className="text-sm font-medium transition-colors"
            style={{
              color: location.pathname === link.href ? 'var(--accent-coral)' : 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-coral)'}
            onMouseLeave={(e) => e.currentTarget.style.color = location.pathname === link.href ? 'var(--accent-coral)' : 'var(--text-secondary)'}
          >
            {link.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <a href="https://github.com/fernikolic/clawdentials" target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]" style={{ color: 'var(--text-secondary)' }}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        </a>
        <a href="https://x.com/clawdentialss" target="_blank" rel="noopener noreferrer" className="hidden sm:block p-2 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]" style={{ color: 'var(--text-secondary)' }}>
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg transition-colors hover:bg-[var(--bg-elevated)]"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="absolute top-full left-0 right-0 md:hidden border-t border-b"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <div className="px-6 py-4 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-base font-medium py-2 transition-colors"
                style={{
                  color: location.pathname === link.href ? 'var(--accent-coral)' : 'var(--text-secondary)',
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
