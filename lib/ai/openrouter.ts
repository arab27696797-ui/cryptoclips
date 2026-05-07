export interface GenerateScriptParams {
  content: string
  duration?: number
  angle?: string
  style?: string
}

export interface GenerateScriptResult {
  script: string
  hook: string
  cta: string
  scenes: Array<{ text: string; duration: number; visualHint?: string }>
  model: string
  tokensUsed: number
}

export interface AIProvider {
  generateScript(params: GenerateScriptParams): Promise<GenerateScriptResult>
  refineScript(originalScript: string, feedback: string): Promise<GenerateScriptResult>
}

const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const OPENROUTER_API_KEY = proces…KEY;

// CHEAP CHINESE MODELS FOR PROFITABILITY
const OPENROUTER_PRIMARY_MODEL = process.env.OPENROUTER_PRIMARY_MODEL || 'deepseek/deepseek-chat';
const OPENROUTER_FALLBACK_MODEL = process.env.OPENROUTER_FALLBACK_MODEL || 'qwen/qwen-2.5-72b-instruct';

export class OpenRouterProvider implements AIProvider {
  async generateScript(params: GenerateScriptParams): Promise<GenerateScriptResult> {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    const systemPrompt = this.buildSystemPrompt(params);
    const userPrompt = this.buildUserPrompt(params);

    // Try primary model first (DeepSeek)
    try {
      return await this.callModel(OPENROUTER_PRIMARY_MODEL, systemPrompt, userPrompt, params);
    } catch (primaryError) {
      console.error('Primary model (DeepSeek) failed, falling back to Qwen:', primaryError);
    
      // Fallback to Qwen
      try {
        return await this.callModel(OPENROUTER_FALLBACK_MODEL, systemPrompt, userPrompt, params);
      } catch (fallbackError) {
        console.error('Fallback model (Qwen) also failed:', fallbackError);
        throw new Error('Both AI models failed. Please try again later.');
      }
    }
  }

  private async callModel(
    model: string,
    systemPrompt: string,
    userPrompt: string,
    params: GenerateScriptParams
  ): Promise<GenerateScriptResult> {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoclips.com',
        'X-Title': 'CryptoClips',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error (${model}): ${response.status} ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    const scriptText = data.choices?.[0]?.message?.content;

    if (!scriptText) {
      throw new Error('No script generated from AI model');
    }

    // Parse script into structured format
    const lines = scriptText.trim().split('\n').filter((l: string) => l.trim());
    const hook = lines[0] || 'Crypto update';
    const cta = lines[lines.length - 1] || 'Follow for more crypto updates';
    const bodyLines = lines.slice(1, -1);

    const scenes = bodyLines.length > 0
      ? bodyLines.map((text: string, i: number) => ({
          text: text.replace(/^\d+\.\s*/, '').trim(),
          duration: Math.max(3, Math.floor((params.duration || 30) / bodyLines.length)),
          visualHint: 'crypto chart',
        }))
      : [{ text: scriptText.trim(), duration: params.duration || 30, visualHint: 'crypto chart' }];

    return {
      script: scriptText.trim(),
      hook,
      cta,
      scenes,
      model,
      tokensUsed: data.usage?.total_tokens || 0,
    };
  }

  private buildSystemPrompt(params: GenerateScriptParams): string {
    return `You are an expert crypto content creator specializing in short-form video scripts for social media (TikTok, YouTube Shorts, Instagram Reels).

Your task is to transform crypto news, tweets, or articles into punchy, engaging video scripts optimized for maximum retention and virality.

Script Requirements:
- Duration: ${params.duration || 30}-60 seconds when read aloud
- Tone: ${params.angle || 'neutral'} (bullish, bearish, or neutral)
- Style: Fast-paced, hook-driven, social media optimized
- Target audience: Crypto traders, investors, enthusiasts

Structure:
1. HOOK (first 3 seconds): Attention-grabbing opener
2. CONTEXT: Quick background (if needed)
3. MAIN POINT: Core message or news
4. INSIGHT: Analysis or implication
5. CTA: Call to action (like, follow, comment)

Writing Style:
- Short sentences (5-10 words max)
- Conversational tone
- Use numbers and specific data
- Avoid jargon unless necessary
- Include strategic pauses
- Build momentum toward key point

Output only the script text, no additional formatting or metadata.`;
  }

  private buildUserPrompt(params: GenerateScriptParams): string {
    return `Source content:
${params.content}

Generate a ${params.duration || 30}-60 second video script with a ${params.angle || 'neutral'} perspective on this crypto news/content.

Make it punchy, engaging, and optimized for social media virality.`;
  }

  async refineScript(originalScript: string, feedback: string): Promise<GenerateScriptResult> {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    const systemPrompt = `You are an expert crypto video script editor. Refine scripts based on user feedback while maintaining the core message and social media optimization.`;
  
    const userPrompt = `Original script:
${originalScript}

User feedback:
${feedback}

Please refine the script based on this feedback. Keep it punchy and social media optimized.`;

    // Try primary model first
    try {
      return await this.callModel(OPENROUTER_PRIMARY_MODEL, systemPrompt, userPrompt, { content: originalScript });
    } catch (primaryError) {
      console.error('Primary model failed during refinement, using fallback:', primaryError);
      return await this.callModel(OPENROUTER_FALLBACK_MODEL, systemPrompt, userPrompt, { content: originalScript });
    }
  }
}

export async function generateScript(params: GenerateScriptParams): Promise<GenerateScriptResult> {
  const provider = new OpenRouterProvider();
  return provider.generateScript(params);
}

export async function refineScript(originalScript: string, feedback: string): Promise<GenerateScriptResult> {
  const provider = new OpenRouterProvider();
  return provider.refineScript(originalScript, feedback);
}
