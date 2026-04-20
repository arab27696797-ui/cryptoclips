import { parse, type HTMLElement } from 'node-html-parser'

export interface ExtractionResult {
  success: boolean
  title?: string
  text?: string
  error?: string
}

const REQUEST_TIMEOUT_MS = 15000
const MIN_HTML_LENGTH = 100
const MIN_TEXT_LENGTH = 50
const MAX_TEXT_LENGTH = 8000

export async function extractUrlContent(url: string): Promise<ExtractionResult> {
  try {
    const urlObj = new URL(url)

    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return {
        success: false,
        error: 'Invalid URL protocol',
      }
    }

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      cache: 'no-store',
    }).finally(() => clearTimeout(timeout))

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`,
      }
    }

    const html = await response.text()

    if (!html || html.length < MIN_HTML_LENGTH) {
      return {
        success: false,
        error: 'Empty response',
      }
    }

    const root = parse(html)

    const title =
      root.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      root.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
      root.querySelector('title')?.text?.trim() ||
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
        '.post-body',
      ]

      for (const selector of contentSelectors) {
        const el = root.querySelector(selector)
        if (!el) continue

        articleText = extractTextFromNode(el)
        if (articleText.length >= 200) break
      }
    }

    if (!articleText || articleText.length < 200) {
      const body = root.querySelector('body')
      if (body) {
        const paragraphs = body
          .querySelectorAll('p')
          .map((p) => cleanText(p.text))
          .filter((text) => text.length >= 30)

        articleText = paragraphs.join(' ')
      }
    }

    const cleanArticleText = cleanText(articleText).slice(0, MAX_TEXT_LENGTH)

    if (!cleanArticleText || cleanArticleText.length < MIN_TEXT_LENGTH) {
      return {
        success: false,
        error: 'Could not extract meaningful content from page',
      }
    }

    return {
      success: true,
      title,
      text: cleanArticleText,
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timed out after 15s',
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Extraction failed',
    }
  }
}

function extractTextFromNode(node: HTMLElement): string {
  const removableSelectors = ['script', 'style', 'nav', 'header', 'footer', 'aside']

  for (const selector of removableSelectors) {
    node.querySelectorAll(selector).forEach((el) => el.remove())
  }

  const classBasedRemovals = [
    '.advertisement',
    '.ads',
    '.ad',
    '.promo',
    '.newsletter',
    '.share',
    '.social',
  ]

  for (const selector of classBasedRemovals) {
    node.querySelectorAll(selector).forEach((el) => el.remove())
  }

  const blocks = node.querySelectorAll('p, h1, h2, h3, h4, h5, h6, li')

  return blocks
    .map((el) => cleanText(el.text))
    .filter(Boolean)
    .join(' ')
}

function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/\u00a0/g, ' ').trim()
}
