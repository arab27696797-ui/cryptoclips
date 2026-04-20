import { createTTSProvider } from './provider'
import { getVoiceById } from './voices'

export interface VoiceoverResult {
  audioUrl: string | null
  audioBuffer: Buffer | null
  duration: number
  voiceName: string
  status: 'generated' | 'placeholder' | 'error'
  error?: string
}

export interface GenerateVoiceoverParams {
  text: string
  voiceId: string
  projectId: string
}

export async function generateVoiceover(
  params: GenerateVoiceoverParams,
): Promise<VoiceoverResult> {
  const { text, voiceId } = params
  const voice = getVoiceById(voiceId)

  if (!voice) {
    return {
      audioUrl: null,
      audioBuffer: null,
      duration: 0,
      voiceName: voiceId,
      status: 'error',
      error: `Voice ${voiceId} not found`,
    }
  }

  const tts = createTTSProvider()

  try {
    const result = await tts.synthesize({
      text,
      voiceId,
      language: voice.language,
    })

    if (!result.audioBuffer || result.audioBuffer.length === 0) {
      return {
        audioUrl: null,
        audioBuffer: null,
        duration: result.duration,
        voiceName: voice.name,
        status: 'placeholder',
      }
    }

    const base64 = result.audioBuffer.toString('base64')
    const dataUrl = `data:${result.contentType};base64,${base64}`

    return {
      audioUrl: dataUrl,
      audioBuffer: result.audioBuffer,
      duration: result.duration,
      voiceName: voice.name,
      status: 'generated',
    }
  } catch (error) {
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length
    const duration = Math.max(2, Math.ceil(wordCount / 2.5))

    return {
      audioUrl: null,
      audioBuffer: null,
      duration,
      voiceName: voice.name,
      status: 'error',
      error: error instanceof Error ? error.message : 'TTS generation failed',
    }
  }
}

export function estimateScriptDuration(scriptText: string): number {
  const wordCount = scriptText.trim().split(/\s+/).filter(Boolean).length
  return Math.max(2, Math.ceil(wordCount / 2.5))
}
