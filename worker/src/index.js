const VOICE_SYSTEM_PROMPT =
  '你是语音助手。用中文简短回答，1-3 句话，不要 Markdown、不要列表、不要代码块。'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function withVoiceSystemPrompt(messages) {
  const hasSystem = messages.some((item) => item.role === 'system')
  if (hasSystem) return messages
  return [{ role: 'system', content: VOICE_SYSTEM_PROMPT }, ...messages]
}

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return 'messages must be a non-empty array'
  }

  const valid = messages.every(
    (item) =>
      item &&
      typeof item === 'object' &&
      (item.role === 'user' || item.role === 'assistant' || item.role === 'system') &&
      typeof item.content === 'string' &&
      item.content.trim().length > 0,
  )

  return valid ? null : 'each message requires role and non-empty content'
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders })
    }

    if (url.pathname === '/health' && request.method === 'GET') {
      return json({ status: 'ok' })
    }

    if (url.pathname === '/api/chat' && request.method === 'POST') {
      const apiKey = env.OPENAI_API_KEY
      if (!apiKey) {
        return json({ error: 'Proxy error', detail: 'OPENAI_API_KEY not configured' }, 500)
      }

      let body
      try {
        body = await request.json()
      } catch {
        return json({ error: 'Invalid request', detail: 'invalid JSON body' }, 422)
      }

      const validationError = validateMessages(body?.messages)
      if (validationError) {
        return json({ error: 'Invalid request', detail: validationError }, 422)
      }

      const model = env.OPENAI_MODEL || 'gpt-4o-mini'
      const payloadMessages = withVoiceSystemPrompt(body.messages)

      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({ model, messages: payloadMessages }),
          signal: AbortSignal.timeout(30000),
        })

        const data = await response.json()

        if (!response.ok) {
          const detail = data?.error?.message || 'OpenAI request failed'
          return json({ error: 'OpenAI error', detail }, response.status)
        }

        const content = data?.choices?.[0]?.message?.content
        if (!content) {
          return json({ error: 'OpenAI error', detail: 'empty response' }, 502)
        }

        return json({ content })
      } catch {
        return json({ error: 'Proxy error', detail: 'internal server error' }, 500)
      }
    }

    return json({ error: 'Not found' }, 404)
  },
}
