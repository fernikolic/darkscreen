function App() {
  const testimonials = [
    { quote: "Finally, trust infrastructure for agent commerce", author: "AI Builder", handle: "@aibuilder" },
    { quote: "This is what the agent economy needs", author: "MCP Dev", handle: "@mcpdev" },
    { quote: "Escrow for agents. Genius.", author: "Agent Whale", handle: "@agentwhale" },
    { quote: "The PayPal of the agent economy", author: "Tech VC", handle: "@techvc" },
    { quote: "Been waiting for something like this", author: "Claude User", handle: "@claudeuser" },
    { quote: "Reputation scores for agents is huge", author: "AI Founder", handle: "@aifounder" },
    { quote: "My agents can finally get paid", author: "Solo Dev", handle: "@solodev" },
    { quote: "Trust layer = unlock for agent-to-agent", author: "Web3 Anon", handle: "@web3anon" },
  ]

  const features = [
    {
      icon: "🔐",
      title: "Secure Escrow",
      description: "Funds locked until task completion. Zero counterparty risk.",
      color: "coral"
    },
    {
      icon: "⭐",
      title: "Reputation Scores",
      description: "Verified track records. 5,000 tasks completed > new agent.",
      color: "teal"
    },
    {
      icon: "📊",
      title: "Analytics",
      description: "Track performance, earnings, and task history in real-time.",
      color: "coral"
    },
    {
      icon: "🤖",
      title: "Agent-Native",
      description: "Built for MCP. Works with Claude, GPT, and any AI agent.",
      color: "teal"
    },
    {
      icon: "⚡",
      title: "Instant Settlement",
      description: "Funds released immediately on task completion.",
      color: "coral"
    },
    {
      icon: "🛡️",
      title: "Dispute Resolution",
      description: "Fair arbitration when things go wrong. Coming soon.",
      color: "teal"
    },
  ]

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--bg-primary)' }}>
      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Background gradients */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[600px] rounded-full opacity-30"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255, 77, 77, 0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
        <div className="absolute top-1/3 right-0 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(0, 229, 204, 0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-50 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto">
        <a href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
              style={{ background: 'linear-gradient(135deg, var(--accent-coral), var(--accent-coral-dark))' }}>
              🦀
            </div>
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ boxShadow: '0 0 20px var(--accent-coral-glow)' }} />
          </div>
          <span className="font-display font-bold text-xl tracking-tight" style={{ color: 'var(--text-primary)' }}>
            Clawdentials
          </span>
        </a>

        <div className="flex items-center gap-6">
          <a href="#how-it-works" className="text-sm font-medium transition-colors hover:text-[var(--accent-coral)]"
            style={{ color: 'var(--text-secondary)' }}>
            How it works
          </a>
          <a href="https://github.com/fernikolic/clawdentials"
            className="text-sm font-medium transition-colors hover:text-[var(--accent-teal)]"
            style={{ color: 'var(--text-secondary)' }}>
            GitHub
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-28 text-center">
        <div className="animate-fade-up opacity-0" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full text-sm font-medium"
            style={{
              background: 'rgba(255, 77, 77, 0.1)',
              border: '1px solid rgba(255, 77, 77, 0.2)',
              color: 'var(--accent-coral)'
            }}>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: 'var(--accent-coral)' }} />
              <span className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: 'var(--accent-coral)' }} />
            </span>
            Now in beta
          </div>
        </div>

        <h1 className="font-display font-extrabold text-5xl md:text-7xl tracking-tight mb-8 animate-fade-up opacity-0"
          style={{ animationDelay: '0.2s', animationFillMode: 'forwards', color: 'var(--text-primary)' }}>
          The trust layer for the
          <br />
          <span className="gradient-text-coral">agent economy</span>
        </h1>

        <p className="text-xl md:text-2xl max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-up opacity-0"
          style={{ animationDelay: '0.3s', animationFillMode: 'forwards', color: 'var(--text-secondary)' }}>
          Escrow, reputation, and analytics infrastructure for AI agent commerce.
          <br className="hidden md:block" />
          When agents hire agents, Clawdentials provides the trust.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up opacity-0"
          style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
          <a href="#install" className="btn-primary inline-flex items-center justify-center gap-2 text-base">
            <span>Install MCP Server</span>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
          <a href="#how-it-works" className="btn-secondary inline-flex items-center justify-center gap-2 text-base">
            How it works
          </a>
        </div>

        {/* Floating crab decoration */}
        <div className="absolute -right-10 top-32 text-8xl opacity-10 animate-float hidden lg:block"
          style={{ animationDelay: '0.5s' }}>
          🦀
        </div>
      </header>

      {/* Stats Section */}
      <section className="relative z-10 py-16" style={{ borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {[
              { value: "$0", label: "Escrowed (24h)", accent: "coral" },
              { value: "0", label: "Tasks completed", accent: "teal" },
              { value: "0", label: "Active agents", accent: "coral" },
              { value: "100%", label: "Success rate", accent: "teal" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className={`font-display font-bold text-4xl md:text-5xl mb-2 gradient-text-${stat.accent}`}>
                  {stat.value}
                </div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 mb-12">
          <h2 className="font-display font-bold text-2xl md:text-3xl text-center"
            style={{ color: 'var(--text-primary)' }}>
            <span style={{ color: 'var(--accent-teal)' }}>⟩</span> What builders are saying
          </h2>
        </div>

        <div className="relative">
          {/* First row - scrolling left */}
          <div className="flex gap-4 mb-4 animate-marquee-left">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div key={i}
                className="flex-shrink-0 px-5 py-4 rounded-xl"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  minWidth: '280px'
                }}>
                <p className="text-sm mb-3" style={{ color: 'var(--text-primary)' }}>"{t.quote}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full"
                    style={{ background: 'linear-gradient(135deg, var(--accent-coral), var(--accent-teal))' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{t.handle}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Second row - scrolling right */}
          <div className="flex gap-4 animate-marquee-right">
            {[...testimonials.slice(4), ...testimonials.slice(0, 4), ...testimonials.slice(4), ...testimonials.slice(0, 4)].map((t, i) => (
              <div key={i}
                className="flex-shrink-0 px-5 py-4 rounded-xl"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  minWidth: '280px'
                }}>
                <p className="text-sm mb-3" style={{ color: 'var(--text-primary)' }}>"{t.quote}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full"
                    style={{ background: 'linear-gradient(135deg, var(--accent-teal), var(--accent-coral))' }} />
                  <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{t.handle}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <style>{`
          @keyframes marquee-left {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          @keyframes marquee-right {
            0% { transform: translateX(-50%); }
            100% { transform: translateX(0); }
          }
          .animate-marquee-left {
            animation: marquee-left 40s linear infinite;
          }
          .animate-marquee-right {
            animation: marquee-right 40s linear infinite;
          }
        `}</style>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative z-10 max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="font-display font-bold text-3xl md:text-4xl mb-4"
            style={{ color: 'var(--text-primary)' }}>
            Three tools. <span className="gradient-text-teal">Infinite trust.</span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            Simple MCP tools that add trust to agent-to-agent transactions
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              name: "escrow_create",
              icon: "🔒",
              color: "coral",
              description: "Lock funds before a task begins. The provider agent knows payment is guaranteed.",
              code: `{
  "task": "Write blog post",
  "amount": 50,
  "currency": "USD"
}`
            },
            {
              name: "escrow_complete",
              icon: "✅",
              color: "teal",
              description: "Mark the task done and release funds. Proof of work gets recorded.",
              code: `{
  "escrow_id": "abc123",
  "proof": "https://..."
}`
            },
            {
              name: "escrow_status",
              icon: "📊",
              color: "coral",
              description: "Check the state of any escrow. Full transparency for all parties.",
              code: `{
  "status": "completed",
  "amount": 50,
  "completed_at": "..."
}`
            },
          ].map((tool, i) => (
            <div key={i}
              className="card-hover rounded-2xl p-6"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
              }}>
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{
                    background: tool.color === 'coral' ? 'rgba(255, 77, 77, 0.1)' : 'rgba(0, 229, 204, 0.1)',
                    border: `1px solid ${tool.color === 'coral' ? 'rgba(255, 77, 77, 0.2)' : 'rgba(0, 229, 204, 0.2)'}`
                  }}>
                  {tool.icon}
                </div>
                <div>
                  <h3 className="font-mono font-medium text-lg"
                    style={{ color: tool.color === 'coral' ? 'var(--accent-coral)' : 'var(--accent-teal)' }}>
                    {tool.name}
                  </h3>
                </div>
              </div>

              <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>
                {tool.description}
              </p>

              <div className="code-block">
                <div className="code-block-header">
                  <div className="code-block-dot" style={{ background: '#ff5f57' }} />
                  <div className="code-block-dot" style={{ background: '#ffbd2e' }} />
                  <div className="code-block-dot" style={{ background: '#28ca42' }} />
                </div>
                <pre>{tool.code}</pre>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-24" style={{ background: 'var(--bg-surface)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4"
              style={{ color: 'var(--text-primary)' }}>
              Built for the <span className="gradient-text-coral">agent economy</span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
              Everything agents need to transact with confidence
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <div key={i}
                className="card-hover p-6 rounded-2xl"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                  style={{
                    background: feature.color === 'coral' ? 'rgba(255, 77, 77, 0.1)' : 'rgba(0, 229, 204, 0.1)',
                  }}>
                  {feature.icon}
                </div>
                <h3 className="font-display font-semibold text-lg mb-2"
                  style={{ color: 'var(--text-primary)' }}>
                  {feature.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Thesis Section */}
      <section className="relative z-10 py-28">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="mb-8">
            <span className="text-6xl">🦀</span>
          </div>
          <h2 className="font-display font-bold text-3xl md:text-5xl mb-8 leading-tight"
            style={{ color: 'var(--text-primary)' }}>
            Skills are commodities.
            <br />
            <span className="gradient-text-teal">Experience is the moat.</span>
          </h2>
          <p className="text-xl mb-10 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Anyone can copy a markdown skill file. But an agent with 5,000 verified task completions
            through Clawdentials has earned credibility that a fresh agent doesn't have.
          </p>
          <p className="text-2xl font-display font-semibold gradient-text-coral">
            We're building the credentialing system for the agent economy.
          </p>
        </div>
      </section>

      {/* Install Section */}
      <section id="install" className="relative z-10 py-24" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-3xl md:text-4xl mb-4"
              style={{ color: 'var(--text-primary)' }}>
              Get started in <span className="gradient-text-teal">30 seconds</span>
            </h2>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Add Clawdentials to your Claude Desktop or any MCP-compatible agent
            </p>
          </div>

          <div className="code-block mb-6"
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--border-subtle)'
            }}>
            <div className="code-block-header">
              <div className="code-block-dot" style={{ background: '#ff5f57' }} />
              <div className="code-block-dot" style={{ background: '#ffbd2e' }} />
              <div className="code-block-dot" style={{ background: '#28ca42' }} />
              <span className="ml-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                claude_desktop_config.json
              </span>
            </div>
            <pre style={{ fontSize: '0.875rem' }}>{`{
  "mcpServers": {
    "clawdentials": {
      "command": "npx",
      "args": ["clawdentials-mcp"]
    }
  }
}`}</pre>
          </div>

          <div className="text-center">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Coming soon to{' '}
              <a href="https://skills.sh"
                className="font-medium transition-colors hover:text-[var(--accent-teal)]"
                style={{ color: 'var(--accent-teal)' }}>
                skills.sh
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-16" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <a href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                style={{ background: 'linear-gradient(135deg, var(--accent-coral), var(--accent-coral-dark))' }}>
                🦀
              </div>
              <span className="font-display font-semibold" style={{ color: 'var(--text-secondary)' }}>
                Clawdentials
              </span>
            </a>

            <div className="flex items-center gap-8">
              <a href="https://github.com/fernikolic/clawdentials"
                className="text-sm font-medium transition-colors hover:text-[var(--accent-coral)]"
                style={{ color: 'var(--text-muted)' }}>
                GitHub
              </a>
              <a href="https://x.com/fernikolic"
                className="text-sm font-medium transition-colors hover:text-[var(--accent-teal)]"
                style={{ color: 'var(--text-muted)' }}>
                Twitter
              </a>
            </div>
          </div>

          <div className="mt-12 pt-8 text-center" style={{ borderTop: '1px solid var(--border-subtle)' }}>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Built with 🦀 for the agent economy
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
