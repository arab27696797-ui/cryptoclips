const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
const PRIMARY_MODEL = process.env.OPENROUTER_PRIMARY_MODEL || 'openai/gpt-4.1';
const FALLBACK_MODEL = process.env.OPENROUTER_FALLBACK_MODEL || 'anthropic/claude-3.7-sonnet';

if (!OPENROUTER_API_KEY) {
  console.warn('OPENROUTER_API_KEY is not set. AI features will not work.');
}

export interface ScriptGenerationOptions {
  source: string;
  sourceType: 'url' | 'text' | 'tweet';
  duration: number;
  angle: 'neutral' | 'bullish' | 'bearish';
  style?: string;
}

export interface GeneratedScript {
  hook: string;
  body: string;
  cta: string;
  fullText: string;
  wordCount: number;
}

async function callOpenRouter(
  messages: Array<{ role: string; content: string }>,
  useFallback: boolean = false
): Promise<string> {
  const model = useFallback ? FALLBACK_MODEL : PRIMARY_MODEL;

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'CryptoClips',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 1200,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(
      `OpenRouter API error (${model}): ${response.status} ${response.statusText}${
        error.error ? ` - ${JSON.stringify(error.error)}` : ''
      }`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('No content returned from OpenRouter API');
  }

  return content;
}

export async function generateScript(
  options: ScriptGenerationOptions
): Promise<GeneratedScript> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key is not configured. Please set OPENROUTER_API_KEY environment variable.');
  }

  const { source, sourceType, duration, angle, style } = options;

  // Calculate approximate word count target (2.5 words per second is conversational pace)
  const targetWords = Math.floor(duration * 2.5);

  const systemPrompt = `You are an expert crypto content editor specializing in short-form video scripts for YouTube Shorts, TikTok, Instagram Reels, and Twitter.

Your job: Transform crypto news, articles, tweets, or raw information into punchy, high-retention video scripts.

CRITICAL RULES:
- Target: ${duration} seconds (~${targetWords} words total)
- Angle: ${angle === 'neutral' ? 'Balanced, factual, news-focused' : angle === 'bullish' ? 'Optimistic, opportunity-focused, growth angle' : 'Cautious, risk-aware, analytical angle'}
- Style: ${style || 'Professional yet conversational, energetic, confident'}
- NO generic AI fluff
- NO invented data, prices, or dates
- NO financial promises or guarantees
- Keep it punchy and social-media native

STRUCTURE:
1. Hook (1-2 sentences) - Grab attention immediately
2. Main Point (2-3 sentences) - Core news/claim
3. Why It Matters (1-2 sentences) - Market relevance
4. Context (1-2 sentences) - Brief background if needed
5. CTA (1 sentence) - Clear next step

OUTPUT FORMAT:
Hook: [attention-grabbing opening]
Body: [main point + why it matters + context]
CTA: [call to action]

Remember: You're a crypto content editor, not a generic AI assistant. Be direct, energetic, and market-aware.`;

  const userPrompt = `Source Type: ${sourceType}
Duration Target: ${duration} seconds
Angle: ${angle}

Source Content:
${source}

Create a ${duration}-second video script optimized for crypto social media. Be specific, punchy, and retention-focused.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    // Try primary model (GPT-4.1)
    const content = await callOpenRouter(messages, false);
    return parseScript(content);
  } catch (primaryError) {
    console.error('Primary model (GPT-4.1) failed, trying fallback (Claude 3.7 Sonnet):', primaryError);

    try {
      // Fallback to Claude 3.7 Sonnet
      const content = await callOpenRouter(messages, true);
      return parseScript(content);
    } catch (fallbackError) {
      console.error('Fallback model also failed:', fallbackError);
      throw new Error(`Script generation failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
    }
  }
}

function parseScript(content: string): GeneratedScript {
  const lines = content.split('\n').filter(line => line.trim());
  
  let hook = '';
  let body = '';
  let cta = '';

  let currentSection = '';

  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('hook:') || lowerLine.startsWith('hook')) {
      currentSection = 'hook';
      const cleaned = line.replace(/hook:?/gi, '').trim();
      if (cleaned) hook = cleaned;
      continue;
    }
    
    if (lowerLine.includes('body:') || lowerLine.startsWith('body') || lowerLine.includes('main point:')) {
      currentSection = 'body';
      const cleaned = line.replace(/(body|main point):?/gi, '').trim();
      if (cleaned) body = cleaned;
      continue;
    }
    
    if (lowerLine.includes('cta:') || lowerLine.includes('call to action:') || lowerLine.startsWith('cta')) {
      currentSection = 'cta';
      const cleaned = line.replace(/(cta|call to action):?/gi, '').trim();
      if (cleaned) cta = cleaned;
      continue;
    }

    // Append to current section
    const trimmedLine = line.trim();
    if (currentSection === 'hook') {
      hook = hook ? `${hook} ${trimmedLine}` : trimmedLine;
    } else if (currentSection === 'body') {
      body = body ? `${body} ${trimmedLine}` : trimmedLine;
    } else if (currentSection === 'cta') {
      cta = cta ? `${cta} ${trimmedLine}` : trimmedLine;
    } else if (!currentSection && trimmedLine) {
      // If no section detected yet, treat as body
      body = body ? `${body} ${trimmedLine}` : trimmedLine;
    }
  }

  // Fallback parsing if sections not clearly marked
  if (!hook && !cta && body) {
    const sentences = body.split(/[.!?]+/).filter(s => s.trim());
    if (sentences.length >= 3) {
      hook = sentences[0].trim() + '.';
      cta = sentences[sentences.length - 1].trim() + '.';
      body = sentences.slice(1, -1).join('. ').trim() + '.';
    } else if (sentences.length === 2) {
      hook = sentences[0].trim() + '.';
      body = sentences[1].trim() + '.';
      cta = 'Follow for more crypto updates.';
    } else if (sentences.length === 1) {
      body = content.trim();
      hook = 'Breaking crypto news.';
      cta = 'Stay tuned for updates.';
    }
  }

  // Ensure we have all required parts
  if (!hook) hook = 'Crypto market update.';
  if (!body) body = content.trim() || 'No content generated.';
  if (!cta) cta = 'Follow for more insights.';

  const fullText = `${hook} ${body} ${cta}`.trim();
  const wordCount = fullText.split(/\s+/).length;

  return {
    hook,
    body,
    cta,
    fullText,
    wordCount,
  };
}

export async function refineScript(
  currentScript: string,
  feedback: string
): Promise<GeneratedScript> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key is not configured');
  }

  const systemPrompt = `You are an expert crypto content editor. Refine the video script based on user feedback while maintaining the hook-body-cta structure.

Keep it punchy, social-media native, and high-retention. No generic AI fluff.`;

  const userPrompt = `Current Script:
${currentScript}

User Feedback:
${feedback}

Refine the script based on the feedback. Maintain the same structure: Hook, Body, CTA.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];

  try {
    const content = await callOpenRouter(messages, false);
    return parseScript(content);
  } catch (primaryError) {
    console.error('Primary model failed during refinement, trying fallback:', primaryError);
    
    try {
      const content = await callOpenRouter(messages, true);
      return parseScript(content);
    } catch (fallbackError) {
      console.error('Fallback model also failed during refinement:', fallbackError);
      throw new Error(`Script refinement failed: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
    }
  }
}
