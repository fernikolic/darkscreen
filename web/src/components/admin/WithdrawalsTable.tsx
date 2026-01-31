import { useState, useEffect } from 'react'
import { db } from '../../firebase'
import { collection, getDocs, orderBy, query, limit, startAfter, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore'

interface Withdrawal {
  id: string
  agentId: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  method: string
  walletAddress?: string
  requestedAt: Date | null
  processedAt: Date | null
}

type StatusFilter = 'all' | 'pending' | 'processing' | 'completed' | 'rejected'

const PAGE_SIZE = 50

export function WithdrawalsTable() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const fetchWithdrawals = async (startAfterDoc?: QueryDocumentSnapshot<DocumentData>) => {
    try {
      setLoading(true)

      let q = startAfterDoc
        ? query(collection(db, 'withdrawals'), orderBy('requestedAt', 'desc'), startAfter(startAfterDoc), limit(PAGE_SIZE))
        : query(collection(db, 'withdrawals'), orderBy('requestedAt', 'desc'), limit(PAGE_SIZE))

      const snapshot = await getDocs(q)
      const newWithdrawals: Withdrawal[] = []

      snapshot.forEach(doc => {
        const data = doc.data()
        newWithdrawals.push({
          id: doc.id,
          agentId: data.agentId || 'Unknown',
          amount: data.amount || 0,
          currency: data.currency || 'USD',
          status: data.status || 'pending',
          method: data.method || 'Unknown',
          walletAddress: data.walletAddress,
          requestedAt: data.requestedAt?.toDate() || null,
          processedAt: data.processedAt?.toDate() || null
        })
      })

      if (startAfterDoc) {
        setWithdrawals(prev => [...prev, ...newWithdrawals])
      } else {
        setWithdrawals(newWithdrawals)
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null)
      setHasMore(snapshot.docs.length === PAGE_SIZE)
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const loadMore = () => {
    if (lastDoc && hasMore) {
      fetchWithdrawals(lastDoc)
    }
  }

  // Client-side filtering
  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    if (statusFilter !== 'all' && withdrawal.status !== statusFilter) return false
    return true
  })

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

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'BTC') {
      return `${amount} sats`
    }
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
      case 'processing':
        return { background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }
      case 'rejected':
        return { background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }
      default:
        return { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
    }
  }

  const statusFilters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'completed', label: 'Completed' },
    { value: 'rejected', label: 'Rejected' }
  ]

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      {/* Filters */}
      <div className="p-4 flex gap-2 flex-wrap" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        {statusFilters.map(filter => (
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
            {filter.value === 'pending' && withdrawals.filter(w => w.status === 'pending').length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded text-xs" style={{ background: '#f59e0b', color: 'white' }}>
                {withdrawals.filter(w => w.status === 'pending').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading && withdrawals.length === 0 ? (
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
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Agent</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Amount</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Method</th>
                <th className="text-center px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Status</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Requested</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Processed</th>
              </tr>
            </thead>
            <tbody>
              {filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                    No withdrawals found
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((withdrawal, i) => (
                  <>
                    <tr
                      key={withdrawal.id}
                      className="cursor-pointer transition-colors"
                      style={{
                        background: withdrawal.status === 'pending'
                          ? 'rgba(245, 158, 11, 0.05)'
                          : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'
                      }}
                      onClick={() => setExpandedId(expandedId === withdrawal.id ? null : withdrawal.id)}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'}
                      onMouseOut={(e) => e.currentTarget.style.background = withdrawal.status === 'pending'
                        ? 'rgba(245, 158, 11, 0.05)'
                        : i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}
                    >
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        {withdrawal.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                        {withdrawal.agentId}
                      </td>
                      <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--accent-teal)' }}>
                        {formatCurrency(withdrawal.amount, withdrawal.currency)}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                        {withdrawal.method}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 rounded text-xs font-medium" style={getStatusStyle(withdrawal.status)}>
                          {withdrawal.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(withdrawal.requestedAt)}
                      </td>
                      <td className="px-4 py-3 text-right text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(withdrawal.processedAt)}
                      </td>
                    </tr>
                    {expandedId === withdrawal.id && (
                      <tr key={`${withdrawal.id}-expanded`}>
                        <td colSpan={7} className="px-4 py-4" style={{ background: 'var(--bg-elevated)' }}>
                          <div className="text-sm space-y-2">
                            {withdrawal.walletAddress && (
                              <div>
                                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Wallet Address: </span>
                                <span className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
                                  {withdrawal.walletAddress}
                                </span>
                              </div>
                            )}
                            {!withdrawal.walletAddress && (
                              <span style={{ color: 'var(--text-muted)' }}>No wallet address provided</span>
                            )}
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
