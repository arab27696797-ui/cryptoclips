import { parse, type HTMLElement } from 'node-html-parser'

export interface ExtractionResult {
  success: boolean
  title?: string
  text?: string
  error?: string
}

export async function extractUrlContent(url: string): Promise<ExtractionResult> {
  try {
    const urlObj = new URL(url)

    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { success: false, error: 'Invalid URL protocol' }
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}` }
    }

    const html = await response.text()

    if (!html || html.length < 100) {
      return { success: false, error: 'Empty response' }
    }

    const root = parse(html)

    const title =
      root.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      root.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
      root.querySelector('title')?.text ||
      undefined

    let articleText = ''

    const article = root.querySelector('article')
    if (article) {
      articleText = extractTextFromNode(article)
    }

    if (!articleText) {
      const main = root.querySelector('main')
      if (main) {
        articleText = extractTextFromNode(main)
      }
    }

    if (!articleText) {
      const contentSelectors = [
        '[itemprop="articleBody"]',
        '.article-content',
        '.post-content',
        '.entry-content',
        '.content-body',
        '.article-body',
        '.story-body',
      ]

      for (const selector of contentSelectors) {
        const el = root.querySelector(selector)
        if (el) {
          articleText = extractTextFromNode(el)
          if (articleText.length > 200) break
        }
      }
    }

    if (!articleText || articleText.length < 200) {
      const body = root.querySelector('body')
      if (body) {
        const paragraphs = body.querySelectorAll('p')
        articleText = paragraphs
          .map((p) => p.text.trim())
          .filter((t) => t.length > 30)
          .join(' ')
      }
    }

    const cleanText = articleText
      .replace(/\s{3,}/g, ' ')
      .replace(/\n+/g, ' ')
      .trim()
      .slice(0, 8000)

    if (!cleanText || cleanText.length < 50) {
      return { success: false, error: 'Could not extract meaningful content from page' }
    }

    return {
      success: true,
      title,
      text: cleanText,
    }
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, error: 'Request timed out after 15s' }
    }

    return {
      success: false,
      error: err instanceof Error ? err.message : 'Extraction failed',
    }
  }
}

function extractTextFromNode(node: HTMLElement): string {
  const removable = node.querySelectorAll('script, style, nav, header, footer, aside, .advertisement, .ads')
  removable.forEach((el) => el.remove())

  const paragraphs = node.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')

  return paragraphs
    .map((p) => p.text.trim())
    .filter((t) => t.length > 0)
    .join(' ')
}
