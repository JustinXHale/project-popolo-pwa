function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function inlineFormat(text: string): string {
  const escaped = escapeHtml(text)
  return escaped
    .replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+|\/[^\s)]+)\)/g,
      '<a href="$2">$1</a>',
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
}

/** Small Markdown subset for GitHub-edited pages. HTML in source is escaped. */
export function renderMarkdown(source: string): string {
  const lines = source.replaceAll('\r\n', '\n').split('\n')
  const out: string[] = []
  let list: 'ul' | 'ol' | null = null
  let para: string[] = []

  const flushPara = () => {
    if (!para.length) return
    out.push(`<p>${inlineFormat(para.join(' '))}</p>`)
    para = []
  }
  const flushList = () => {
    if (!list) return
    out.push(`</${list}>`)
    list = null
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) {
      flushPara()
      flushList()
      continue
    }
    const heading = /^(#{1,3})\s+(.*)$/.exec(line)
    if (heading) {
      flushPara()
      flushList()
      const level = heading[1].length
      out.push(`<h${level}>${inlineFormat(heading[2])}</h${level}>`)
      continue
    }
    const ul = /^[-*]\s+(.*)$/.exec(line)
    if (ul) {
      flushPara()
      if (list !== 'ul') {
        flushList()
        list = 'ul'
        out.push('<ul>')
      }
      out.push(`<li>${inlineFormat(ul[1])}</li>`)
      continue
    }
    const ol = /^\d+\.\s+(.*)$/.exec(line)
    if (ol) {
      flushPara()
      if (list !== 'ol') {
        flushList()
        list = 'ol'
        out.push('<ol>')
      }
      out.push(`<li>${inlineFormat(ol[1])}</li>`)
      continue
    }
    flushList()
    para.push(line.trim())
  }
  flushPara()
  flushList()
  return out.join('\n')
}

export function parseFrontmatter(raw: string): {
  data: Record<string, string>
  body: string
} {
  const text = raw.replace(/^\uFEFF/, '')
  if (!text.startsWith('---')) {
    return { data: {}, body: text }
  }
  const end = text.indexOf('\n---', 3)
  if (end === -1) return { data: {}, body: text }
  const matter = text.slice(4, end).trim()
  const body = text.slice(end + 4).replace(/^\n/, '')
  const data: Record<string, string> = {}
  for (const line of matter.split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    let value = line.slice(idx + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    data[key] = value
  }
  return { data, body }
}
