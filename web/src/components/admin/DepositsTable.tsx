import { useState, useEffect } from 'react'
import { db } from '../../firebase'
import { collection, getDocs, orderBy, query, limit, startAfter, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore'

interface Deposit {
  id: string
  agentId: string
  amount: number
  currency: string
  provider: string
  status: 'pending' | 'completed' | 'expired' | 'failed'
  paymentAddress?: string
  invoice?: string
  createdAt: Date | null
}

type StatusFilter = 'all' | 'pending' | 'completed' | 'expired' | 'failed'
type CurrencyFilter = 'all' | 'USDC' | 'USDT' | 'BTC'

const PAGE_SIZE = 50

export function DepositsTable() {
  const [deposits, setDeposits] = useState<Deposit[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [currencyFilter, setCurrencyFilter] = useState<CurrencyFilter>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const fetchDeposits = async (startAfterDoc?: QueryDocumentSnapshot<DocumentData>) => {
    try {
      setLoading(true)

      // Build query based on filters
      let q = query(collection(db, 'deposits'), orderBy('createdAt', 'desc'), limit(PAGE_SIZE))

      if (startAfterDoc) {
        q = query(collection(db, 'deposits'), orderBy('createdAt', 'desc'), startAfter(startAfterDoc), limit(PAGE_SIZE))
      }

      const snapshot = await getDocs(q)
      const newDeposits: Deposit[] = []

      snapshot.forEach(doc => {
        const data = doc.data()
        newDeposits.push({
          id: doc.id,
          agentId: data.agentId || 'Unknown',
          amount: data.amount || 0,
          currency: data.currency || 'USD',
          provider: data.provider || 'Unknown',
          status: data.status || 'pending',
          paymentAddress: data.paymentAddress,
          invoice: data.invoice,
          createdAt: data.createdAt?.toDate() || null
        })
      })

      if (startAfterDoc) {
        setDeposits(prev => [...prev, ...newDeposits])
      } else {
        setDeposits(newDeposits)
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null)
      setHasMore(snapshot.docs.length === PAGE_SIZE)
    } catch (error) {
      console.error('Error fetching deposits:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeposits()
  }, [])

  const loadMore = () => {
    if (lastDoc && hasMore) {
      fetchDeposits(lastDoc)
    }
  }

  // Client-side filtering
  const filteredDeposits = deposits.filter(deposit => {
    if (statusFilter !== 'all' && deposit.status !== statusFilter) return false
    if (currencyFilter !== 'all' && deposit.currency !== currencyFilter) return false
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
      case 'expired':
        return { background: 'rgba(100, 100, 100, 0.2)', color: 'var(--text-muted)' }
      case 'failed':
        return { background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }
      default:
        return { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
    }
  }

  const getCurrencyStyle = (currency: string) => {
    switch (currency) {
      case 'USDC':
        return { background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }
      case 'USDT':
        return { background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }
      case 'BTC':
        return { background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }
      default:
        return { background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }
    }
  }

  const statusFilters: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: 'All Status' },
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'expired', label: 'Expired' },
    { value: 'failed', label: 'Failed' }
  ]

  const currencyFilters: { value: CurrencyFilter; label: string }[] = [
    { value: 'all', label: 'All Currencies' },
    { value: 'USDC', label: 'USDC' },
    { value: 'USDT', label: 'USDT' },
    { value: 'BTC', label: 'BTC' }
  ]

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
      {/* Filters */}
      <div className="p-4 flex gap-4 flex-wrap" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex gap-2 flex-wrap">
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
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {currencyFilters.map(filter => (
            <button
              key={filter.value}
              onClick={() => setCurrencyFilter(filter.value)}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: currencyFilter === filter.value ? 'rgba(0, 229, 204, 0.2)' : 'var(--bg-elevated)',
                border: currencyFilter === filter.value ? '1px solid var(--accent-teal)' : '1px solid var(--border-subtle)',
                color: currencyFilter === filter.value ? 'var(--accent-teal)' : 'var(--text-secondary)'
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {loading && deposits.length === 0 ? (
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
                <th className="text-center px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Currency</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Provider</th>
                <th className="text-center px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Status</th>
                <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--text-secondary)' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {filteredDeposits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center" style={{ color: 'var(--text-muted)' }}>
                    No deposits found
                  </td>
                </tr>
              ) : (
                filteredDeposits.map((deposit, i) => (
                  <>
                    <tr
                      key={deposit.id}
                      className="cursor-pointer transition-colors"
                      style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)' }}
                      onClick={() => setExpandedId(expandedId === deposit.id ? null : deposit.id)}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'}
                      onMouseOut={(e) => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)'}
                    >
                      <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                        {deposit.id.slice(0, 8)}...
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-primary)' }}>
                        {deposit.agentId}
                      </td>
                      <td className="px-4 py-3 text-right font-mono" style={{ color: 'var(--accent-teal)' }}>
                        {formatCurrency(deposit.amount, deposit.currency)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 rounded text-xs font-medium" style={getCurrencyStyle(deposit.currency)}>
                          {deposit.currency}
                        </span>
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--text-secondary)' }}>
                        {deposit.provider}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="px-2 py-1 rounded text-xs font-medium" style={getStatusStyle(deposit.status)}>
                          {deposit.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-xs" style={{ color: 'var(--text-muted)' }}>
                        {formatDate(deposit.createdAt)}
                      </td>
                    </tr>
                    {expandedId === deposit.id && (
                      <tr key={`${deposit.id}-expanded`}>
                        <td colSpan={7} className="px-4 py-4" style={{ background: 'var(--bg-elevated)' }}>
                          <div className="text-sm space-y-2">
                            {deposit.paymentAddress && (
                              <div>
                                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Payment Address: </span>
                                <span className="font-mono text-xs" style={{ color: 'var(--text-primary)' }}>
                                  {deposit.paymentAddress}
                                </span>
                              </div>
                            )}
                            {deposit.invoice && (
                              <div>
                                <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>Invoice: </span>
                                <span className="font-mono text-xs break-all" style={{ color: 'var(--text-primary)' }}>
                                  {deposit.invoice.slice(0, 60)}...
                                </span>
                              </div>
                            )}
                            {!deposit.paymentAddress && !deposit.invoice && (
                              <span style={{ color: 'var(--text-muted)' }}>No payment details available</span>
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
