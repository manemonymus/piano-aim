// Shared helpers for signing/verifying game-session tokens.
//
// A token binds a leaderboard submission to a real game session: the client
// must obtain one from `start-game` at the moment a game begins, then hand it
// back to `submit-score`. The token is HMAC-signed with a server-only secret,
// so the client cannot forge or tamper with it, and it carries the issue time
// so the server can reject instant/replayed submissions.

const encoder = new TextEncoder()

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

async function hmac(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message))
  return toHex(sig)
}

// Constant-time string comparison to avoid leaking the signature via timing.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

// token format: `${iat}.${nonce}.${signature}`
export async function issueToken(secret: string): Promise<string> {
  const iat = Date.now()
  const nonce = crypto.randomUUID()
  const payload = `${iat}.${nonce}`
  const sig = await hmac(secret, payload)
  return `${payload}.${sig}`
}

export interface VerifyResult {
  ok: boolean
  iat?: number
  reason?: string
}

export async function verifyToken(secret: string, token: unknown): Promise<VerifyResult> {
  if (typeof token !== 'string') return { ok: false, reason: 'missing token' }
  const parts = token.split('.')
  if (parts.length !== 3) return { ok: false, reason: 'malformed token' }

  const [iatStr, nonce, sig] = parts
  const expected = await hmac(secret, `${iatStr}.${nonce}`)
  if (!safeEqual(sig, expected)) return { ok: false, reason: 'bad signature' }

  const iat = Number(iatStr)
  if (!Number.isFinite(iat)) return { ok: false, reason: 'bad timestamp' }

  return { ok: true, iat }
}
