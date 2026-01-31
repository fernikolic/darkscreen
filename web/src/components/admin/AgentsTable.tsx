import { useState, useEffect } from 'react'
import { db } from '../../firebase'
import { collection, getDocs, orderBy, query, limit, startAfter, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore'

interface Agent {
  id: string
  name: string
  skills: string[]
  tasksCompleted: number
  totalEarnings: number
  successRate: number
  balance: number
  verified: boolean
  createdAt: Date | null
}

const PAGE_SIZE = 50

export function AgentsTable() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const fetchAgents = async (startAfterDoc?: QueryDocumentSnapshot<DocumentData>) => {
    try {
      let q = query(
        collection(db, 'agents'),
        orderBy('createdAt', 'desc'),
        limit(PAGE_SIZE)
      )

      if (startAfterDoc) {
        q = query(
          collection(db, 'agents'),
          orderBy('createdAt', 'desc'),
          startAfter(startAfterDoc),
          limit(PAGE_SIZE)
        )
      }

      const snapshot = await getDocs(q)
      const newAgents: Agent[] = []

      snapshot.forEach(doc => {
        const data = doc.data()
        newAgents.push({
          id: doc.id,
          name: data.name || 'Unknown',
          skills: data.skills || [],
          tasksCompleted: data.tasksCompleted || 0,
          totalEarnings: data.totalEarnings || 0,
          successRate: data.successRate || 0,
          balance: data.balance || 0,
          verified: data.verified || false,
          createdAt: data.createdAt?.toDate() || null
        })
      })

      if (startAfterDoc) {
        setAgents(prev => [...prev, ...newAgents])
      } else {
        setAgents(newAgents)
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null)
      setHasMore(snapshot.docs.length === PAGE_SIZE)
    } catch (error) {
      console.error('Error fetching agents:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  const loadMore = () => {
    if (lastDoc && hasMore) {
      fetchAgents(lastDoc)
    }
  }

  const filteredAgents = agents.filter(agent => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      agent.name.toLowerCase().includes(searchLower) ||
      agent.skills.some(s => s.toLowerCase().includes(searchLower))
    )
  })

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="h-10 w-64 rounded-lg animate-pulse" style={{ background: 'var(--bg-elevated)' }} />
        </div>
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: 'var(--accent-coral)', borderTopColor: 'transparent' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      {/* Search */}
      <div className="p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or skill..."
          className="w-full max-w-sm px-4 py-2 rounded-lg text-sm outline-none transition-all"
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-primary)'
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--accent-coral)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--bg-elevated)' }}>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Name</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Skills</th>
              <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Tasks</th>
              <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Earnings</th>
              <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Success</th>
              <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Balance</th>
              <th className="text-center px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Status</th>
              <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Created</th>
            </tr>
          </thead>
          <tbody>
            {filteredAgents.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                  {search ? 'No agents match your search' : 'No agents registered yet'}
                </td>
              </tr>
            ) : (
              filteredAgents.map((agent, i) => (
                <tr
                  key={agent.id}
                  className="cursor-pointer transition-colors"
                  style={{
                    background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                    borderBottom: expandedId === agent.id ? 'none' : undefined
                  }}
                  onClick={() => setExpandedId(expandedId === agent.id ? null : agent.id)}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'}
                  onMouseOut={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                    {agent.name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {agent.skills.slice(0, 3).map((skill, j) => (
                        <span key={j} className="px-2 py-0.5 rounded text-xs"
                          style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}>
                          {skill}
                        </span>
                      ))}
                      {agent.skills.length > 3 && (
                        <span className="px-2 py-0.5 rounded text-xs"
                          style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                          +{agent.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--text-primary)' }}>
                    {agent.tasksCompleted}
                  </td>
                  <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--accent-teal)' }}>
                    {formatCurrency(agent.totalEarnings)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono" style={{
                    color: agent.successRate >= 95 ? 'var(--accent-teal)' :
                           agent.successRate >= 80 ? 'var(--text-primary)' : '#f59e0b'
                  }}>
                    {agent.successRate.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--text-primary)' }}>
                    {formatCurrency(agent.balance)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        background: agent.verified ? 'rgba(59, 130, 246, 0.2)' : 'rgba(100, 100, 100, 0.2)',
                        color: agent.verified ? 'var(--accent-coral)' : 'var(--text-muted)'
                      }}>
                      {agent.verified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" style={{ color: 'var(--text-muted)' }}>
                    {formatDate(agent.createdAt)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Load More */}
      {hasMore && !search && (
        <div className="p-4 text-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={loadMore}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-coral)'
              e.currentTarget.style.color = 'var(--accent-coral)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = 'var(--border-subtle)'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            Load More
          </button>
        </div>
      )}
    </div>
  )
}
