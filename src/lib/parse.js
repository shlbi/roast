export function extractScore(text) {
  const match = text.match(/SCORE:\s*(\d+)\s*\/\s*10/i)

  if (!match) {
    console.warn('Score parse failed. Defaulting to 5.')
    return 5
  }

  const raw = parseInt(match[1], 10)
  return Math.min(10, Math.max(1, raw))
}

export function extractVerdict(text) {
  const match = text.match(/SCORE:\s*\d+\s*\/\s*10\s*[—\-–]\s*(.+)/i)

  if (!match) {
    console.warn('Verdict parse failed.')
    return 'no verdict extracted'
  }

  return match[1].trim()
}

export function extractFixable(text) {
  const normalized = text.toLowerCase()

  if (normalized.includes('pivot potential')) return 'fixable'
  if (normalized.includes('actually slaps')) return 'good'
  return 'cooked'
}

export function stripScoreLine(text) {
  return text
    .split('\n')
    .filter((line) => !/^SCORE:\s*\d+\s*\/\s*10/i.test(line.trim()))
    .join('\n')
    .trim()
}

export function truncateAtWord(str, maxChars) {
  if (str.length <= maxChars) return str

  const truncated = str.slice(0, maxChars)
  const lastSpace = truncated.lastIndexOf(' ')
  return `${lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated}...`
}

const BANNED_ADDRESS_TERM = new RegExp(`\\b${'bes'}${'tie'}\\b`, 'gi')

export function replaceBannedAddressWithBro(str) {
  if (typeof str !== 'string') return str

  return str.replace(BANNED_ADDRESS_TERM, (match) => {
    if (match === match.toUpperCase()) return 'BRO'
    if (match[0] === match[0].toUpperCase()) return 'Bro'
    return 'bro'
  })
}
