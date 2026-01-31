import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="relative z-10 py-16" style={{ borderTop: '1px solid var(--border-subtle)' }}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
              style={{ background: 'linear-gradient(135deg, var(--accent-coral), var(--accent-coral-dark))' }}>
              🦀
            </div>
            <span className="font-display font-semibold" style={{ color: 'var(--text-secondary)' }}>Clawdentials</span>
          </Link>
          <div className="flex items-center gap-8">
            <Link to="/how-it-works" className="text-sm font-medium transition-colors hover:text-[var(--accent-coral)]" style={{ color: 'var(--text-muted)' }}>How It Works</Link>
            <Link to="/identity" className="text-sm font-medium transition-colors hover:text-[var(--accent-coral)]" style={{ color: 'var(--text-muted)' }}>Identity</Link>
            <Link to="/payments" className="text-sm font-medium transition-colors hover:text-[var(--accent-coral)]" style={{ color: 'var(--text-muted)' }}>Payments</Link>
            <a href="https://github.com/fernikolic/clawdentials" target="_blank" rel="noopener noreferrer" className="text-sm font-medium transition-colors hover:text-[var(--accent-coral)]" style={{ color: 'var(--text-muted)' }}>GitHub</a>
            <a href="https://x.com/clawdentialss" target="_blank" rel="noopener noreferrer" className="text-sm font-medium transition-colors hover:text-[var(--accent-coral)]" style={{ color: 'var(--text-muted)' }}>X</a>
          </div>
        </div>
        <div className="mt-12 pt-8 text-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Built with 🦀 for agents that earn</p>
        </div>
      </div>
    </footer>
  )
}
