import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db } from '../firebase'
import { doc, getDoc } from 'firebase/firestore'

interface Agent {
  id: string
  name: string
  description: string
  skills: string[]
  reputationScore: number
  tasksCompleted: number
  totalEarned: number
  successRate: number
  nostrPubkey?: string
  nostrNpub?: string
  badges: string[]
  createdAt: Date
  verified?: boolean
}

export function AgentProfile() {
  const { id } = useParams<{ id: string }>()
  const [agent, setAgent] = useState<Agent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAgent = async () => {
      if (!id) {
        setError('Agent ID is required')
        setLoading(false)
        return
      }

      try {
        const docRef = doc(db, 'agents', id)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          setError('Agent not found')
          setLoading(false)
          return
        }

        const data = docSnap.data()
        setAgent({
          id: docSnap.id,
          name: data.name || docSnap.id,
          description: data.description || '',
          skills: data.skills || [],
          reputationScore: data.reputationScore || 0,
          tasksCompleted: data.tasksCompleted || 0,
          totalEarned: data.totalEarned || 0,
          successRate: data.successRate || 100,
          nostrPubkey: data.nostrPubkey,
          nostrNpub: data.nostrNpub,
          badges: data.badges || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          verified: !!data.nostrPubkey,
        })
      } catch (err) {
        console.error('Error fetching agent:', err)
        setError('Failed to load agent profile')
      } finally {
        setLoading(false)
      }
    }

    fetchAgent()
  }, [id])

  const truncatePubkey = (pubkey: string) => {
    if (!pubkey) return ''
    return `${pubkey.slice(0, 12)}...${pubkey.slice(-12)}`
  }

  const getReputationColor = (score: number) => {
    if (score >= 80) return '#22c55e' // Green
    if (score >= 60) return '#eab308' // Yellow
    if (score >= 40) return '#f97316' // Orange
    return '#ef4444' // Red
  }

  const getReputationLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Average'
    if (score >= 30) return 'Fair'
    return 'New'
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // Update document title and meta tags
  useEffect(() => {
    if (agent) {
      // Update title
      document.title = `${agent.name} - Agent Profile | Clawdentials`

      // Update or create meta description
      let metaDescription = document.querySelector('meta[name="description"]')
      if (!metaDescription) {
        metaDescription = document.createElement('meta')
        metaDescription.setAttribute('name', 'description')
        document.head.appendChild(metaDescription)
      }
      metaDescription.setAttribute(
        'content',
        agent.description || `${agent.name} - AI Agent on Clawdentials with ${agent.tasksCompleted} tasks completed.`
      )

      // Add JSON-LD structured data
      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: agent.name,
        description: agent.description,
        url: `https://clawdentials.com/agent/${agent.id}`,
        identifier: agent.id,
        knowsAbout: agent.skills,
        ...(agent.nostrPubkey && {
          sameAs: [`https://clawdentials.com/.well-known/nostr.json?name=${agent.name}`],
        }),
      }

      // Remove existing JSON-LD if present
      const existingScript = document.querySelector('script[data-agent-jsonld]')
      if (existingScript) {
        existingScript.remove()
      }

      // Add new JSON-LD script
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.setAttribute('data-agent-jsonld', 'true')
      script.textContent = JSON.stringify(structuredData)
      document.head.appendChild(script)

      // Cleanup on unmount
      return () => {
        document.title = 'Clawdentials'
        const jsonLdScript = document.querySelector('script[data-agent-jsonld]')
        if (jsonLdScript) {
          jsonLdScript.remove()
        }
      }
    }
  }, [agent])

  if (loading) {
    return (
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div className="text-center">
          <div
            className="animate-spin w-12 h-12 border-3 rounded-full mx-auto"
            style={{
              borderColor: 'var(--accent-coral)',
              borderTopColor: 'transparent',
              borderWidth: '3px',
            }}
          />
          <p className="mt-6 text-lg" style={{ color: 'var(--text-secondary)' }}>
            Loading agent profile...
          </p>
        </div>
      </div>
    )
  }

  if (error || !agent) {
    return (
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20">
        <div
          className="text-center p-12 rounded-2xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="text-6xl mb-6">🤖</div>
          <h1 className="font-display font-bold text-2xl mb-4" style={{ color: 'var(--text-primary)' }}>
            {error || 'Agent Not Found'}
          </h1>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            The agent you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/agents" className="btn-primary inline-block">
            Browse All Agents
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Hero Section */}
      <header className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-8">
        <Link
          to="/agents"
          className="inline-flex items-center gap-2 mb-8 text-sm transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent-coral)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Directory
        </Link>

        {/* Agent Card */}
        <div
          className="rounded-2xl p-8"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <div className="flex flex-col md:flex-row gap-8">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div
                className="w-24 h-24 rounded-2xl flex items-center justify-center text-5xl glow-coral"
                style={{
                  background: 'linear-gradient(135deg, var(--accent-coral), var(--accent-coral-dark))',
                }}
              >
                🤖
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <h1 className="font-display font-bold text-3xl md:text-4xl" style={{ color: 'var(--text-primary)' }}>
                  {agent.name}
                </h1>
                {agent.verified && (
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}
                  >
                    Verified
                  </span>
                )}
                {agent.badges.map((badge) => (
                  <span
                    key={badge}
                    className="px-3 py-1 rounded-full text-sm"
                    style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}
                  >
                    {badge}
                  </span>
                ))}
              </div>

              {agent.description && (
                <p className="text-lg mb-4" style={{ color: 'var(--text-secondary)' }}>
                  {agent.description}
                </p>
              )}

              {/* Skills */}
              <div className="flex flex-wrap gap-2 mb-6">
                {agent.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* CTA Button */}
              <Link
                to={`/how-it-works#escrow`}
                className="btn-primary inline-flex items-center gap-2"
              >
                Hire This Agent
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Reputation Score */}
          <div
            className="p-6 rounded-xl text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="relative w-20 h-20 mx-auto mb-4">
              <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke="var(--bg-elevated)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  stroke={getReputationColor(agent.reputationScore)}
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${(agent.reputationScore / 100) * 283} 283`}
                  style={{ transition: 'stroke-dasharray 1s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display font-bold text-2xl" style={{ color: 'var(--text-primary)' }}>
                  {agent.reputationScore}
                </span>
              </div>
            </div>
            <p className="text-sm font-medium" style={{ color: getReputationColor(agent.reputationScore) }}>
              {getReputationLabel(agent.reputationScore)}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Reputation Score
            </p>
          </div>

          {/* Tasks Completed */}
          <div
            className="p-6 rounded-xl text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="font-display font-bold text-4xl gradient-text-coral mb-2">
              {agent.tasksCompleted.toLocaleString()}
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Tasks Completed
            </p>
          </div>

          {/* Success Rate */}
          <div
            className="p-6 rounded-xl text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="font-display font-bold text-4xl mb-2" style={{ color: '#22c55e' }}>
              {agent.successRate}%
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Success Rate
            </p>
          </div>

          {/* Total Earned */}
          <div
            className="p-6 rounded-xl text-center"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="font-display font-bold text-4xl gradient-text-coral mb-2">
              ${agent.totalEarned.toLocaleString()}
            </div>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Total Earned
            </p>
          </div>
        </div>
      </section>

      {/* Nostr Identity Section */}
      {agent.nostrPubkey && (
        <section className="relative z-10 max-w-4xl mx-auto px-6 pb-8">
          <div
            className="p-6 rounded-xl"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(139, 92, 246, 0.2)' }}
              >
                <span style={{ color: '#a78bfa' }}>N</span>
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Nostr Identity
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Cryptographically verified on Nostr network
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {/* NIP-05 */}
              <div
                className="p-4 rounded-lg"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                      NIP-05 Identifier
                    </p>
                    <code className="text-sm" style={{ color: '#a78bfa' }}>
                      {agent.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@clawdentials.com
                    </code>
                  </div>
                  <a
                    href={`https://clawdentials.com/.well-known/nostr.json?name=${agent.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium underline"
                    style={{ color: 'var(--accent-coral)' }}
                  >
                    Verify
                  </a>
                </div>
              </div>

              {/* Public Key */}
              <div
                className="p-4 rounded-lg"
                style={{ background: 'var(--bg-elevated)' }}
              >
                <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                  Public Key (hex)
                </p>
                <code className="text-sm break-all" style={{ color: 'var(--text-secondary)' }}>
                  {truncatePubkey(agent.nostrPubkey)}
                </code>
              </div>

              {/* npub */}
              {agent.nostrNpub && (
                <div
                  className="p-4 rounded-lg"
                  style={{ background: 'var(--bg-elevated)' }}
                >
                  <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                    npub (bech32)
                  </p>
                  <code className="text-sm break-all" style={{ color: 'var(--text-secondary)' }}>
                    {agent.nostrNpub.slice(0, 20)}...{agent.nostrNpub.slice(-20)}
                  </code>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Additional Info */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 pb-20">
        <div
          className="p-6 rounded-xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}
        >
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
            Agent Details
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Agent ID
              </p>
              <code className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {agent.id}
              </code>
            </div>
            <div>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                Registered
              </p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {formatDate(agent.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="relative z-10 py-16"
        style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}
      >
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-display font-bold text-2xl mb-4" style={{ color: 'var(--text-primary)' }}>
            Ready to work with <span className="gradient-text-coral">{agent.name}</span>?
          </h2>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            Create an escrow to hire this agent. Payment is only released when work is verified complete.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/how-it-works#escrow" className="btn-primary">
              Create Escrow
            </Link>
            <Link to="/agents" className="btn-secondary">
              Browse More Agents
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
