import type { TemplateConfig } from './templates'

export interface CompositionScene {
  text: string
  duration: number
  visualHint?: string
}

export interface CompositionParams {
  template: TemplateConfig
  hook: string
  scenes: CompositionScene[]
  cta: string
  audioPath: string
  outputPath: string
  logoPath?: string
  brandColors?: {
    primary?: string
    secondary?: string
  }
}

interface DrawTextOptions {
  text: string
  fontSize: number
  fontColor: string
  boxColor?: string
  start: number
  end: number
  x: string
  y: string
  lineSpacing?: number
  bold?: boolean
}

const DEFAULT_FONT_REGULAR = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
const DEFAULT_FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'

export function buildFFmpegCommand(params: CompositionParams): string[] {
  const { template, hook, scenes, cta, audioPath, outputPath, brandColors } = params
  const { width, height } = template.resolution
  const fps = template.fps

  const timeline = buildTimeline(scenes, template)
  const backgroundColor = normalizeColorForFfmpeg(template.background.color)

  const videoFilters: string[] = []
  const subtitleY = `h-${template.subtitle.safeMarginBottom}-text_h`
  const topY = `${template.subtitle.safeMarginTop}`
  const centerY = '(h-text_h)/2'

  videoFilters.push(
    buildDrawtextFilter({
      text: hook,
      fontSize: template.hook.fontSize,
      fontColor: normalizeColorForFfmpeg(brandColors?.primary ?? template.hook.color),
      boxColor: normalizeColorForBox(template.hook.bgHighlight),
      start: 0,
      end: timeline.hookEnd,
      x: '(w-text_w)/2',
      y: topY,
      lineSpacing: template.subtitle.lineSpacing,
      bold: true,
    }),
  )

  for (const scene of timeline.scenes) {
    videoFilters.push(
      buildDrawtextFilter({
        text: scene.text,
        fontSize: template.subtitle.fontSize,
        fontColor: normalizeColorForFfmpeg(template.subtitle.color),
        boxColor: normalizeColorForBox(template.subtitle.bgColor),
        start: scene.start,
        end: scene.end,
        x: '(w-text_w)/2',
        y: subtitleY,
        lineSpacing: template.subtitle.lineSpacing,
        bold: template.font.bold,
      }),
    )
  }

  videoFilters.push(
    buildDrawtextFilter({
      text: cta,
      fontSize: template.cta.fontSize,
      fontColor: normalizeColorForFfmpeg(brandColors?.secondary ?? template.cta.color),
      boxColor: normalizeColorForBox(template.cta.bgColor),
      start: timeline.ctaStart,
      end: timeline.totalDuration,
      x: '(w-text_w)/2',
      y: centerY,
      lineSpacing: template.subtitle.lineSpacing,
      bold: true,
    }),
  )

  const filterComplex = [
    `[0:v]${videoFilters.join(',')}[v]`,
    `[1:a]afade=t=in:st=0:d=${template.audio.fadeInSeconds},afade=t=out:st=${Math.max(
      0,
      timeline.totalDuration - template.audio.fadeOutSeconds,
    )}:d=${template.audio.fadeOutSeconds}[a]`,
  ].join(';')

  return [
    '-f',
    'lavfi',
    '-i',
    `color=c=${backgroundColor}:s=${width}x${height}:r=${fps}:d=${timeline.totalDuration}`,
    '-i',
    audioPath,
    '-filter_complex',
    filterComplex,
    '-map',
    '[v]',
    '-map',
    '[a]',
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-crf',
    '23',
    '-pix_fmt',
    'yuv420p',
    '-c:a',
    'aac',
    '-b:a',
    '128k',
    '-movflags',
    '+faststart',
    '-shortest',
    '-y',
    outputPath,
  ]
}

export function computeDuration(scenes: CompositionScene[], template: TemplateConfig): number {
  return buildTimeline(scenes, template).totalDuration
}

