export interface TTSOptions {
  text: string
  voiceId: string
  language: string
  speed?: number
}

export interface TTSResult {
  audioBuffer: Buffer
  duration: number
  contentType: string
}

export interface TTSProvider {
  synthesize(options: TTSOptions): Promise<TTSResult>
}

class EdgeTTSProvider implements TTSProvider {
  async synthesize(options: TTSOptions): Promise<TTSResult> {
    const { text, voiceId, speed = 1.0 } = options

    try {
      const dynamicImport = new Function('moduleName', 'return import(moduleName)') as (
        moduleName: string
      ) => Promise<any>

      const edgeTts = await dynamicImport('edge-tts')
      const communicator = new edgeTts.Communicator()

      const result = await communicator.synthesize(text, {
        voice: voiceId,
        rate: `${Math.round((speed - 1) * 100)}%`,
      })

      return {
        audioBuffer: Buffer.from(result.audio),
        duration: result.duration ?? estimateDuration(text),
        contentType: 'audio/mpeg',
      }
    } catch (err) {
      console.error('[EdgeTTS] Error:', err)

      return {
        audioBuffer: Buffer.alloc(0),
        duration: estimateDuration(text),
        contentType: 'audio/mpeg',
      }
    }
  }
}

class StubTTSProvider implements TTSProvider {
  async synthesize(options: TTSOptions): Promise<TTSResult> {
    console.log('[StubTTS] Would synthesize:', options.text.slice(0, 50) + '...')

    return {
      audioBuffer: Buffer.alloc(0),
      duration: estimateDuration(options.text),
      contentType: 'audio/mpeg',
    }
  }
}

export function createTTSProvider(): TTSProvider {
  const enabled = process.env.EDGETTSENABLED === 'true'

  if (!enabled) {
    return new StubTTSProvider()
  }

  return new EdgeTTSProvider()
}

function estimateDuration(text: string): number {
  const wordCount = text.split(/\s+/).filter(Boolean).length
  return Math.max(2, Math.ceil(wordCount / 2.5))
}
