import { createLLMProvider } from './provider'
import { buildScriptPrompt } from './prompts'

export interface ScriptGenerationParams {
  sourceText: string
  outputLanguage: string
  targetLengthSeconds: number
  angle: 'neutral' | 'bullish' | 'bearish'
}

export interface GeneratedScript {
  hook: string
  scenes: Array<{
    text: string
    duration: number
    visualHint: string
  }>
  cta: string
  totalDuration: number
}

export async function generateScript(
  params: ScriptGenerationParams
): Promise<GeneratedScript> {
  const llm = createLLMProvider()

  const prompt = buildScriptPrompt({
    sourceText: params.sourceText,
    outputLanguage: params.outputLanguage,
    targetLengthSeconds: params.targetLengthSeconds,
    angle: params.angle,
  })

  const response = await llm.complete(
    [
      {
        role: 'system',
        content:
          'You are a professional crypto video scriptwriter. Output ONLY valid JSON. No markdown formatting, no explanation text.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    {
      jsonMode: true,
      temperature: 0.8,
      maxTokens: 2000,
    }
  )

  const parsed = parseScriptJSON(response.content)

  if (!parsed.hook || !parsed.scenes || !parsed.cta) {
    throw new Error('LLM returned invalid script structure')
  }

  const scenesDuration = parsed.scenes.reduce(
    (sum: number, scene: any) => sum + Number(scene.duration || 5),
    0
  )

  const totalDuration = Math.min(params.targetLengthSeconds, 2 + scenesDuration + 2)

  return {
    hook: String(parsed.hook).trim(),
    scenes: parsed.scenes.map((scene: any) => ({
      text: String(scene.text ?? '').trim(),
      duration: Math.min(8, Math.max(3, Number(scene.duration || 5))),
      visualHint: String(scene.visualHint ?? '').trim(),
    })),
    cta: String(parsed.cta).trim(),
    totalDuration,
  }
}

function parseScriptJSON(content: string): any {
  try {
    return JSON.parse(content.trim())
  } catch {}

  const codeBlockMatch = content.match(/```json\s*([\s\S]*?)\s*```|```([\s\S]*?)```/)
  if (codeBlockMatch) {
    const candidate = codeBlockMatch[1] || codeBlockMatch[2]
    try {
      return JSON.parse(candidate.trim())
    } catch {}
  }

  const firstBrace = content.indexOf('{')
  const lastBrace = content.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = content.slice(firstBrace, lastBrace + 1)
    try {
      return JSON.parse(candidate)
    } catch {}
  }

  return {
    hook: '',
    scenes: [],
    cta: '',
    totalDuration: 0,
  }
}
