import { writeFile } from 'fs/promises'
import { createTTSProvider } from './provider'

export async function generateSpeech(
  text: string,
  voiceId: string,
  outputPath: string
): Promise<void> {
  const provider = createTTSProvider()

  const result = await provider.synthesize({
    text,
    voiceId,
    language: 'en',
  })

  if (result.audioBuffer.length === 0) {
    throw new Error('TTS generation failed: empty audio buffer')
  }

  await writeFile(outputPath, result.audioBuffer)
}
