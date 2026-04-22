import { Marked, marked } from 'marked'
import type { Token, Tokens } from 'marked'

export interface MarkdownTocItem {
  level: number
  text: string
  id: string
}

function slugify(input: string): string {
  const t = input.trim()
  if (!t) return 'section'
  let s = t.toLowerCase().replace(/\s+/g, '-')
  s = s.replace(/[^a-z0-9\u4e00-\u9fff_-]/gi, '')
  return s || 'section'
}

function makeUniqueId(base: string, used: Set<string>): string {
  let id = base
  let n = 1
  while (used.has(id)) {
    id = `${base}-${n++}`
  }
  used.add(id)
  return id
}

/** 与 marked 渲染顺序一致的标题列表（含 setext / ATX） */
export function collectMarkdownHeadings(src: string): Tokens.Heading[] {
  const tokens = marked.lexer(src)
  const headings: Tokens.Heading[] = []
  marked.walkTokens(tokens, (token: Token) => {
    if (token.type === 'heading') {
      headings.push(token as Tokens.Heading)
    }
  })
  return headings
}

export function buildMarkdownTocFromHeadings(headings: Tokens.Heading[]): MarkdownTocItem[] {
  const used = new Set<string>()
  return headings.map((h) => {
    const text = h.text.trim()
    const base = slugify(text)
    const id = makeUniqueId(base || `h-${h.depth}`, used)
    return { level: h.depth, text, id }
  })
}

export function renderMarkdownWithHeadingIds(src: string): {
  html: string
  toc: MarkdownTocItem[]
} {
  const headings = collectMarkdownHeadings(src)
  const toc = buildMarkdownTocFromHeadings(headings)
  let i = 0
  const instance = new Marked()
  instance.use({
    renderer: {
      heading(
        this: { parser: { parseInline: (t: Tokens.Generic[]) => string } },
        token: Tokens.Heading
      ) {
        const item = toc[i++]
        const id = item?.id ?? `md-h-${i}`
        const body = this.parser.parseInline(token.tokens)
        return `<h${token.depth} id="${id}">${body}</h${token.depth}>\n`
      },
    },
  })
  const html = instance.parse(src, { async: false }) as string
  return { html, toc }
}
