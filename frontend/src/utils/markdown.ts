import MarkdownIt from 'markdown-it'
import DOMPurify from 'dompurify'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true
})

export function render_markdown_html(markdown: string): string {
  const raw = md.render(markdown || '')
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true }
  })
}

