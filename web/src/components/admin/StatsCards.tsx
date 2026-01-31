import { useState, useEffect } from 'react'
import { db } from '../../firebase'
import { collection, getDocs, Timestamp } from 'firebase/firestore'

interface Stats {
  totalAgents: number
  activeAgents: number
  totalVolume: number
  platformRevenue: number
  pendingWithdrawals: number
  disputedEscrows: number
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all collections in parallel
        const [agentsSnap, escrowsSnap, withdrawalsSnap] = await Promise.all([
          getDocs(collection(db, 'agents')),
          getDocs(collection(db, 'escrows')),
          getDocs(collection(db, 'withdrawals'))
        ])

        // Calculate stats
        const thirtyDaysAgo = Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

        let activeAgents = 0
        agentsSnap.forEach(doc => {
          const data = doc.data()
          if (data.lastTaskAt && data.lastTaskAt > thirtyDaysAgo) {
            activeAgents++
          }
        })

        let totalVolume = 0
        let disputedEscrows = 0
        escrowsSnap.forEach(doc => {
          const data = doc.data()
          if (data.status === 'completed') {
            totalVolume += data.amount || 0
          }
          if (data.status === 'disputed') {
            disputedEscrows++
          }
        })

        let pendingWithdrawals = 0
        withdrawalsSnap.forEach(doc => {
          const data = doc.data()
          if (data.status === 'pending') {
            pendingWithdrawals++
          }
        })

        // Platform revenue is 10% of completed escrows
        const platformRevenue = totalVolume * 0.1

        setStats({
          totalAgents: agentsSnap.size,
          activeAgents,
          totalVolume,
          platformRevenue,
          pendingWithdrawals,
          disputedEscrows
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  const cards = [
    {
      label: 'Total Agents',
      value: stats?.totalAgents ?? 0,
      icon: '🤖',
      color: 'var(--accent-coral)'
    },
    {
      label: 'Active (30d)',
      value: stats?.activeAgents ?? 0,
      icon: '⚡',
      color: 'var(--accent-teal)'
    },
    {
      label: 'Total Volume',
      value: formatCurrency(stats?.totalVolume ?? 0),
      icon: '💰',
      color: 'var(--accent-coral)'
    },
    {
      label: 'Platform Revenue',
      value: formatCurrency(stats?.platformRevenue ?? 0),
      icon: '📈',
      color: 'var(--accent-teal)'
    },
    {
      label: 'Pending Withdrawals',
      value: stats?.pendingWithdrawals ?? 0,
      icon: '⏳',
      color: stats?.pendingWithdrawals ? '#f59e0b' : 'var(--text-muted)'
    },
    {
      label: 'Disputed Escrows',
      value: stats?.disputedEscrows ?? 0,
      icon: '⚠️',
      color: stats?.disputedEscrows ? '#ef4444' : 'var(--text-muted)'
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 rounded-xl animate-pulse"
            style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
            <div className="h-8 w-8 rounded-lg mb-3" style={{ background: 'var(--bg-elevated)' }} />
            <div className="h-8 w-16 rounded mb-2" style={{ background: 'var(--bg-elevated)' }} />
            <div className="h-4 w-20 rounded" style={{ background: 'var(--bg-elevated)' }} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      {cards.map((card, i) => (
        <div key={i} className="p-4 rounded-xl card-hover"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)' }}>
          <div className="text-2xl mb-2">{card.icon}</div>
          <div className="font-display font-bold text-2xl mb-1" style={{ color: card.color }}>
            {card.value}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {card.label}
          </div>
        </div>
      ))}
    </div>
  )
}
