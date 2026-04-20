import { mkdir, rm, writeFile } from 'fs/promises'
import path from 'path'
import os from 'os'
import { spawn } from 'child_process'

import { createStorage } from '../storage'
import { buildFFmpegCommand, computeDuration } from './composition'
import { getTemplate } from './templates'

export interface RenderSceneInput {
  text: string
  duration: number
  visualHint?: string
}

export interface RenderVideoParams {
  templateKey: string
  hook: string
  scenes: RenderSceneInput[]
  cta: string
  voiceoverAudio?: Buffer | null
  logoBuffer?: Buffer | null
  projectId: string
  renderId: string
  brandColors?: {
    primary?: string
    secondary?: string
  }
}

export interface RenderVideoResult {
  success: boolean
  outputUrl?: string
  duration?: number
  fileSize?: number
  error?: string
}

export async function renderVideo(params: RenderVideoParams): Promise<RenderVideoResult> {
  const storage = createStorage()
  const template = getTemplate(params.templateKey)

  const tempDir = path.join(os.tmpdir(), 'cryptoclips', params.renderId)
  const audioPath = path.join(tempDir, 'voiceover.mp3')
  const outputPath = path.join(tempDir, 'output.mp4')
  const logoPath = path.join(tempDir, 'logo.png')

  try {
    await mkdir(tempDir, { recursive: true })

    if (params.voiceoverAudio && params.voiceoverAudio.length > 0) {
      await writeFile(audioPath, params.voiceoverAudio)
    } else {
      const silentAudio = await generateSilentAudio(
        audioPath,
        computeDuration(params.scenes, template),
      )

      if (!silentAudio.success) {
        return {
          success: false,
          error: silentAudio.error,
        }
      }
    }

    let resolvedLogoPath: string | undefined

    if (params.logoBuffer && params.logoBuffer.length > 0) {
      await writeFile(logoPath, params.logoBuffer)
      resolvedLogoPath = logoPath
    }

    const ffmpegArgs = buildFFmpegCommand({
      template,
      hook: params.hook,
      scenes: params.scenes,
      cta: params.cta,
      audioPath,
      outputPath,
      logoPath: resolvedLogoPath,
      brandColors: params.brandColors,
    })

    const ffmpegResult = await runCommand('ffmpeg', ffmpegArgs)

    if (!ffmpegResult.success) {
      return {
        success: false,
        error: ffmpegResult.error,
      }
    }

    const outputBuffer = await import('fs/promises').then((fs) => fs.readFile(outputPath))
    const storageKey = path.posix.join('renders', params.projectId, `${params.renderId}.mp4`)
    const outputUrl = await storage.upload(storageKey, outputBuffer, 'video/mp4')

    return {
      success: true,
      outputUrl,
      duration: computeDuration(params.scenes, template),
      fileSize: outputBuffer.byteLength,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Render failed',
    }
  } finally {
    await rm(tempDir, { recursive: true, force: true })
  }
}

async function generateSilentAudio(filePath: string, duration: number) {
  return runCommand('ffmpeg', [
    '-f',
    'lavfi',
    '-i',
    'anullsrc=r=44100:cl=stereo',
    '-t',
    String(Math.max(2, duration)),
    '-q:a',
    '9',
    '-acodec',
    'libmp3lame',
    '-y',
    filePath,
  ])
}

async function runCommand(command: string, args: string[]): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    })

    let stderr = ''

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
      })
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true })
        return
      }

      resolve({
        success: false,
        error: stderr || `${command} exited with code ${code}`,
      })
    })
  })
}
