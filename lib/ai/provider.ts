export interface LLMMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface LLMOptions {
  model?: string
  temperature?: number
  maxTokens?: number
  jsonMode?: boolean
}

export interface LLMResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
  }
}

export interface LLMProvider {
  complete(messages: LLMMessage[], options?: LLMOptions): Promise<LLMResponse>
}

class OpenRouterProvider implements LLMProvider {
  private apiKey: string
  private baseUrl = 'https://openrouter.ai/api/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async complete(messages: LLMMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXTPUBLICAPPURL ?? 'http://localhost:3000',
        'X-Title': 'CryptoClips',
      },
      body: JSON.stringify({
        model: options.model ?? 'anthropic/claude-3.5-sonnet',
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2000,
        response_format: options.jsonMode ? { type: 'json_object' } : undefined,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenRouter error ${response.status} - ${error}`)
    }

    const data = await response.json()

    return {
      content: data.choices?.[0]?.message?.content ?? '',
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
      },
    }
  }
}

class StubLLMProvider implements LLMProvider {
  async complete(_messages: LLMMessage[], options: LLMOptions = {}): Promise<LLMResponse> {
    const demoScript = {
      hook: 'Bitcoin just broke 100K, what next?',
      scenes: [
        {
          text: 'Bitcoin surged past one hundred thousand dollars for the first time in history.',
          duration: 5,
          visualHint: 'BTC price chart moving sharply upward',
        },
        {
          text: 'Institutional investors are pouring billions into crypto ETFs.',
          duration: 5,
          visualHint: 'Money flowing into crypto funds',
        },
        {
          text: 'Analysts say this may only be the beginning of a broader bull cycle.',
          duration: 5,
          visualHint: 'Analyst talking with market graphics',
        },
      ],
      cta: 'Follow for daily crypto updates.',
      totalDuration: 45,
    }

    if (options.jsonMode) {
      return {
        content: JSON.stringify(demoScript),
      }
    }

    return {
      content: `Hook: ${demoScript.hook}\n1. ${demoScript.scenes[0].text}\n2. ${demoScript.scenes[1].text}\n3. ${demoScript.scenes[2].text}\nCTA: ${demoScript.cta}`,
    }
  }
}

export function createLLMProvider(): LLMProvider {
  const apiKey = process.env.OPENROUTERAPIKEY

  if (apiKey && apiKey.length > 0) {
    return new OpenRouterProvider(apiKey)
  }

  console.warn('[LLM] No OPENROUTERAPIKEY found, using stub provider')
  return new StubLLMProvider()
}
