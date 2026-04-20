export interface ScriptPromptParams {
  sourceText: string
  outputLanguage: string
  targetLengthSeconds: number
  angle: 'neutral' | 'bullish' | 'bearish'
}

export function buildScriptPrompt(params: ScriptPromptParams): string {
  const { sourceText, outputLanguage, targetLengthSeconds, angle } = params

  const angleInstruction =
    angle === 'bullish'
      ? 'Frame the content positively. Emphasize gains, breakthroughs, and bullish signals. Use energetic, optimistic tone.'
      : angle === 'bearish'
        ? 'Frame the content critically. Highlight risks, downsides, and bearish signals. Use cautious, warning tone.'
        : 'Present the content objectively. Balance facts without bias. Use professional news tone.'

  const targetWords = Math.floor(targetLengthSeconds * 2.5)

  return `You are a professional crypto video scriptwriter. Create a short-form video script from the provided source material.

Instructions:
- Language: ${outputLanguage}
- Target length: ${targetLengthSeconds} seconds (~${targetWords} words)
- Tone angle: ${angle}
- ${angleInstruction}
- Write a HOOK first (2 seconds), 2-4 body SCENES, and a CTA (last 2 seconds)
- Each scene should be 3-6 seconds of spoken text
- Output MUST be valid JSON matching the schema below

Output Schema:
{
  "hook": "Attention-grabbing opening line (5-8 words)",
  "scenes": [
    {
      "text": "Scene narration text",
      "duration": 5,
      "visualHint": "Description of what to show visually"
    }
  ],
  "cta": "Call to action (follow, subscribe, etc.)",
  "totalDuration": 45
}

Source Material:
${sourceText.slice(0, 3000)}

Respond ONLY with the JSON object. No markdown, no explanation.`
}

export function buildHookOnlyPrompt(sourceText: string, outputLanguage: string): string {
  return `Write a single attention-grabbing HOOK for a crypto short-form video.

- Language: ${outputLanguage}
- Max 10 words
- Must create curiosity or urgency
- No hashtags, no emojis

Source:
${sourceText.slice(0, 1000)}

Respond with ONLY the hook text.`
}
