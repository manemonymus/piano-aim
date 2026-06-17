// IP-based rate limiting backed by the check_rate_limit() Postgres function.
//
// Returns true if the request is allowed, false if the caller is over the
// limit. Fails OPEN (allows the request) if the DB check errors, so a
// transient database issue can't take the whole game offline.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for') ?? ''
  return fwd.split(',')[0].trim() || 'unknown'
}

export async function allowRequest(
  req: Request,
  opts: { max: number; windowSeconds: number },
): Promise<boolean> {
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data, error } = await admin.rpc('check_rate_limit', {
    p_ip: clientIp(req),
    p_max: opts.max,
    p_window_seconds: opts.windowSeconds,
  })

  if (error) {
    console.error('rate limit check failed (failing open)', error)
    return true
  }
  return data !== false
}
