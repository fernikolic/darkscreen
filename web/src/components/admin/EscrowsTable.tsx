import { useState, useEffect } from 'react'
import { db } from '../../firebase'
import { collection, getDocs, orderBy, query, limit, where, startAfter, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore'

interface Escrow {
  id: string
  clientId: string
  providerId: string
  amount: number
  status: 'pending' | 'completed' | 'disputed' | 'cancelled'
  taskDescription: string
  createdAt: Date | null
  completedAt: Date | null
}

type StatusFilter = 'all' | 'pending' | 'completed' | 'disputed' | 'cancelled'

const PAGE_SIZE = 50

export function EscrowsTable() {
  const [escrows, setEscrows] = useState<Escrow[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const fetchEscrows = async (filter: StatusFilter, startAfterDoc?: QueryDocumentSnapshot<DocumentData>) => {
    try {
      setLoading(true)

      let q
      if (filter === 'all') {
        q = startAfterDoc
          ? query(collection(db, 'escrows'), orderBy('createdAt', 'desc'), startAfter(startAfterDoc), limit(PAGE_SIZE))
          : query(collection(db, 'escrows'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE))
      } else {
        q = startAfterDoc
          ? query(collection(db, 'escrows'), where('status', '==', filter), orderBy('createdAt', 'desc'), startAfter(startAfterDoc), limit(PAGE_SIZE))
          : query(collection(db, 'escrows'), where('status', '==', filter), orderBy('createdAt', 'desc'), limit(PAGE_SIZE))
      }

      const snapshot = await getDocs(q)
      const newEscrows: Escrow[] = []

      snapshot.forEach(doc => {
        const data = doc.data()
        newEscrows.push({
          id: doc.id,
          clientId: data.clientId || 'Unknown',
          providerId: data.providerId || 'Unknown',
          amount: data.amount || 0,
          status: data.status || 'pending',
          taskDescription: data.taskDescription || data.task || '',
          createdAt: data.createdAt?.toDate() || null,
          completedAt: data.completedAt?.toDate() || null
        })
      })

      if (startAfterDoc) {
        setEscrows(prev => [...prev, ...newEscrows])
      } else {
        setEscrows(newEscrows)
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null)
      setHasMore(snapshot.docs.length === PAGE_SIZE)
    } catch (error) {
      console.error('Error fetching escrows:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setEscrows([])
    setLastDoc(null)
    fetchEscrows(statusFilter)
  }, [statusFilter])

  const loadMore = () => {
    if (lastDoc && hasMore) {
      fetchEscrows(statusFilter, lastDoc)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '-'
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed':
        return { background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }
      case 'pending':
        return { background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }
      case 'disputed':
        return { background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }
      case 'cancelled':
        return { background: 'rgba(100, 100, 100, 0.2)', color: 'var(--text-muted)' }
      default:
        return { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
    }
  }

  const filters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'disputed', label: 'Disputed' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      {/* Filters */}
      <div className="p-4 flex gap-2 flex-wrap" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {filters.map(filter => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: statusFilter === filter.value ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-elevated)',
              border: statusFilter === filter.value ? '1px solid var(--accent-coral)' : '1px solid var(--border-subtle)',
              color: statusFilter === filter.value ? 'var(--accent-coral)' : 'var(--text-secondary)'
            }}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading && escrows.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto"
            style={{ borderColor: 'var(--accent-coral)', borderTopColor: 'transparent' }} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-elevated)' }}>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>ID</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Client</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Provider</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Amount</th>
                <th className="text-center px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Status</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Created</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Completed</th>
              </tr>
            </thead>
            <tbody>
              {escrows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                    No escrows found
                  </td>
                </tr>
              ) : (
                escrows.map((escrow, i) => (
                  <>
                    <tr
                      key={escrow.id}
                      className="cursor-pointer transition-colors"
                      style={{
                        background: escrow.status === 'disputed'
                          ? 'rgba(239, 68, 68, 0.05)'
                          : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                      }}
                      onClick={() => setExpandedId(expandedId === escrow.id ? null : escrow.id)}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'}
                      onMouseOut={(e) => e.currentTarget.style.background = escrow.status === 'disputed'
                        ? 'rgba(239, 68, 68, 0.05)'
                        : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}
                    >
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        {escrow.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                        {escrow.clientId}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                        {escrow.providerId}
                      </td>
                      <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--accent-teal)' }}>
                        {formatCurrency(escrow.amount)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 rounded text-xs font-medium" style={getStatusStyle(escrow.status)}>
                          {escrow.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(escrow.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(escrow.completedAt)}
                      </td>
                    </tr>
                    {expandedId === escrow.id && (
                      <tr key={`${escrow.id}-expanded`}>
                        <td colSpan={7} className="px-4 py-4" style={{ background: 'var(--bg-elevated)' }}>
                          <div className="text-sm">
                            <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Task: </span>
                            <span style={{ color: 'var(--text-primary)' }}>
                              {escrow.taskDescription || 'No description'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="p-4 text-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
            style={{
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)'
            }}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}