function buildTimeline(scenes: CompositionScene[], template: TemplateConfig) {
  const hookDuration = template.hook.durationSeconds
  const ctaDuration = template.cta.durationSeconds
  const transitionDuration = template.transition.durationSeconds

  let cursor = hookDuration

  const timedScenes = scenes.map((scene, index) => {
    const start = cursor
    const end = start + scene.duration
    cursor = end

    if (index < scenes.length - 1) {
      cursor += transitionDuration
    }

    return {
      ...scene,
      start,
      end,
    }
  })

  const ctaStart = cursor
  const totalDuration = ctaStart + ctaDuration

  return {
    hookEnd: hookDuration,
    scenes: timedScenes,
    ctaStart,
    totalDuration,
  }
}

function buildDrawtextFilter(options: DrawTextOptions): string {
  const wrappedText = wrapText(options.text, options.fontSize)
  const fontFile = options.bold ? DEFAULT_FONT_BOLD : DEFAULT_FONT_REGULAR

  const parts = [
    'drawtext',
    `fontfile='${fontFile}'`,
    `text='${escapeDrawtext(wrappedText)}'`,
    `fontsize=${options.fontSize}`,
    `fontcolor=${options.fontColor}`,
    `x=${options.x}`,
    `y=${options.y}`,
    `line_spacing=${options.lineSpacing ?? 8}`,
    `enable='between(t,${options.start},${options.end})'`,
  ]

  if (options.boxColor) {
    parts.push('box=1')
    parts.push(`boxcolor=${options.boxColor}`)
    parts.push('boxborderw=20')
  }

  return parts.join(':')
}

function wrapText(text: string, fontSize: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''

  const maxCharsPerLine = fontSize >= 56 ? 22 : fontSize >= 46 ? 26 : 30
  const words = normalized.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const nextLine = currentLine ? `${currentLine} ${word}` : word
    if (nextLine.length <= maxCharsPerLine) {
      currentLine = nextLine
      continue
    }

    if (currentLine) {
      lines.push(currentLine)
    }

    currentLine = word
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines.slice(0, 3).join('\n')
}

function escapeDrawtext(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\\\'")
    .replace(/:/g, '\\:')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/%/g, '\\%')
}

function normalizeColorForFfmpeg(color: string): string {
  const trimmed = color.trim()

  if (trimmed.startsWith('rgba(')) {
    const parsed = parseRgba(trimmed)
    if (!parsed) return '0x000000'
    return `0x${toHex(parsed.r)}${toHex(parsed.g)}${toHex(parsed.b)}`
  }

  const hex = trimmed.replace('#', '')
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `0x${hex.toUpperCase()}`
  }

  if (/^[0-9a-fA-F]{8}$/.test(hex)) {
    return `0x${hex.toUpperCase()}`
  }

  return '0x000000'
}

function normalizeColorForBox(color?: string): string | undefined {
  if (!color) return undefined

  const trimmed = color.trim()
  if (trimmed === 'transparent') return undefined

  if (trimmed.startsWith('rgba(')) {
    const parsed = parseRgba(trimmed)
    if (!parsed) return undefined

    return `0x${toHex(parsed.r)}${toHex(parsed.g)}${toHex(parsed.b)}@${parsed.a}`
  }

  const hex = trimmed.replace('#', '')
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return `0x${hex.toUpperCase()}@0.85`
  }

  if (/^[0-9a-fA-F]{8}$/.test(hex)) {
    const rgb = hex.slice(0, 6).toUpperCase()
    const alpha = parseInt(hex.slice(6), 16) / 255
    return `0x${rgb}@${alpha.toFixed(2)}`
  }

  return undefined
}

function parseRgba(value: string): { r: number; g: number; b: number; a: number } | null {
  const match = value.match(
    /^rgba\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(0|0?\.\d+|1(?:\.0+)?)\s*\)$/i,
  )

  if (!match) return null

  return {
    r: clampByte(Number(match[1])),
    g: clampByte(Number(match[2])),
    b: clampByte(Number(match[3])),
    a: Math.max(0, Math.min(1, Number(match[4]))),
  }
}

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function toHex(value: number): string {
  return clampByte(value).toString(16).toUpperCase().padStart(2, '0')
}
