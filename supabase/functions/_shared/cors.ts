// CORS headers shared by the public-facing Edge Functions.
//
// ALLOWED_ORIGIN can be set to your real site (e.g. https://pianoaim.com) to
// restrict who may call these endpoints from a browser. Defaults to '*'.
const origin = Deno.env.get('ALLOWED_ORIGIN') ?? '*'

export const corsHeaders = {
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
