import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'

interface TableOfContentsItem {
  id: string
  text: string
  level: number
}

// Simple markdown to HTML parser
function parseMarkdown(markdown: string): string {
  let html = markdown

  // Escape HTML first
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  // Code blocks (fenced) - must be before other processing
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const language = lang || 'text'
    return `<div class="code-block my-6"><div class="code-block-header"><span class="code-block-dot" style="background: #ff5f56;"></span><span class="code-block-dot" style="background: #ffbd2e;"></span><span class="code-block-dot" style="background: #27ca40;"></span><span class="ml-auto text-xs" style="color: var(--text-muted);">${language}</span></div><pre><code class="language-${language}">${code.trim()}</code></pre></div>`
  })

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')

  // Tables
  html = html.replace(/^\|(.+)\|\s*\n\|[-:\s|]+\|\s*\n((?:\|.+\|\s*\n?)+)/gm, (_, header, body) => {
    const headers = header.split('|').map((h: string) => h.trim()).filter(Boolean)
    const rows = body.trim().split('\n').map((row: string) =>
      row.split('|').map((cell: string) => cell.trim()).filter(Boolean)
    )

    const headerHtml = headers.map((h: string) => `<th>${h}</th>`).join('')
    const bodyHtml = rows.map((row: string[]) =>
      `<tr>${row.map((cell: string) => `<td>${cell}</td>`).join('')}</tr>`
    ).join('')

    return `<div class="table-wrapper my-6"><table class="content-table"><thead><tr>${headerHtml}</tr></thead><tbody>${bodyHtml}</tbody></table></div>`
  })

  // Blockquotes
  html = html.replace(/^&gt;\s*(.+)$/gm, '<blockquote class="content-blockquote">$1</blockquote>')
  // Merge consecutive blockquotes
  html = html.replace(/<\/blockquote>\s*<blockquote class="content-blockquote">/g, '<br/>')

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr class="content-hr"/>')

  // Headers with IDs for anchor links
  html = html.replace(/^### (.+)$/gm, (_, text) => {
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return `<h3 id="${id}" class="content-h3">${text}</h3>`
  })
  html = html.replace(/^## (.+)$/gm, (_, text) => {
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return `<h2 id="${id}" class="content-h2">${text}</h2>`
  })
  html = html.replace(/^# (.+)$/gm, (_, text) => {
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    return `<h1 id="${id}" class="content-h1">${text}</h1>`
  })

  // Bold and italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>')

  // Links - convert .md links to /docs/ routes
  html = html.replace(/\[([^\]]+)\]\(\.\/([^)]+)\.md\)/g, '<a href="/docs/$2" class="content-link">$1</a>')
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, text, url) => {
    const isExternal = url.startsWith('http')
    if (isExternal) {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="content-link external-link">${text}</a>`
    }
    return `<a href="${url}" class="content-link">${text}</a>`
  })

  // Lists (unordered)
  html = html.replace(/^- (.+)$/gm, '<li class="content-li">$1</li>')
  // Wrap consecutive li elements in ul
  html = html.replace(/(<li class="content-li">.*<\/li>\n?)+/g, (match) => {
    return `<ul class="content-ul">${match}</ul>`
  })

  // Numbered lists
  html = html.replace(/^\d+\.\s+(.+)$/gm, '<li class="content-li-numbered">$1</li>')
  // Wrap consecutive numbered li elements in ol
  html = html.replace(/(<li class="content-li-numbered">.*<\/li>\n?)+/g, (match) => {
    return `<ol class="content-ol">${match}</ol>`
  })

  // Paragraphs - wrap remaining lines that aren't already wrapped
  const lines = html.split('\n')
  const processedLines = lines.map(line => {
    const trimmed = line.trim()
    if (!trimmed) return ''
    // Skip if already processed (starts with HTML tag)
    if (trimmed.startsWith('<')) return line
    return `<p class="content-p">${trimmed}</p>`
  })
  html = processedLines.join('\n')

  // Clean up empty paragraphs
  html = html.replace(/<p class="content-p"><\/p>/g, '')

  return html
}

// Extract title from markdown (first h1)
function extractTitle(markdown: string): string {
  const match = markdown.match(/^# (.+)$/m)
  return match ? match[1] : 'Documentation'
}

// Extract description (first blockquote or first paragraph after h1)
function extractDescription(markdown: string): string {
  // Try blockquote first
  const blockquoteMatch = markdown.match(/^> (.+)$/m)
  if (blockquoteMatch) {
    return blockquoteMatch[1].replace(/\*\*([^*]+)\*\*/g, '$1')
  }

  // Try first paragraph after title
  const paragraphMatch = markdown.match(/^# .+\n\n(.+)$/m)
  if (paragraphMatch) {
    return paragraphMatch[1].substring(0, 160)
  }

  return 'Clawdentials documentation - Trust infrastructure for AI agents'
}

// Extract table of contents from markdown
function extractTableOfContents(markdown: string): TableOfContentsItem[] {
  const items: TableOfContentsItem[] = []
  const regex = /^(#{2,3}) (.+)$/gm
  let match

  while ((match = regex.exec(markdown)) !== null) {
    const level = match[1].length
    const text = match[2]
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    items.push({ id, text, level })
  }

  return items
}

// Convert slug to title format for keywords
function slugToTitle(slug: string): string {
  return slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
}

export function Content() {
  const { slug } = useParams<{ slug: string }>()
  const [markdown, setMarkdown] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setError('No content specified')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    fetch(`/content/${slug}.md`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Content not found')
        }
        return response.text()
      })
      .then(text => {
        setMarkdown(text)
        setLoading(false)
      })
      .catch(() => {
        setError('Content not found')
        setLoading(false)
      })
  }, [slug])

  const html = useMemo(() => parseMarkdown(markdown), [markdown])
  const title = useMemo(() => extractTitle(markdown), [markdown])
  const description = useMemo(() => extractDescription(markdown), [markdown])
  const tableOfContents = useMemo(() => extractTableOfContents(markdown), [markdown])

  // Update document title and meta tags
  useEffect(() => {
    if (!markdown || !slug) return

    // Update title
    document.title = `${title} | Clawdentials`

    // Update or create meta description
    let metaDescription = document.querySelector('meta[name="description"]')
    if (!metaDescription) {
      metaDescription = document.createElement('meta')
      metaDescription.setAttribute('name', 'description')
      document.head.appendChild(metaDescription)
    }
    metaDescription.setAttribute('content', description)

    // Update or create OG tags
    const ogTags = [
      { property: 'og:title', content: `${title} | Clawdentials` },
      { property: 'og:description', content: description },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: `https://clawdentials.com/docs/${slug}` },
    ]

    ogTags.forEach(({ property, content }) => {
      let metaTag = document.querySelector(`meta[property="${property}"]`)
      if (!metaTag) {
        metaTag = document.createElement('meta')
        metaTag.setAttribute('property', property)
        document.head.appendChild(metaTag)
      }
      metaTag.setAttribute('content', content)
    })

    // Update or create Twitter tags
    const twitterTags = [
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: `${title} | Clawdentials` },
      { name: 'twitter:description', content: description },
    ]

    twitterTags.forEach(({ name, content }) => {
      let metaTag = document.querySelector(`meta[name="${name}"]`)
      if (!metaTag) {
        metaTag = document.createElement('meta')
        metaTag.setAttribute('name', name)
        document.head.appendChild(metaTag)
      }
      metaTag.setAttribute('content', content)
    })

    // Update or create canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', `https://clawdentials.com/docs/${slug}`)

    // Add JSON-LD Article schema
    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: title,
      description: description,
      author: {
        '@type': 'Organization',
        name: 'Clawdentials',
        url: 'https://clawdentials.com'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Clawdentials',
        url: 'https://clawdentials.com',
        logo: {
          '@type': 'ImageObject',
          url: 'https://clawdentials.com/logo.png'
        }
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://clawdentials.com/docs/${slug}`
      },
      keywords: slugToTitle(slug),
      about: {
        '@type': 'Thing',
        name: 'AI Agent Infrastructure'
      }
    }

    // Remove existing JSON-LD if present
    const existingScript = document.querySelector('script[data-content-jsonld]')
    if (existingScript) {
      existingScript.remove()
    }

    // Add new JSON-LD script
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-content-jsonld', 'true')
    script.textContent = JSON.stringify(jsonLd)
    document.head.appendChild(script)

    // Cleanup on unmount
    return () => {
      document.title = 'Clawdentials'
      const jsonLdScript = document.querySelector('script[data-content-jsonld]')
      if (jsonLdScript) {
        jsonLdScript.remove()
      }
    }
  }, [markdown, slug, title, description])

  // Scroll to hash on load
  useEffect(() => {
    if (!loading && window.location.hash) {
      const id = window.location.hash.slice(1)
      const element = document.getElementById(id)
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      }
    }
  }, [loading, html])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg" style={{ color: 'var(--text-secondary)' }}>
          Loading...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-6xl font-bold mb-4" style={{ color: 'var(--text-muted)' }}>404</div>
        <h1 className="font-display text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
          Content Not Found
        </h1>
        <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
          The documentation page you're looking for doesn't exist.
        </p>
        <div className="flex gap-4">
          <Link to="/" className="btn-primary">
            Go Home
          </Link>
          <Link to="/docs/index" className="btn-secondary">
            Browse Docs
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Breadcrumb */}
      <nav className="max-w-7xl mx-auto px-6 pt-8" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-sm">
          <li>
            <Link to="/" className="hover:underline" style={{ color: 'var(--text-secondary)' }}>
              Home
            </Link>
          </li>
          <li style={{ color: 'var(--text-muted)' }}>/</li>
          <li>
            <Link to="/docs/index" className="hover:underline" style={{ color: 'var(--text-secondary)' }}>
              Docs
            </Link>
          </li>
          <li style={{ color: 'var(--text-muted)' }}>/</li>
          <li style={{ color: 'var(--accent-coral)' }}>{slugToTitle(slug || '')}</li>
        </ol>
      </nav>

      {/* Main content with sidebar */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Main content */}
          <article className="flex-1 min-w-0">
            <div
              className="prose-content"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </article>

          {/* Sidebar - Table of Contents */}
          {tableOfContents.length > 0 && (
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <h4 className="font-display font-semibold mb-4 text-sm uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  On This Page
                </h4>
                <nav>
                  <ul className="space-y-2">
                    {tableOfContents.map((item) => (
                      <li
                        key={item.id}
                        style={{ paddingLeft: item.level === 3 ? '1rem' : '0' }}
                      >
                        <a
                          href={`#${item.id}`}
                          className="block text-sm py-1 transition-colors hover:text-[var(--accent-coral)]"
                          style={{ color: 'var(--text-secondary)' }}
                          onClick={(e) => {
                            e.preventDefault()
                            const element = document.getElementById(item.id)
                            if (element) {
                              element.scrollIntoView({ behavior: 'smooth' })
                              window.history.pushState(null, '', `#${item.id}`)
                            }
                          }}
                        >
                          {item.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* Styles for prose content */}
      <style>{`
        .prose-content {
          color: var(--text-secondary);
          line-height: 1.75;
        }

        .prose-content .content-h1 {
          font-family: 'Outfit', system-ui, sans-serif;
          font-size: 2.25rem;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 1.5rem;
          line-height: 1.2;
        }

        .prose-content .content-h2 {
          font-family: 'Outfit', system-ui, sans-serif;
          font-size: 1.5rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          padding-bottom: 0.5rem;
          border-bottom: 1px solid var(--border-subtle);
        }

        .prose-content .content-h3 {
          font-family: 'Outfit', system-ui, sans-serif;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }

        .prose-content .content-p {
          margin-bottom: 1rem;
        }

        .prose-content .content-blockquote {
          border-left: 4px solid var(--accent-coral);
          padding: 1rem 1.5rem;
          margin: 1.5rem 0;
          background: var(--bg-surface);
          border-radius: 0 0.5rem 0.5rem 0;
          font-style: italic;
          color: var(--text-primary);
        }

        .prose-content .content-hr {
          border: none;
          border-top: 1px solid var(--border-subtle);
          margin: 2rem 0;
        }

        .prose-content .content-ul,
        .prose-content .content-ol {
          margin: 1rem 0;
          padding-left: 1.5rem;
        }

        .prose-content .content-li,
        .prose-content .content-li-numbered {
          margin-bottom: 0.5rem;
        }

        .prose-content .content-link {
          color: var(--accent-coral);
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.2s;
        }

        .prose-content .content-link:hover {
          border-color: var(--accent-coral);
        }

        .prose-content .external-link::after {
          content: ' ↗';
          font-size: 0.75em;
        }

        .prose-content .inline-code {
          background: var(--bg-elevated);
          color: var(--accent-coral);
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.875em;
        }

        .prose-content .table-wrapper {
          overflow-x: auto;
        }

        .prose-content .content-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.875rem;
        }

        .prose-content .content-table th {
          background: var(--bg-surface);
          color: var(--text-primary);
          font-weight: 600;
          text-align: left;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-subtle);
        }

        .prose-content .content-table td {
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-subtle);
        }

        .prose-content .content-table tr:nth-child(even) {
          background: var(--bg-surface);
        }

        /* Scroll margin for anchor links */
        .prose-content h1[id],
        .prose-content h2[id],
        .prose-content h3[id] {
          scroll-margin-top: 6rem;
        }
      `}</style>
    </>
  )
}
