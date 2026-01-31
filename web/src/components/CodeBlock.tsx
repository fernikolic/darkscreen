interface CodeBlockProps {
  code: string
  title?: string
}

export function CodeBlock({ code, title }: CodeBlockProps) {
  return (
    <div className="code-block">
      <div className="code-block-header">
        <div className="code-block-dot" style={{ background: '#ff5f57' }} />
        <div className="code-block-dot" style={{ background: '#ffbd2e' }} />
        <div className="code-block-dot" style={{ background: '#28ca42' }} />
        {title && (
          <span className="ml-3 text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{title}</span>
        )}
      </div>
      <pre>{code}</pre>
    </div>
  )
}
