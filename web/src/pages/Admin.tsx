import { useState } from 'react'
import { AdminAuth } from '../components/admin/AdminAuth'
import { StatsCards } from '../components/admin/StatsCards'
import { AgentsTable } from '../components/admin/AgentsTable'
import { EscrowsTable } from '../components/admin/EscrowsTable'
import { DepositsTable } from '../components/admin/DepositsTable'
import { WithdrawalsTable } from '../components/admin/WithdrawalsTable'

type Tab = 'stats' | 'agents' | 'escrows' | 'deposits' | 'withdrawals'

export function Admin() {
  const [activeTab, setActiveTab] = useState<Tab>('stats')

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'stats', label: 'Overview', icon: '📊' },
    { id: 'agents', label: 'Agents', icon: '🤖' },
    { id: 'escrows', label: 'Escrows', icon: '🔒' },
    { id: 'deposits', label: 'Deposits', icon: '💵' },
    { id: 'withdrawals', label: 'Withdrawals', icon: '💸' }
  ]

  return (
    <AdminAuth>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl mb-2" style={{ color: 'var(--text-primary)' }}>
            Admin Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Monitor agents, escrows, payments, and platform activity
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2"
              style={{
                background: activeTab === tab.id ? 'rgba(59, 130, 246, 0.2)' : 'var(--bg-surface)',
                border: activeTab === tab.id ? '1px solid var(--accent-coral)' : '1px solid var(--border-subtle)',
                color: activeTab === tab.id ? 'var(--accent-coral)' : 'var(--text-secondary)'
              }}
              onMouseOver={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.borderColor = 'var(--accent-coral)'
                  e.currentTarget.style.color = 'var(--accent-coral)'
                }
              }}
              onMouseOut={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)'
                  e.currentTarget.style.color = 'var(--text-secondary)'
                }
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'stats' && (
          <div>
            <StatsCards />
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h2 className="font-display font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
                  Recent Agents
                </h2>
                <AgentsTable />
              </div>
              <div>
                <h2 className="font-display font-semibold text-lg mb-4" style={{ color: 'var(--text-primary)' }}>
                  Recent Escrows
                </h2>
                <EscrowsTable />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'agents' && (
          <div>
            <h2 className="font-display font-semibold text-xl mb-4" style={{ color: 'var(--text-primary)' }}>
              All Agents
            </h2>
            <AgentsTable />
          </div>
        )}

        {activeTab === 'escrows' && (
          <div>
            <h2 className="font-display font-semibold text-xl mb-4" style={{ color: 'var(--text-primary)' }}>
              All Escrows
            </h2>
            <EscrowsTable />
          </div>
        )}

        {activeTab === 'deposits' && (
          <div>
            <h2 className="font-display font-semibold text-xl mb-4" style={{ color: 'var(--text-primary)' }}>
              All Deposits
            </h2>
            <DepositsTable />
          </div>
        )}

        {activeTab === 'withdrawals' && (
          <div>
            <h2 className="font-display font-semibold text-xl mb-4" style={{ color: 'var(--text-primary)' }}>
              All Withdrawals
            </h2>
            <WithdrawalsTable />
          </div>
        )}
      </div>
    </AdminAuth>
  )
}
