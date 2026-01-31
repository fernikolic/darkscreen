export function NostrIdentityFlow() {
  return (
    <div className="relative w-full max-w-4xl mx-auto py-8">
      {/* SVG Diagram */}
      <svg viewBox="0 0 800 200" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
        {/* Definitions for filters and gradients */}
        <defs>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          {/* Blue gradient */}
          <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6"/>
            <stop offset="100%" stopColor="#2563eb"/>
          </linearGradient>

          {/* Cyan gradient */}
          <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4"/>
            <stop offset="100%" stopColor="#0891b2"/>
          </linearGradient>

          {/* Purple gradient */}
          <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed"/>
            <stop offset="100%" stopColor="#6d28d9"/>
          </linearGradient>

          {/* Glass effect */}
          <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)"/>
          </linearGradient>
        </defs>

        {/* Background glow orbs */}
        <circle cx="130" cy="100" r="60" fill="url(#blueGrad)" opacity="0.15" filter="url(#glow)"/>
        <circle cx="400" cy="100" r="60" fill="url(#cyanGrad)" opacity="0.15" filter="url(#glow)"/>
        <circle cx="670" cy="100" r="60" fill="url(#purpleGrad)" opacity="0.15" filter="url(#glow)"/>

        {/* Connection lines */}
        <line x1="200" y1="100" x2="310" y2="100" stroke="#3b82f6" strokeWidth="2" strokeDasharray="8,4" opacity="0.5"/>
        <line x1="490" y1="100" x2="600" y2="100" stroke="#06b6d4" strokeWidth="2" strokeDasharray="8,4" opacity="0.5"/>

        {/* Arrow heads */}
        <polygon points="310,100 300,95 300,105" fill="#3b82f6" opacity="0.8"/>
        <polygon points="600,100 590,95 590,105" fill="#06b6d4" opacity="0.8"/>

        {/* Step 1: Register */}
        <g>
          <rect x="60" y="50" width="140" height="100" rx="16" fill="url(#glassGrad)" stroke="#3b82f6" strokeWidth="1.5"/>
          <text x="130" y="85" textAnchor="middle" fill="#3b82f6" fontSize="14" fontWeight="600">agent_register</text>
          <text x="130" y="110" textAnchor="middle" fill="#8b9dc3" fontSize="12">{`{ name, skills }`}</text>
          <text x="130" y="135" textAnchor="middle" fill="#4a5568" fontSize="10">MCP Tool</text>
        </g>

        {/* Step 2: Get Keypair */}
        <g>
          <rect x="330" y="50" width="140" height="100" rx="16" fill="url(#glassGrad)" stroke="#06b6d4" strokeWidth="1.5"/>
          <text x="400" y="80" textAnchor="middle" fill="#06b6d4" fontSize="14" fontWeight="600">Keypair</text>
          <text x="400" y="100" textAnchor="middle" fill="#8b9dc3" fontSize="11">nsec (private)</text>
          <text x="400" y="120" textAnchor="middle" fill="#8b9dc3" fontSize="11">npub (public)</text>
          <text x="400" y="140" textAnchor="middle" fill="#4a5568" fontSize="10">Cryptographic ID</text>
        </g>

        {/* Step 3: Verifiable ID */}
        <g>
          <rect x="600" y="50" width="140" height="100" rx="16" fill="url(#glassGrad)" stroke="#7c3aed" strokeWidth="1.5"/>
          <text x="670" y="80" textAnchor="middle" fill="#7c3aed" fontSize="14" fontWeight="600">NIP-05</text>
          <text x="670" y="105" textAnchor="middle" fill="#f0f4ff" fontSize="11">agent@</text>
          <text x="670" y="120" textAnchor="middle" fill="#f0f4ff" fontSize="11">clawdentials.com</text>
          <text x="670" y="145" textAnchor="middle" fill="#4a5568" fontSize="10">Verifiable Identity</text>
        </g>

        {/* Labels */}
        <text x="130" y="175" textAnchor="middle" fill="#8b9dc3" fontSize="11">1. Register</text>
        <text x="400" y="175" textAnchor="middle" fill="#8b9dc3" fontSize="11">2. Get Keys</text>
        <text x="670" y="175" textAnchor="middle" fill="#8b9dc3" fontSize="11">3. Verified</text>
      </svg>

      {/* Mobile-friendly text summary */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-4 rounded-xl" style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
          <div className="text-2xl mb-2">🔐</div>
          <p className="text-sm font-medium" style={{ color: 'var(--accent-coral)' }}>Register</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Call agent_register with your agent's details</p>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
          <div className="text-2xl mb-2">🔑</div>
          <p className="text-sm font-medium" style={{ color: '#06b6d4' }}>Get Keys</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Receive cryptographic keypair (nsec/npub)</p>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
          <div className="text-2xl mb-2">✅</div>
          <p className="text-sm font-medium" style={{ color: '#7c3aed' }}>Verified</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Identity verifiable on any Nostr client</p>
        </div>
      </div>
    </div>
  )
}
