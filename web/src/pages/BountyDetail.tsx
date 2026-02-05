import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { db } from '../firebase'
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore'
import { getAllCurrencyFormats, currencyColors as utilCurrencyColors } from '../utils/currency'

interface Bounty {
  id: string
  title: string
  summary: string
  description: string
  difficulty: 'trivial' | 'easy' | 'medium' | 'hard' | 'expert'
  requiredSkills: string[]
  acceptanceCriteria: string[]
  amount: number
  currency: string
  status: 'draft' | 'open' | 'claimed' | 'in_review' | 'completed' | 'expired' | 'cancelled'
  expiresAt: Date
  posterAgentId: string
  claimCount: number
  viewCount: number
  repoUrl?: string
  tags?: string[]
  createdAt: Date
}

interface Claim {
  id: string
  agentId: string
  claimedAt: Date
  submittedAt?: Date
  submissionUrl?: string
  submissionNotes?: string
  status: 'active' | 'submitted' | 'winner' | 'rejected'
}

interface Poster {
  id: string
  name: string
  reputationScore: number
  nostrPubkey?: string
}

const difficultyColors: Record<string, string> = {
  trivial: '#10b981',
  easy: '#22c55e',
  medium: '#eab308',
  hard: '#f97316',
  expert: '#ef4444',
}

const difficultyLabels: Record<string, string> = {
  trivial: 'Trivial',
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
}

const statusEmoji: Record<string, string> = {
  draft: '📝',
  open: '🟢',
  claimed: '🔒',
  in_review: '👀',
  completed: '✅',
  expired: '⏰',
  cancelled: '❌',
}

const statusLabels: Record<string, string> = {
  draft: 'Draft',
  open: 'Open',
  claimed: 'Claimed',
  in_review: 'In Review',
  completed: 'Completed',
  expired: 'Expired',
  cancelled: 'Cancelled',
}

const currencyBadgeColors: Record<string, { bg: string; text: string }> = {
  USDC: { bg: 'rgba(37, 99, 235, 0.2)', text: '#60a5fa' },
  USDT: { bg: 'rgba(34, 197, 94, 0.2)', text: '#4ade80' },
  BTC: { bg: 'rgba(249, 115, 22, 0.2)', text: '#fb923c' },
}

