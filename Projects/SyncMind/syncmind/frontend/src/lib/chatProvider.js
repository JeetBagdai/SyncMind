// ============================================================
// Chat provider - streaming from a local model via Ollama.
//
// Ollama streams NDJSON: one JSON object per line. Everything is
// normalised behind streamChat(), so the UI never needs to know
// how the reply arrived.
// ============================================================

const cfg = {
  // Ollama must allow the browser origin: run it with OLLAMA_ORIGINS=*
  url: `${import.meta.env.VITE_OLLAMA_URL || 'http://localhost:11434'}/api/chat`,
  model: import.meta.env.VITE_OLLAMA_MODEL || 'llama3.2',
}

export const providerName = () => 'ollama'
export const modelName = () => cfg.model
// Local models need no API token, so chat is always available.
export const chatEnabled = () => false

const SYSTEM_PROMPT =
  'You are SyncMind, a concise, helpful enterprise AI assistant. Use markdown when useful.'

// ---- Reasoning models (Qwen3, R1, ...) emit chain-of-thought in
// <think> blocks. Strip it as the stream arrives so only the answer
// is ever shown - including while a block is still open. ----
export function visibleText(raw) {
  if (!raw) return ''
  let out = raw.replace(/<think>[\s\S]*?<\/think>/gi, '')
  const close = out.lastIndexOf('</think>')
  if (close !== -1) out = out.slice(close + '</think>'.length) // opener-less block
  const open = out.lastIndexOf('<think>')
  if (open !== -1) out = out.slice(0, open)                    // still-open block
  return out.replace(/<\/?think>/gi, '').replace(/^\s+/, '')
}

function buildMessages(history) {
  return [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
    })),
  ]
}

// Pull one delta of text out of a decoded NDJSON line.
function parseLine(line) {
  try {
    const obj = JSON.parse(line)
    return obj.message?.content || obj.response || null
  } catch {
    return null
  }
}

/**
 * Stream a reply. Calls onToken(visibleSoFar, delta) as text arrives and
 * resolves with the final visible text.
 */
export async function streamChat(history, { onToken, signal } = {}) {
  const res = await fetch(cfg.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model,
      messages: buildMessages(history),
      stream: true,
    }),
    signal,
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`ollama ${res.status} ${res.statusText}${txt ? ` - ${txt.slice(0, 300)}` : ''}`)
  }

  // Some proxies ignore stream:true - fall back to a single JSON body.
  if (!res.body) {
    const data = await res.json()
    const full = visibleText(data.message?.content || data.response || '')
    onToken?.(full, full)
    return full
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let raw = ''
  let shown = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? '' // keep the trailing partial line

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      const delta = parseLine(trimmed)
      if (!delta) continue
      raw += delta
      const next = visibleText(raw)
      if (next !== shown) {
        const added = next.slice(shown.length)
        shown = next
        onToken?.(shown, added)
      }
    }
  }

  // If the model spent its whole reply inside an unclosed <think>, there is
  // no answer to show - say so instead of rendering an empty bubble.
  const final = shown || visibleText(raw)
  if (!final && raw.trim()) {
    return '_The model ran out of tokens while reasoning and never produced an answer. Try a shorter question._'
  }
  return final
}
