// start-game: issues a signed session token at the start of a game.
// The client sends this token back to `submit-score` when posting a score.

import { corsHeaders, json } from '../_shared/cors.ts'
import { issueToken } from '../_shared/token.ts'
import { allowRequest } from '../_shared/ratelimit.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  // Max 60 new games per IP per minute (one per second) — generous for a
  // real player restarting quickly, but still caps scripted abuse.
  if (!(await allowRequest(req, { max: 60, windowSeconds: 60 }))) {
    return json({ error: 'rate limited' }, 429)
  }

  const secret = Deno.env.get('SCORE_TOKEN_SECRET')
  if (!secret) return json({ error: 'server misconfigured' }, 500)

  const token = await issueToken(secret)
  return json({ token })
})
