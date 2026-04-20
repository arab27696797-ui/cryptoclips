export interface TemplateConfig {
  key: string
  name: string
  description: string
  resolution: {
    width: number
    height: number
  }
  fps: number
  background: {
    type: 'solid' | 'gradient'
    color: string
    color2?: string
    direction?: 'vertical' | 'diagonal'
  }
  font: {
    family: string
    size: number
    color: string
    bold: boolean
    align: 'center' | 'left'
  }
  subtitle: {
    fontSize: number
    color: string
    bgColor: string
    maxLines: number
    lineSpacing: number
    safeMarginTop: number
    safeMarginBottom: number
    safeMarginSides: number
  }
  hook: {
    fontSize: number
    color: string
    bgHighlight: string
    durationSeconds: number
  }
  transition: {
    type: 'fade' | 'slide' | 'cut'
    durationSeconds: number
  }
  cta: {
    fontSize: number
    color: string
    bgColor: string
    durationSeconds: number
  }
  logo?: {
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    size: number
    opacity: number
  }
  audio: {
    fadeInSeconds: number
    fadeOutSeconds: number
  }
}

export const TEMPLATES: Record<string, TemplateConfig> = {
  'clean-news': {
    key: 'clean-news',
    name: 'Clean News',
    description: 'Professional news-style layout with clean typography.',
    resolution: {
      width: 1080,
      height: 1920,
    },
    fps: 30,
    background: {
      type: 'gradient',
      color: '0D1117',
      color2: '161B22',
      direction: 'vertical',
    },
    font: {
      family: 'DejaVu Sans',
      size: 48,
      color: 'FFFFFF',
      bold: true,
      align: 'center',
    },
    subtitle: {
      fontSize: 42,
      color: 'FFFFFF',
      bgColor: 'rgba(0,0,0,0.65)',
      maxLines: 2,
      lineSpacing: 8,
      safeMarginTop: 160,
      safeMarginBottom: 320,
      safeMarginSides: 60,
    },
    hook: {
      fontSize: 56,
      color: 'F7931A',
      bgHighlight: 'rgba(247,147,26,0.15)',
      durationSeconds: 2,
    },
    transition: {
      type: 'fade',
      durationSeconds: 0.5,
    },
    cta: {
      fontSize: 44,
      color: 'FFFFFF',
      bgColor: 'F7931A',
      durationSeconds: 3,
    },
    logo: {
      position: 'top-right',
      size: 80,
      opacity: 0.8,
    },
    audio: {
      fadeInSeconds: 0.3,
      fadeOutSeconds: 0.5,
    },
  },
  'bold-market': {
    key: 'bold-market',
    name: 'Bold Market',
    description: 'High-energy market update with stronger accents.',
    resolution: {
      width: 1080,
      height: 1920,
    },
    fps: 30,
    background: {
      type: 'gradient',
      color: '1A1A2E',
      color2: '16213E',
      direction: 'diagonal',
    },
    font: {
      family: 'DejaVu Sans',
      size: 52,
      color: 'EAEAEA',
      bold: true,
      align: 'center',
    },
    subtitle: {
      fontSize: 46,
      color: 'FFFFFF',
      bgColor: 'rgba(233,69,96,0.70)',
      maxLines: 2,
      lineSpacing: 10,
      safeMarginTop: 180,
      safeMarginBottom: 300,
      safeMarginSides: 50,
    },
    hook: {
      fontSize: 64,
      color: 'E94560',
      bgHighlight: 'rgba(233,69,96,0.20)',
      durationSeconds: 2,
    },
    transition: {
      type: 'slide',
      durationSeconds: 0.4,
    },
    cta: {
      fontSize: 48,
      color: 'FFFFFF',
      bgColor: 'E94560',
      durationSeconds: 3,
    },
    logo: {
      position: 'top-left',
      size: 70,
      opacity: 0.9,
    },
    audio: {
      fadeInSeconds: 0.2,
      fadeOutSeconds: 0.5,
    },
  },
  'minimal-btc': {
    key: 'minimal-btc',
    name: 'Minimal BTC',
    description: 'Minimalist black layout with Bitcoin-orange emphasis.',
    resolution: {
      width: 1080,
      height: 1920,
    },
    fps: 30,
    background: {
      type: 'solid',
      color: '000000',
    },
    font: {
      family: 'DejaVu Sans',
      size: 50,
      color: 'FFFFFF',
      bold: true,
      align: 'center',
    },
    subtitle: {
      fontSize: 44,
      color: 'FFFFFF',
      bgColor: 'rgba(255,255,255,0.10)',
      maxLines: 2,
      lineSpacing: 6,
      safeMarginTop: 200,
      safeMarginBottom: 280,
      safeMarginSides: 70,
    },
    hook: {
      fontSize: 60,
      color: 'F7931A',
      bgHighlight: 'rgba(247,147,26,0.10)',
      durationSeconds: 2,
    },
    transition: {
      type: 'cut',
      durationSeconds: 0.2,
    },
    cta: {
      fontSize: 46,
      color: 'F7931A',
      bgColor: 'rgba(255,255,255,0.08)',
      durationSeconds: 3,
    },
    logo: {
      position: 'bottom-right',
      size: 60,
      opacity: 0.6,
    },
    audio: {
      fadeInSeconds: 0.5,
      fadeOutSeconds: 1,
    },
  },
}

export function getTemplate(key: string): TemplateConfig {
  return TEMPLATES[key] ?? TEMPLATES['clean-news']
}

export function listTemplates(): Array<Pick<TemplateConfig, 'key' | 'name' | 'description'>> {
  return Object.values(TEMPLATES).map((template) => ({
    key: template.key,
    name: template.name,
    description: template.description,
  }))
}