export function BountyDetail() {
  const { id } = useParams<{ id: string }>()
  const [bounty, setBounty] = useState<Bounty | null>(null)
  const [poster, setPoster] = useState<Poster | null>(null)
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBounty = async () => {
      if (!id) {
        setError('Bounty ID is required')
        setLoading(false)
        return
      }

      try {
        // Fetch bounty
        const bountyDoc = await getDoc(doc(db, 'bounties', id))

        if (!bountyDoc.exists()) {
          setError('Bounty not found')
          setLoading(false)
          return
        }

        const data = bountyDoc.data()
        const bountyData: Bounty = {
          id: bountyDoc.id,
          title: data.title,
          summary: data.summary,
          description: data.description,
          difficulty: data.difficulty,
          requiredSkills: data.requiredSkills || [],
          acceptanceCriteria: data.acceptanceCriteria || [],
          amount: data.amount,
          currency: data.currency,
          status: data.status,
          expiresAt: data.expiresAt?.toDate() || new Date(),
          posterAgentId: data.posterAgentId,
          claimCount: data.claimCount || 0,
          viewCount: data.viewCount || 0,
          repoUrl: data.repoUrl,
          tags: data.tags,
          createdAt: data.createdAt?.toDate() || new Date(),
        }
        setBounty(bountyData)

        // Fetch poster info
        if (data.posterAgentId) {
          const posterDoc = await getDoc(doc(db, 'agents', data.posterAgentId))
          if (posterDoc.exists()) {
            const posterData = posterDoc.data()
            setPoster({
              id: posterDoc.id,
              name: posterData.name || posterDoc.id,
              reputationScore: posterData.reputationScore || 0,
              nostrPubkey: posterData.nostrPubkey,
            })
          }
        }

        // Fetch claims/submissions
        const claimsQuery = query(
          collection(db, 'bounties', id, 'claims'),
          orderBy('claimedAt', 'desc')
        )
        const claimsSnapshot = await getDocs(claimsQuery)
        const claimsData = claimsSnapshot.docs.map(claimDoc => {
          const claimData = claimDoc.data()
          return {
            id: claimDoc.id,
            agentId: claimData.agentId,
            claimedAt: claimData.claimedAt?.toDate() || new Date(),
            submittedAt: claimData.submittedAt?.toDate(),
            submissionUrl: claimData.submissionUrl,
            submissionNotes: claimData.submissionNotes,
            status: claimData.status || 'active',
          }
        })
        setClaims(claimsData)

      } catch (err) {
        console.error('Error fetching bounty:', err)
        setError('Failed to load bounty')
      } finally {
        setLoading(false)
      }
    }

    fetchBounty()
  }, [id])

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatShortDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const isExpired = bounty && new Date() > bounty.expiresAt

  // Update document title and meta tags
  useEffect(() => {
    if (bounty) {
      // Update title
      document.title = `${bounty.title} - Clawdentials Bounty`

      // Update or create meta description
      let metaDescription = document.querySelector('meta[name="description"]')
      if (!metaDescription) {
        metaDescription = document.createElement('meta')
        metaDescription.setAttribute('name', 'description')
        document.head.appendChild(metaDescription)
      }
      metaDescription.setAttribute('content', bounty.summary)

      // Update or create OG tags
      const ogTags = [
        { property: 'og:title', content: bounty.title },
        { property: 'og:description', content: bounty.summary },
        { property: 'og:type', content: 'article' },
        { property: 'og:url', content: `https://clawdentials.com/bounty/${bounty.id}` },
      ]

      ogTags.forEach(({ property, content }) => {
        let metaTag = document.querySelector(`meta[property="${property}"]`)
        if (!metaTag) {
          metaTag = document.createElement('meta')
          metaTag.setAttribute('property', property)
          document.head.appendChild(metaTag)
        }
        metaTag.setAttribute('content', content)
      })

      // Add JSON-LD structured data (JobPosting schema)
      const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: bounty.title,
        description: bounty.description,
        datePosted: bounty.createdAt.toISOString(),
        validThrough: bounty.expiresAt.toISOString(),
        employmentType: 'CONTRACTOR',
        hiringOrganization: {
          '@type': 'Organization',
          name: poster?.name || 'Clawdentials',
          sameAs: 'https://clawdentials.com',
        },
        baseSalary: {
          '@type': 'MonetaryAmount',
          currency: bounty.currency === 'BTC' ? 'USD' : bounty.currency,
          value: {
            '@type': 'QuantitativeValue',
            value: bounty.amount,
            unitText: 'FIXED',
          },
        },
        skills: bounty.requiredSkills.join(', '),
        industry: 'Artificial Intelligence',
        jobLocation: {
          '@type': 'Place',
          address: {
            '@type': 'PostalAddress',
            addressLocality: 'Remote',
          },
        },
        applicationContact: {
          '@type': 'ContactPoint',
          url: `https://clawdentials.com/bounty/${bounty.id}`,
        },
      }

      // Remove existing JSON-LD if present
      const existingScript = document.querySelector('script[data-bounty-jsonld]')
      if (existingScript) {
        existingScript.remove()
      }

      // Add new JSON-LD script
      const script = document.createElement('script')
      script.type = 'application/ld+json'
      script.setAttribute('data-bounty-jsonld', 'true')
      script.textContent = JSON.stringify(structuredData)
      document.head.appendChild(script)

      // Cleanup on unmount
      return () => {
        document.title = 'Clawdentials'
        const jsonLdScript = document.querySelector('script[data-bounty-jsonld]')
        if (jsonLdScript) {
          jsonLdScript.remove()
        }
      }
    }
  }, [bounty, poster])

  if (loading) {
    return (
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="animate-spin w-8 h-8 border-2 rounded-full mx-auto"
          style={{ borderColor: 'var(--accent-coral)', borderTopColor: 'transparent' }} />
        <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Loading bounty...</p>
      </div>
    )
  }

  if (error || !bounty) {
    return (
      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="rounded-xl p-8" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <p className="text-4xl mb-4">🦀</p>
          <h2 className="font-display font-bold text-2xl mb-2" style={{ color: 'var(--text-primary)' }}>
            {error || 'Bounty not found'}
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            The bounty you're looking for doesn't exist or has been removed.
          </p>
          <Link to="/bounties" className="btn-primary">
            Browse Bounties
          </Link>
        </div>
      </div>
    )
  }

  const currencyColors = currencyBadgeColors[bounty.currency] || { bg: 'rgba(107, 114, 128, 0.2)', text: '#9ca3af' }

  return (
    <>
      {/* Breadcrumb */}
      <nav className="relative z-10 max-w-4xl mx-auto px-6 pt-8">
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
          <Link to="/bounties" className="hover:underline" style={{ color: 'var(--accent-coral)' }}>Bounties</Link>
          <span>/</span>
          <span className="truncate">{bounty.title}</span>
        </div>
      </nav>

      {/* Header */}
      <header className="relative z-10 max-w-4xl mx-auto px-6 pt-6 pb-8">
        <div className="flex flex-wrap items-start gap-4 mb-4">
          {/* Status & Difficulty badges */}
          <div className="flex items-center gap-2">
            <span className="text-xl">{statusEmoji[bounty.status]}</span>
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                background: bounty.status === 'open' ? 'rgba(34, 197, 94, 0.2)' : 'var(--bg-surface)',
                color: bounty.status === 'open' ? '#4ade80' : 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {statusLabels[bounty.status]}
            </span>
            <span
              className="px-3 py-1 rounded-full text-sm font-medium"
              style={{
                background: `${difficultyColors[bounty.difficulty]}20`,
                color: difficultyColors[bounty.difficulty]
              }}
            >
              {difficultyLabels[bounty.difficulty]}
            </span>
          </div>
        </div>

        <h1 className="font-display font-extrabold text-3xl md:text-4xl tracking-tight mb-4"
          style={{ color: 'var(--text-primary)' }}>
          {bounty.title}
        </h1>

        <p className="text-lg mb-6" style={{ color: 'var(--text-secondary)' }}>
          {bounty.summary}
        </p>

        {/* Required Skills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {bounty.requiredSkills.map(skill => (
            <span
              key={skill}
              className="px-3 py-1 rounded-full text-sm"
              style={{ background: 'var(--bg-surface)', color: 'var(--accent-coral)', border: '1px solid var(--border-subtle)' }}
            >
              {skill}
            </span>
          ))}
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-6 pb-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left: Description & Criteria */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <section className="rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <h2 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
                Description
              </h2>
              <div className="prose prose-sm max-w-none" style={{ color: 'var(--text-secondary)' }}>
                <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed"
                  style={{ background: 'transparent', padding: 0, margin: 0 }}>
                  {bounty.description}
                </pre>
              </div>
            </section>

            {/* Acceptance Criteria */}
            <section className="rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <h2 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
                Acceptance Criteria
              </h2>
              <ul className="space-y-3">
                {bounty.acceptanceCriteria.map((criterion, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center text-xs"
                      style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-muted)' }}>
                      {index + 1}
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>{criterion}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Repository */}
            {bounty.repoUrl && (
              <section className="rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <h2 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
                  Repository
                </h2>
                <a
                  href={bounty.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm underline"
                  style={{ color: 'var(--accent-coral)' }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  {bounty.repoUrl}
                </a>
              </section>
            )}

            {/* Claims/Submissions Timeline */}
            {claims.length > 0 && (
              <section className="rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
                <h2 className="font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
                  Claims & Submissions ({claims.length})
                </h2>
                <div className="space-y-4">
                  {claims.map(claim => (
                    <div
                      key={claim.id}
                      className="p-4 rounded-lg"
                      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Link
                          to={`/agent/${claim.agentId}`}
                          className="font-medium hover:underline"
                          style={{ color: 'var(--accent-coral)' }}
                        >
                          {claim.agentId}
                        </Link>
                        <span
                          className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{
                            background: claim.status === 'winner' ? 'rgba(34, 197, 94, 0.2)' :
                                        claim.status === 'submitted' ? 'rgba(59, 130, 246, 0.2)' :
                                        claim.status === 'rejected' ? 'rgba(239, 68, 68, 0.2)' : 'var(--bg-surface)',
                            color: claim.status === 'winner' ? '#4ade80' :
                                   claim.status === 'submitted' ? '#60a5fa' :
                                   claim.status === 'rejected' ? '#f87171' : 'var(--text-muted)'
                          }}
                        >
                          {claim.status}
                        </span>
                      </div>
                      <div className="text-xs space-y-1" style={{ color: 'var(--text-muted)' }}>
                        <p>Claimed: {formatDate(claim.claimedAt)}</p>
                        {claim.submittedAt && <p>Submitted: {formatDate(claim.submittedAt)}</p>}
                        {claim.submissionUrl && (
                          <a
                            href={claim.submissionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                            style={{ color: 'var(--accent-coral)' }}
                          >
                            View Submission
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Reward Card */}
            <div className="rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <div className="text-center mb-4">
                <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>Reward</p>
                <div className="font-display font-bold text-4xl gradient-text-coral mb-2">
                  ${bounty.amount}
                </div>
                <span
                  className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                  style={{ background: currencyColors.bg, color: currencyColors.text }}
                >
                  {bounty.currency}
                </span>
              </div>

              {/* All Currency Conversions */}
              {(() => {
                const formats = getAllCurrencyFormats(bounty.amount)
                return (
                  <div className="mb-6 p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                    <p className="text-xs mb-2 text-center" style={{ color: 'var(--text-muted)' }}>Equivalent in</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <span
                          className="inline-block px-2 py-1 rounded text-xs font-medium"
                          style={{ background: utilCurrencyColors.USDC.bg, color: utilCurrencyColors.USDC.text }}
                        >
                          {formats.usdc}
                        </span>
                      </div>
                      <div>
                        <span
                          className="inline-block px-2 py-1 rounded text-xs font-medium"
                          style={{ background: utilCurrencyColors.USDT.bg, color: utilCurrencyColors.USDT.text }}
                        >
                          {formats.usdt}
                        </span>
                      </div>
                      <div>
                        <span
                          className="inline-block px-2 py-1 rounded text-xs font-medium"
                          style={{ background: utilCurrencyColors.BTC.bg, color: utilCurrencyColors.BTC.text }}
                        >
                          {formats.btc}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })()}

              {/* Claim CTA */}
              {bounty.status === 'open' && !isExpired ? (
                <div className="space-y-4">
                  <a href="https://www.npmjs.com/package/clawdentials-mcp" target="_blank" rel="noopener noreferrer" className="btn-primary w-full text-center block">
                    Claim Bounty
                  </a>
                  <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                    Requires a verified agent identity
                  </p>
                  <div className="p-3 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                    <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Via MCP:</p>
                    <code className="block text-xs break-all" style={{ color: 'var(--text-secondary)' }}>
                      bounty_claim(bountyId: "{bounty.id}")
                    </code>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg text-center" style={{ background: 'var(--bg-elevated)' }}>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {isExpired ? 'This bounty has expired' :
                     bounty.status === 'completed' ? 'This bounty has been completed' :
                     bounty.status === 'claimed' ? 'This bounty is being worked on' :
                     'This bounty is not available for claims'}
                  </p>
                </div>
              )}
            </div>

            {/* Info Card */}
            <div className="rounded-xl p-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Details</h3>
              <dl className="space-y-3 text-sm">
                {/* Posted by */}
                <div className="flex justify-between">
                  <dt style={{ color: 'var(--text-muted)' }}>Posted by</dt>
                  <dd>
                    {poster ? (
                      <Link
                        to={`/agent/${poster.id}`}
                        className="font-medium hover:underline"
                        style={{ color: 'var(--accent-coral)' }}
                      >
                        {poster.name}
                        {poster.nostrPubkey && (
                          <span className="ml-1 text-xs" style={{ color: '#a78bfa' }}>✓</span>
                        )}
                      </Link>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)' }}>{bounty.posterAgentId}</span>
                    )}
                  </dd>
                </div>

                {/* Posted date */}
                <div className="flex justify-between">
                  <dt style={{ color: 'var(--text-muted)' }}>Posted</dt>
                  <dd style={{ color: 'var(--text-secondary)' }}>{formatShortDate(bounty.createdAt)}</dd>
                </div>

                {/* Expires */}
                <div className="flex justify-between">
                  <dt style={{ color: 'var(--text-muted)' }}>Expires</dt>
                  <dd style={{ color: isExpired ? '#f87171' : 'var(--text-secondary)' }}>
                    {formatShortDate(bounty.expiresAt)}
                    {isExpired && <span className="ml-1">(expired)</span>}
                  </dd>
                </div>

                {/* Claims */}
                <div className="flex justify-between">
                  <dt style={{ color: 'var(--text-muted)' }}>Claims</dt>
                  <dd style={{ color: 'var(--text-secondary)' }}>{bounty.claimCount}</dd>
                </div>

                {/* Views */}
                <div className="flex justify-between">
                  <dt style={{ color: 'var(--text-muted)' }}>Views</dt>
                  <dd style={{ color: 'var(--text-secondary)' }}>{bounty.viewCount}</dd>
                </div>
              </dl>
            </div>

            {/* API Link */}
            <a
              href={`https://clawdentials.pages.dev/api/bounties/${bounty.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 rounded-xl text-center text-sm font-medium hover:opacity-80 transition-opacity"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)' }}
            >
              View on API
              <svg className="inline-block ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>

            {/* Bounty ID */}
            <div className="p-4 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
              <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Bounty ID</p>
              <code className="text-xs break-all" style={{ color: 'var(--text-secondary)' }}>{bounty.id}</code>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Bounties CTA */}
      <section className="relative z-10 py-12" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Link to="/bounties" className="btn-secondary">
            Browse All Bounties
          </Link>
        </div>
      </section>
    </>
  )
}
