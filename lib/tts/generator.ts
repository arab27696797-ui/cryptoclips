import { createTTSProvider } from './provider'
import { getVoiceById } from './voices'

export interface VoiceoverResult {
  audioUrl: string | null
  duration: number
  voiceName: string
  status: 'generated' | 'placeholder' | 'error'
  error?: string
}

export async function generateVoiceover(params: {
  text: string
  voiceId: string
  projectId: string
}): Promise<VoiceoverResult> {
  const { text, voiceId } = params
  const voice = getVoiceById(voiceId)

  if (!voice) {
    return {
      audioUrl: null,
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

    if (result.audioBuffer.length === 0) {
      return {
        audioUrl: null,
        duration: result.duration,
        voiceName: voice.name,
        status: 'placeholder',
      }
    }

    const base64 = result.audioBuffer.toString('base64')
    const dataUrl = `data:${result.contentType};base64,${base64}`

    return {
      audioUrl: dataUrl,
      duration: result.duration,
      voiceName: voice.name,
      status: 'generated',
    }
  } catch (err) {
    const wordCount = text.split(/\s+/).filter(Boolean).length
    const duration = Math.max(2, Math.ceil(wordCount / 2.5))

    return {
      audioUrl: null,
      duration,
      voiceName: voice.name,
      status: 'error',
      error: err instanceof Error ? err.message : 'TTS generation failed',
    }
  }
}

export function estimateScriptDuration(scriptText: string): number {
  const wordCount = scriptText.split(/\s+/).filter(Boolean).length
  return Math.max(2, Math.ceil(wordCount / 2.5))
}
