// submit-score: the ONLY path that writes to the leaderboard.
//
// It validates the name/score, verifies the game-session token issued by
// `start-game`, and then upserts using the service_role key (which bypasses
// RLS). The public anon key cannot write to the scores table directly.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, json } from '../_shared/cors.ts'
import { verifyToken } from '../_shared/token.ts'
import { allowRequest } from '../_shared/ratelimit.ts'

// Keep MAX_SCORE in sync with the CHECK constraint in the SQL migration.
const MAX_SCORE = 500
const MAX_NAME_LEN = 20
// The game runs for 30s, so a real submission can't arrive sooner than that
// (allow a little clock skew). Tokens older than 30 min are rejected.
const MIN_ELAPSED_MS = 25_000
const MAX_ELAPSED_MS = 30 * 60 * 1000

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405)

  // Max 30 submissions per IP per minute.
  if (!(await allowRequest(req, { max: 30, windowSeconds: 60 }))) {
    return json({ error: 'rate limited' }, 429)
  }

  let body: { name?: unknown; score?: unknown; token?: unknown }
  try {
    body = await req.json()
  } catch {
    return json({ error: 'invalid JSON' }, 400)
  }

  // --- Validate the name ---
  if (typeof body.name !== 'string') return json({ error: 'invalid name' }, 400)
  const name = body.name.trim()
  if (name.length < 1 || name.length > MAX_NAME_LEN) {
    return json({ error: `name must be 1-${MAX_NAME_LEN} characters` }, 400)
  }

  // --- Validate the score ---
  const score = body.score
  if (typeof score !== 'number' || !Number.isInteger(score) || score < 0 || score > MAX_SCORE) {
    return json({ error: `score must be an integer 0-${MAX_SCORE}` }, 400)
  }

  // --- Verify the game-session token ---
  const secret = Deno.env.get('SCORE_TOKEN_SECRET')
  if (!secret) return json({ error: 'server misconfigured' }, 500)

  const verdict = await verifyToken(secret, body.token)
  if (!verdict.ok) return json({ error: `invalid session: ${verdict.reason}` }, 403)

  const elapsed = Date.now() - (verdict.iat ?? 0)
  if (elapsed < MIN_ELAPSED_MS) return json({ error: 'submission too fast' }, 403)
  if (elapsed > MAX_ELAPSED_MS) return json({ error: 'session expired' }, 403)

  // --- Write with the service_role key (bypasses RLS) ---
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: existing, error: selErr } = await admin
    .from('scores')
    .select('score')
    .eq('name', name)
    .maybeSingle()

  if (selErr) return json({ error: 'database error' }, 500)

  if (existing) {
    if (score > existing.score) {
      const { error } = await admin.from('scores').update({ score }).eq('name', name)
      if (error) return json({ error: 'database error' }, 500)
    }
  } else {
    const { error } = await admin.from('scores').insert({ name, score })
    if (error) return json({ error: 'database error' }, 500)
  }

  return json({ ok: true })
})
