export function ReputationDiagram() {
  return (
    <div className="relative w-full max-w-4xl mx-auto py-8">
      {/* SVG Diagram */}
      <svg viewBox="0 0 800 300" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
        {/* Definitions */}
        <defs>
          <filter id="repGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <linearGradient id="repBlueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6"/>
            <stop offset="100%" stopColor="#2563eb"/>
          </linearGradient>

          <linearGradient id="repGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22c55e"/>
            <stop offset="100%" stopColor="#16a34a"/>
          </linearGradient>

          <linearGradient id="repGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#eab308"/>
            <stop offset="100%" stopColor="#ca8a04"/>
          </linearGradient>

          <linearGradient id="repPurpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7"/>
            <stop offset="100%" stopColor="#9333ea"/>
          </linearGradient>

          <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef4444"/>
            <stop offset="25%" stopColor="#f97316"/>
            <stop offset="50%" stopColor="#eab308"/>
            <stop offset="75%" stopColor="#22c55e"/>
            <stop offset="100%" stopColor="#3b82f6"/>
          </linearGradient>

          <linearGradient id="repGlassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.1)"/>
            <stop offset="100%" stopColor="rgba(255,255,255,0.02)"/>
          </linearGradient>
        </defs>

        {/* Background glow */}
        <ellipse cx="400" cy="150" rx="350" ry="120" fill="url(#repBlueGrad)" opacity="0.05" filter="url(#repGlow)"/>

        {/* Formula Section - Top Row */}
        <text x="400" y="35" textAnchor="middle" fill="#f0f4ff" fontSize="14" fontWeight="600">Reputation Score Formula</text>

        {/* Factor boxes */}
        <g>
          {/* Tasks */}
          <rect x="40" y="55" width="130" height="70" rx="12" fill="url(#repGlassGrad)" stroke="#3b82f6" strokeWidth="1.5"/>
          <text x="105" y="80" textAnchor="middle" fill="#3b82f6" fontSize="12" fontWeight="600">Tasks</text>
          <text x="105" y="100" textAnchor="middle" fill="#8b9dc3" fontSize="11">completed x 2</text>
          <text x="105" y="115" textAnchor="middle" fill="#4a5568" fontSize="10">Weight: High</text>
        </g>

        <text x="190" y="95" textAnchor="middle" fill="#4a5568" fontSize="20">+</text>

        <g>
          {/* Success Rate */}
          <rect x="210" y="55" width="130" height="70" rx="12" fill="url(#repGlassGrad)" stroke="#22c55e" strokeWidth="1.5"/>
          <text x="275" y="80" textAnchor="middle" fill="#22c55e" fontSize="12" fontWeight="600">Success</text>
          <text x="275" y="100" textAnchor="middle" fill="#8b9dc3" fontSize="11">rate x 30</text>
          <text x="275" y="115" textAnchor="middle" fill="#4a5568" fontSize="10">Weight: Critical</text>
        </g>

        <text x="360" y="95" textAnchor="middle" fill="#4a5568" fontSize="20">+</text>

        <g>
          {/* Earnings */}
          <rect x="380" y="55" width="130" height="70" rx="12" fill="url(#repGlassGrad)" stroke="#eab308" strokeWidth="1.5"/>
          <text x="445" y="80" textAnchor="middle" fill="#eab308" fontSize="12" fontWeight="600">Earned</text>
          <text x="445" y="100" textAnchor="middle" fill="#8b9dc3" fontSize="11">log(amt) x 10</text>
          <text x="445" y="115" textAnchor="middle" fill="#4a5568" fontSize="10">Weight: Medium</text>
        </g>

        <text x="530" y="95" textAnchor="middle" fill="#4a5568" fontSize="20">+</text>

        <g>
          {/* Age */}
          <rect x="550" y="55" width="130" height="70" rx="12" fill="url(#repGlassGrad)" stroke="#a855f7" strokeWidth="1.5"/>
          <text x="615" y="80" textAnchor="middle" fill="#a855f7" fontSize="12" fontWeight="600">Age</text>
          <text x="615" y="100" textAnchor="middle" fill="#8b9dc3" fontSize="11">days x 0.1</text>
          <text x="615" y="115" textAnchor="middle" fill="#4a5568" fontSize="10">Weight: Low</text>
        </g>

        <text x="700" y="95" textAnchor="middle" fill="#4a5568" fontSize="20">=</text>

        {/* Score Result */}
        <g>
          <rect x="720" y="55" width="70" height="70" rx="12" fill="url(#repGlassGrad)" stroke="url(#scoreGrad)" strokeWidth="2"/>
          <text x="755" y="95" textAnchor="middle" fill="#f0f4ff" fontSize="18" fontWeight="700">0-100</text>
          <text x="755" y="115" textAnchor="middle" fill="#8b9dc3" fontSize="9">Score</text>
        </g>

        {/* Score Bar */}
        <g>
          <rect x="100" y="155" width="600" height="20" rx="10" fill="#1a1f2e"/>
          <rect x="100" y="155" width="600" height="20" rx="10" fill="url(#scoreGrad)" opacity="0.3"/>
          <rect x="100" y="155" width="480" height="20" rx="10" fill="url(#scoreGrad)"/>
          <text x="100" y="190" fill="#ef4444" fontSize="10">0</text>
          <text x="250" y="190" fill="#f97316" fontSize="10">25</text>
          <text x="400" y="190" fill="#eab308" fontSize="10">50</text>
          <text x="550" y="190" fill="#22c55e" fontSize="10">75</text>
          <text x="700" y="190" fill="#3b82f6" fontSize="10">100</text>

          {/* Score indicator */}
          <circle cx="580" cy="165" r="8" fill="#f0f4ff" stroke="#3b82f6" strokeWidth="2"/>
          <text x="580" y="145" textAnchor="middle" fill="#3b82f6" fontSize="12" fontWeight="600">80</text>
        </g>

        {/* Badges Section */}
        <text x="400" y="225" textAnchor="middle" fill="#f0f4ff" fontSize="12" fontWeight="600">Earned Badges</text>

        <g>
          <rect x="120" y="240" width="100" height="35" rx="17.5" fill="rgba(59, 130, 246, 0.2)" stroke="#3b82f6" strokeWidth="1"/>
          <text x="170" y="262" textAnchor="middle" fill="#3b82f6" fontSize="11" fontWeight="500">Verified</text>
        </g>

        <g>
          <rect x="240" y="240" width="100" height="35" rx="17.5" fill="rgba(34, 197, 94, 0.2)" stroke="#22c55e" strokeWidth="1"/>
          <text x="290" y="262" textAnchor="middle" fill="#22c55e" fontSize="11" fontWeight="500">Reliable</text>
        </g>

        <g>
          <rect x="360" y="240" width="100" height="35" rx="17.5" fill="rgba(234, 179, 8, 0.2)" stroke="#eab308" strokeWidth="1"/>
          <text x="410" y="262" textAnchor="middle" fill="#eab308" fontSize="11" fontWeight="500">Expert</text>
        </g>

        <g>
          <rect x="480" y="240" width="120" height="35" rx="17.5" fill="rgba(168, 85, 247, 0.2)" stroke="#a855f7" strokeWidth="1"/>
          <text x="540" y="262" textAnchor="middle" fill="#a855f7" fontSize="11" fontWeight="500">Top Performer</text>
        </g>
      </svg>

      {/* Info cards */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
        <div className="p-3 rounded-lg" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
          <p className="text-xs font-medium" style={{ color: '#3b82f6' }}>Verified</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Identity confirmed</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
          <p className="text-xs font-medium" style={{ color: '#22c55e' }}>Reliable</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{"<1% dispute rate"}</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(234, 179, 8, 0.1)' }}>
          <p className="text-xs font-medium" style={{ color: '#eab308' }}>Expert</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>1000+ tasks</p>
        </div>
        <div className="p-3 rounded-lg" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
          <p className="text-xs font-medium" style={{ color: '#a855f7' }}>Top Performer</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Score 80+</p>
        </div>
      </div>
    </div>
  )
}
