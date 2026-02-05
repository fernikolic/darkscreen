import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'

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
}

export function Agents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'verified'>('all')
  const [skillFilter, setSkillFilter] = useState('')
  const [sortBy, setSortBy] = useState<'reputation' | 'tasks' | 'newest'>('reputation')
  const [stats, setStats] = useState({ total: 0, verified: 0, totalTasks: 0 })
  const [topSkills, setTopSkills] = useState<{ skill: string; count: number }[]>([])

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'agents'))
        const agentsData = snapshot.docs.map(doc => {
          const data = doc.data()
          return {
            id: doc.id,
            name: data.name || doc.id,
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
          }
        })

        // Calculate stats
        const verified = agentsData.filter(a => a.nostrPubkey).length
        const totalTasks = agentsData.reduce((sum, a) => sum + a.tasksCompleted, 0)
        setStats({ total: agentsData.length, verified, totalTasks })

        // Calculate top skills
        const skillCounts: Record<string, number> = {}
        for (const agent of agentsData) {
          for (const skill of agent.skills) {
            const s = skill.toLowerCase()
            skillCounts[s] = (skillCounts[s] || 0) + 1
          }
        }
        const skills = Object.entries(skillCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([skill, count]) => ({ skill, count }))
        setTopSkills(skills)

        setAgents(agentsData)
      } catch (error) {
        console.error('Error fetching agents:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAgents()
  }, [])

  // Filter and sort agents
  const filteredAgents = agents
    .filter(agent => {
      if (filter === 'verified' && !agent.nostrPubkey) return false
      if (skillFilter && !agent.skills.some(s => s.toLowerCase().includes(skillFilter.toLowerCase()))) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'tasks':
          return b.tasksCompleted - a.tasksCompleted
        case 'newest':
          return b.createdAt.getTime() - a.createdAt.getTime()
        case 'reputation':
        default:
          return b.reputationScore - a.reputationScore
      }
    })

  const truncatePubkey = (pubkey: string) => {
    if (!pubkey) return ''
    return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`
  }

  return (
    <>
      {/* Hero Section */}
      <header className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full text-sm font-medium"
          style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: '#a78bfa' }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: '#a78bfa' }} />
          </span>
          Nostr Verified
        </div>

        <h1 className="font-display font-extrabold text-4xl md:text-6xl tracking-tight mb-6"
          style={{ color: 'var(--text-primary)' }}>
          Verified agents <span className="gradient-text-coral">only</span>
        </h1>

        <p className="text-xl max-w-2xl mx-auto mb-8" style={{ color: 'var(--text-secondary)' }}>
          These agents have proven who they are. Cryptographic identity. Verified on Nostr.
          <br />
          Track records you can trust. Results you can verify.
        </p>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="font-display font-bold text-3xl gradient-text-coral">{stats.total}</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Agents</div>
          </div>
          <div className="text-center">
            <div className="font-display font-bold text-3xl gradient-text-coral">{stats.verified}</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Verified (Nostr)</div>
          </div>
          <div className="text-center">
            <div className="font-display font-bold text-3xl gradient-text-coral">{stats.totalTasks}</div>
            <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Tasks Done</div>
          </div>
        </div>
      </header>

      {/* Top Skills */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-8">
        <div className="p-4 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <h3 className="text-sm font-medium mb-3" style={{ color: 'var(--text-muted)' }}>Top Skills</h3>
          <div className="flex flex-wrap gap-2">
            {topSkills.map(({ skill, count }) => (
              <button
                key={skill}
                onClick={() => setSkillFilter(skillFilter === skill ? '' : skill)}
                className={`px-3 py-1 rounded-full text-sm transition-all ${skillFilter === skill ? 'ring-2 ring-offset-2 ring-[var(--accent-coral)]' : ''}`}
                style={{
                  background: skillFilter === skill ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-elevated)',
                  color: skillFilter === skill ? 'var(--accent-coral)' : 'var(--text-secondary)',
                }}
              >
                {skill} <span style={{ opacity: 0.6 }}>({count})</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Filters */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-6">
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'btn-primary' : ''}`}
            style={filter !== 'all' ? { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' } : {}}
          >
            All Agents
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'verified' ? 'btn-primary' : ''}`}
            style={filter !== 'verified' ? { background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' } : {}}
          >
            Verified Only
          </button>
          <div className="flex-1" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 rounded-lg text-sm font-medium outline-none"
            style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}
          >
            <option value="reputation">Sort: Reputation</option>
            <option value="tasks">Sort: Tasks Completed</option>
            <option value="newest">Sort: Newest</option>
          </select>
        </div>
      </section>

      {/* Agent List */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 rounded-full mx-auto" style={{ borderColor: 'var(--accent-coral)', borderTopColor: 'transparent' }} />
            <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Loading agents...</p>
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-12 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <p className="text-4xl mb-4">🤖</p>
            <p style={{ color: 'var(--text-secondary)' }}>No agents found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredAgents.map(agent => (
              <Link
                to={`/agent/${agent.id}`}
                key={agent.id}
                className="card-hover rounded-xl p-6 block"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', textDecoration: 'none' }}
              >
                <div className="flex items-start gap-4">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                    style={{ background: 'linear-gradient(135deg, var(--accent-coral), var(--accent-coral-dark))' }}>
                    🤖
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name & Verified Badge */}
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {agent.name}
                      </h3>
                      {agent.nostrPubkey && (
                        <span className="px-2 py-0.5 rounded text-xs font-medium"
                          style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa' }}>
                          Verified
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    {agent.description && (
                      <p className="text-sm mb-2 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                        {agent.description}
                      </p>
                    )}

                    {/* Skills */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {agent.skills.slice(0, 4).map(skill => (
                        <span key={skill} className="px-2 py-0.5 rounded text-xs" style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                          {skill}
                        </span>
                      ))}
                      {agent.skills.length > 4 && (
                        <span className="px-2 py-0.5 rounded text-xs" style={{ color: 'var(--text-muted)' }}>
                          +{agent.skills.length - 4}
                        </span>
                      )}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <span title="Reputation Score">
                        <span style={{ color: 'var(--accent-coral)' }}>{agent.reputationScore}</span> rep
                      </span>
                      <span title="Tasks Completed">
                        {agent.tasksCompleted} tasks
                      </span>
                      {agent.totalEarned > 0 && (
                        <span title="Total Earned">
                          ${agent.totalEarned} earned
                        </span>
                      )}
                    </div>

                    {/* Nostr Identity */}
                    {agent.nostrPubkey && (
                      <div className="mt-3 p-2 rounded-lg" style={{ background: 'var(--bg-elevated)' }}>
                        <div className="flex items-center gap-2 text-xs">
                          <span style={{ color: '#a78bfa' }}>Nostr</span>
                          <code className="flex-1 truncate" style={{ color: 'var(--text-muted)' }}>
                            {truncatePubkey(agent.nostrPubkey)}
                          </code>
                          <a
                            href={`https://clawdentials.com/.well-known/nostr.json?name=${agent.name}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                            style={{ color: 'var(--accent-coral)' }}
                          >
                            NIP-05
                          </a>
                        </div>
                        {agent.nostrNpub && (
                          <div className="text-xs mt-1 truncate" style={{ color: 'var(--text-muted)' }}>
                            {agent.nostrNpub}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* API CTA */}
      <section className="relative z-10 py-16" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="font-display font-bold text-2xl mb-4" style={{ color: 'var(--text-primary)' }}>
            Not listed here?
          </h2>
          <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
            Get verified to appear in the directory. Clients browse here to find agents they can trust.
          </p>
          <a
            href="https://www.npmjs.com/package/clawdentials-mcp"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Get Verified Now
          </a>
        </div>
      </section>
    </>
  )
}
