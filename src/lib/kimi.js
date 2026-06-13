import {
  extractFixable,
  extractScore,
  extractVerdict,
  stripScoreLine
} from './parse.js'

export const KIMI_MODEL = import.meta.env.VITE_KIMI_MODEL || 'kimi-k2.6'

const KIMI_BASE_URL = resolveKimiBaseUrl()
const KIMI_API_KEY = import.meta.env.VITE_KIMI_API_KEY
const USE_CLIENT_KIMI_KEY = KIMI_BASE_URL === '/kimi-api' || KIMI_BASE_URL.startsWith('http')

export const ROAST_ERROR_MESSAGE =
  'bro i crashed out. check your connection and try again 💀'

const SYSTEM_PROMPT = `You are PivotOrPerish — a brutally honest, unfiltered startup idea evaluator with deep knowledge of venture capital, product-market fit, unit economics, competitive moats, and go-to-market strategy. You communicate entirely in Gen Z internet slang and you do not sugarcoat anything. You can curse naturally (shit, damn, wtf, bullshit, ass, etc.) but do not overdo it — the humor comes from the analysis, not just the swearing.

You evaluate every idea with the same rigor a top-tier VC partner would use, but you deliver it like someone who has been extremely online since birth.

RESPONSE FORMAT — you must follow this exactly, every single time:

LINE 1: One-sentence gut reaction. Savage. Funny. Sets the tone.

LINE 2: empty line

SECTION "THE AUTOPSY:" (use this exact header)
3 to 5 bullet points. Each bullet is a real problem with the idea — market size, competition, defensibility, business model, timing, execution risk. Use Gen Z language but make the point real and substantive. Each bullet is 1-2 sentences.

LINE: empty line

SECTION "THE VERDICT:" (use this exact header)
One of three paths — pick exactly one based on your analysis:

- If the idea is fixable: Write "pivot potential fr 🔄" then give 2-3 specific, concrete pivots. Not vague advice — actual different directions the founder could take.
- If the idea is too cooked to save: Write "cooked. no saving this bro 💀" then explain in 2-3 sentences exactly why no pivot fixes the core problem.
- If the idea is actually good: Write "ngl this actually slaps 🔥" then explain what's genuinely strong about it in 2-3 sentences. Do not lie to make someone feel good — only use this if the idea is genuinely differentiated and viable.

LINE: empty line

LAST LINE — must be exactly this format, nothing else on this line:
SCORE: [integer 1-10]/10 — [one-line verdict in Gen Z slang, max 10 words]

RULES:
- Never break the format above
- Never output markdown headers with # symbols
- Never use em dashes (—) except in the final SCORE line
- The SCORE line must always be the last line
- Score rubric: 1-2 = criminally bad, 3-4 = cooked but maybe 1 pivot saves it, 5-6 = mid but workable, 7-8 = lowkey solid, 9-10 = actually built different (rare, use sparingly)
- Keep total response under 1000 characters`

export async function callRoastAPI(ideaText, { onText } = {}) {
  if (USE_CLIENT_KIMI_KEY && !KIMI_API_KEY) {
    console.error('Missing VITE_KIMI_API_KEY.')
    throw new Error('Missing VITE_KIMI_API_KEY')
  }

  try {
    const response = await fetch(`${KIMI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        ...getKimiAuthHeader(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: KIMI_MODEL,
        max_tokens: 1000,
        stream: true,
        thinking: {
          type: 'disabled'
        },
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: `Startup idea to roast: "${ideaText}"`
          }
        ]
      })
    })

    if (!response.ok) {
      console.error('Kimi API returned a non-200 response.', response.status, await safeText(response))
      throw new Error(`Kimi API failed with status ${response.status}`)
    }

    const roastText = await readKimiStream(response, onText)
    const score = extractScore(roastText)
    const verdict = extractVerdict(roastText)
    const fixable = extractFixable(roastText)
    const roastBody = stripScoreLine(roastText)

    return {
      rawText: roastText,
      roastBody,
      score,
      verdict,
      fixable
    }
  } catch (error) {
    console.error('Kimi roast request failed.', error)
    throw error
  }
}

function resolveKimiBaseUrl() {
  const configuredBaseUrl = import.meta.env.VITE_KIMI_BASE_URL

  if (import.meta.env.PROD && (!configuredBaseUrl || configuredBaseUrl === '/kimi-api')) {
    return '/api/kimi'
  }

  return (configuredBaseUrl || '/kimi-api').replace(/\/$/, '')
}

function getKimiAuthHeader() {
  if (!USE_CLIENT_KIMI_KEY) return {}
  return { Authorization: `Bearer ${KIMI_API_KEY}` }
}

async function readKimiStream(response, onText) {
  if (!response.body) {
    console.error('Kimi streaming response did not include a readable body.')
    throw new Error('No streaming body in Kimi response')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let fullText = ''

  while (true) {
    const { done, value } = await reader.read()

    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const events = buffer.split(/\r?\n\r?\n/)
    buffer = events.pop() || ''

    for (const event of events) {
      fullText += processKimiStreamEvent(event, onText)
    }
  }

  buffer += decoder.decode()

  if (buffer.trim()) {
    fullText += processKimiStreamEvent(buffer, onText)
  }

  if (!fullText.trim()) {
    console.error('Kimi streaming response ended without usable text.')
    throw new Error('No text content in Kimi stream')
  }

  return fullText
}

function processKimiStreamEvent(event, onText) {
  let eventText = ''
  const dataLines = event
    .split(/\r?\n/)
    .filter((line) => line.startsWith('data:'))
    .map((line) => line.slice(5).trim())

  for (const dataLine of dataLines) {
    if (!dataLine || dataLine === '[DONE]') continue

    try {
      const parsed = JSON.parse(dataLine)
      const choices = Array.isArray(parsed?.choices) ? parsed.choices : []

      for (const choice of choices) {
        const content = extractDeltaContent(choice?.delta)

        if (content) {
          eventText += content
          onText?.(content)
        }
      }
    } catch (error) {
      console.warn('Failed to parse Kimi stream event.', error, dataLine)
    }
  }

  return eventText
}

function extractDeltaContent(delta) {
  const content = delta?.content

  if (typeof content === 'string') return content

  if (Array.isArray(content)) {
    return content
      .filter((block) => block?.type === 'text' && typeof block?.text === 'string')
      .map((block) => block.text)
      .join('')
  }

  return ''
}

async function safeText(response) {
  try {
    return await response.text()
  } catch (error) {
    console.error('Failed to read Kimi error response body.', error)
    return ''
  }
}
