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
    const { text, voiceId, speed = 1 } = options

    try {
      const edgeTts = await import('edge-tts')
      const Communicator =
        (edgeTts as { Communicator?: new (...args: any[]) => any }).Communicator ||
        (edgeTts as { default?: { Communicator?: new (...args: any[]) => any } }).default
          ?.Communicator

      if (!Communicator) {
        throw new Error('edge-tts Communicator export not found')
      }

      const ratePercent = Math.round((speed - 1) * 100)
      const rate = `${ratePercent >= 0 ? '+' : ''}${ratePercent}%`

      const communicator = new Communicator(text, voiceId, {
        rate,
      })

      const chunks: Buffer[] = []

      for await (const chunk of communicator.stream()) {
        if (chunk?.type === 'audio' && chunk.data) {
          chunks.push(Buffer.isBuffer(chunk.data) ? chunk.data : Buffer.from(chunk.data))
        }
      }

      const audioBuffer = Buffer.concat(chunks)

      return {
        audioBuffer,
        duration: estimateDuration(text),
        contentType: 'audio/mpeg',
      }
    } catch (error) {
      console.error('[TTS] Edge TTS synthesis failed:', error)

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
    return {
      audioBuffer: Buffer.alloc(0),
      duration: estimateDuration(options.text),
      contentType: 'audio/mpeg',
    }
  }
}

export function createTTSProvider(): TTSProvider {
  const enabled = process.env.EDGETTSENABLED === 'true'

  if (enabled) {
    return new EdgeTTSProvider()
  }

  return new StubTTSProvider()
}

function estimateDuration(text: string): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length
  return Math.max(2, Math.ceil(wordCount / 2.5))
}
