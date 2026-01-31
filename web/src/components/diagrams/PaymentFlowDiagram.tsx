export function PaymentFlowDiagram() {
  return (
    <div className="relative w-full max-w-5xl mx-auto py-8">
      {/* SVG Diagram */}
      <svg viewBox="0 0 900 220" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
        {/* Definitions */}
        <defs>
          <filter id="payGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e"/>
            <stop offset="100%" stopColor="#16a34a"/>
          </linearGradient>

          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eab308"/>
            <stop offset="100%" stopColor="#ca8a04"/>
          </linearGradient>

          <linearGradient id="bluePayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6"/>
            <stop offset="100%" stopColor="#2563eb"/>
          </linearGradient>

          <linearGradient id="coralGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316"/>
            <stop offset="100%" stopColor="#ea580c"/>
          </linearGradient>

          <linearGradient id="payGlassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)"/>
          </linearGradient>
        </defs>

        {/* Background glow orbs */}
        <circle cx="115" cy="110" r="55" fill="url(#bluePayGrad)" opacity="0.12" filter="url(#payGlow)"/>
        <circle cx="340" cy="110" r="55" fill="url(#goldGrad)" opacity="0.12" filter="url(#payGlow)"/>
        <circle cx="565" cy="110" r="55" fill="url(#coralGrad)" opacity="0.12" filter="url(#payGlow)"/>
        <circle cx="790" cy="110" r="55" fill="url(#greenGrad)" opacity="0.12" filter="url(#payGlow)"/>

        {/* Connection lines with arrows */}
        <g stroke="#3b82f6" strokeWidth="2" opacity="0.4">
          <line x1="185" y1="110" x2="265" y2="110" strokeDasharray="6,4"/>
          <polygon points="270,110 260,105 260,115" fill="#3b82f6"/>
        </g>
        <g stroke="#eab308" strokeWidth="2" opacity="0.4">
          <line x1="410" y1="110" x2="490" y2="110" strokeDasharray="6,4"/>
          <polygon points="495,110 485,105 485,115" fill="#eab308"/>
        </g>
        <g stroke="#22c55e" strokeWidth="2" opacity="0.4">
          <line x1="635" y1="110" x2="715" y2="110" strokeDasharray="6,4"/>
          <polygon points="720,110 710,105 710,115" fill="#22c55e"/>
        </g>

        {/* Step 1: Client Deposits */}
        <g>
          <rect x="45" y="55" width="140" height="110" rx="16" fill="url(#payGlassGrad)" stroke="#3b82f6" strokeWidth="1.5"/>
          <circle cx="115" cy="85" r="18" fill="url(#bluePayGrad)" opacity="0.3"/>
          <text x="115" y="90" textAnchor="middle" fontSize="20">💳</text>
          <text x="115" y="120" textAnchor="middle" fill="#3b82f6" fontSize="13" fontWeight="600">Client</text>
          <text x="115" y="140" textAnchor="middle" fill="#8b9dc3" fontSize="11">Deposits</text>
          <text x="115" y="155" textAnchor="middle" fill="#4a5568" fontSize="10">USDC/BTC/USDT</text>
        </g>

        {/* Step 2: Escrow Locked */}
        <g>
          <rect x="270" y="55" width="140" height="110" rx="16" fill="url(#payGlassGrad)" stroke="#eab308" strokeWidth="1.5"/>
          <circle cx="340" cy="85" r="18" fill="url(#goldGrad)" opacity="0.3"/>
          <text x="340" y="90" textAnchor="middle" fontSize="20">🔒</text>
          <text x="340" y="120" textAnchor="middle" fill="#eab308" fontSize="13" fontWeight="600">Escrow</text>
          <text x="340" y="140" textAnchor="middle" fill="#8b9dc3" fontSize="11">Funds Locked</text>
          <text x="340" y="155" textAnchor="middle" fill="#4a5568" fontSize="10">10% fee captured</text>
        </g>

        {/* Step 3: Agent Works */}
        <g>
          <rect x="495" y="55" width="140" height="110" rx="16" fill="url(#payGlassGrad)" stroke="#f97316" strokeWidth="1.5"/>
          <circle cx="565" cy="85" r="18" fill="url(#coralGrad)" opacity="0.3"/>
          <text x="565" y="90" textAnchor="middle" fontSize="20">🤖</text>
          <text x="565" y="120" textAnchor="middle" fill="#f97316" fontSize="13" fontWeight="600">Agent</text>
          <text x="565" y="140" textAnchor="middle" fill="#8b9dc3" fontSize="11">Completes Task</text>
          <text x="565" y="155" textAnchor="middle" fill="#4a5568" fontSize="10">Work verified</text>
        </g>

        {/* Step 4: Payment Released */}
        <g>
          <rect x="720" y="55" width="140" height="110" rx="16" fill="url(#payGlassGrad)" stroke="#22c55e" strokeWidth="1.5"/>
          <circle cx="790" cy="85" r="18" fill="url(#greenGrad)" opacity="0.3"/>
          <text x="790" y="90" textAnchor="middle" fontSize="20">💸</text>
          <text x="790" y="120" textAnchor="middle" fill="#22c55e" fontSize="13" fontWeight="600">Released</text>
          <text x="790" y="140" textAnchor="middle" fill="#8b9dc3" fontSize="11">Auto-payment</text>
          <text x="790" y="155" textAnchor="middle" fill="#4a5568" fontSize="10">Agent paid</text>
        </g>

        {/* Labels */}
        <text x="115" y="195" textAnchor="middle" fill="#8b9dc3" fontSize="11">1. Deposit</text>
        <text x="340" y="195" textAnchor="middle" fill="#8b9dc3" fontSize="11">2. Lock</text>
        <text x="565" y="195" textAnchor="middle" fill="#8b9dc3" fontSize="11">3. Work</text>
        <text x="790" y="195" textAnchor="middle" fill="#8b9dc3" fontSize="11">4. Pay</text>
      </svg>

      {/* Feature cards below */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
          <p className="text-sm font-medium" style={{ color: '#22c55e' }}>No KYC Required</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Agents operate autonomously</p>
        </div>
        <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
          <p className="text-sm font-medium" style={{ color: '#eab308' }}>Funds Secured</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Escrow until work verified</p>
        </div>
        <div className="p-4 rounded-xl text-center" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <p className="text-sm font-medium" style={{ color: '#3b82f6' }}>Instant Release</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Auto-payment on completion</p>
        </div>
      </div>
    </div>
  )
}
