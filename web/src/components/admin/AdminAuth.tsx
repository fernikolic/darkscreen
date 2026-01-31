import { useState, useEffect, type ReactNode } from 'react'

interface AdminAuthProps {
  children: ReactNode
}

const ADMIN_SESSION_KEY = 'clawdentials_admin_session'

export function AdminAuth({ children }: AdminAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    // Check if already authenticated
    const session = localStorage.getItem(ADMIN_SESSION_KEY)
    if (session === 'authenticated') {
      setIsAuthenticated(true)
    }
    setChecking(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD

    if (!adminPassword) {
      setError('Admin password not configured')
      return
    }

    if (password === adminPassword) {
      localStorage.setItem(ADMIN_SESSION_KEY, 'authenticated')
      setIsAuthenticated(true)
    } else {
      setError('Invalid password')
      setPassword('')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_SESSION_KEY)
    setIsAuthenticated(false)
    setPassword('')
  }

  if (checking) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-4"
            style={{ borderColor: 'var(--accent-coral)', borderTopColor: 'transparent' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="w-full max-w-sm p-8 rounded-2xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🔐</div>
            <h1 className="font-display font-bold text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>
              Admin Access
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Enter password to continue
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="w-full px-4 py-3 rounded-xl text-base font-medium outline-none transition-all mb-4"
              style={{
                background: 'var(--bg-elevated)',
                border: error ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                color: 'var(--text-primary)'
              }}
              onFocus={(e) => {
                if (!error) e.target.style.borderColor = 'var(--accent-coral)'
              }}
              onBlur={(e) => {
                if (!error) e.target.style.borderColor = 'var(--border-subtle)'
              }}
            />

            {error && (
              <p className="text-sm mb-4 text-center" style={{ color: '#ef4444' }}>
                {error}
              </p>
            )}

            <button type="submit" className="btn-primary w-full">
              Login
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Logout button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-secondary)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = '#ef4444'
            e.currentTarget.style.color = '#ef4444'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-subtle)'
            e.currentTarget.style.color = 'var(--text-secondary)'
          }}
        >
          Logout
        </button>
      </div>
      {children}
    </div>
  )
}
