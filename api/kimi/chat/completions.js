export const config = {
  maxDuration: 60
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey =
    process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY || process.env.VITE_KIMI_API_KEY

  if (!apiKey) {
    console.error('Missing KIMI_API_KEY for Vercel Kimi proxy.')
    res.status(500).json({ error: 'Missing KIMI_API_KEY' })
    return
  }

  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {})
    const upstream = await fetch('https://api.moonshot.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body
    })

    res.statusCode = upstream.status
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('X-Accel-Buffering', 'no')

    if (!upstream.ok || !upstream.body) {
      const errorText = await upstream.text()
      console.error('Kimi proxy upstream error.', upstream.status, errorText)
      res.end(errorText)
      return
    }

    const reader = upstream.body.getReader()

    while (true) {
      const { done, value } = await reader.read()

      if (done) break

      res.write(Buffer.from(value))
    }

    res.end()
  } catch (error) {
    console.error('Kimi proxy failed.', error)

    if (!res.headersSent) {
      res.status(500).json({ error: 'Kimi proxy failed' })
      return
    }

    res.end()
  }
}
