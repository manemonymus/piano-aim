-- Rate limiting for the public Edge Functions.
--
-- A small table logs each request with its IP and time; check_rate_limit()
-- atomically counts recent hits for an IP and records the new one. Only the
-- service_role (used inside the Edge Functions) can touch this table.

create table if not exists public.rate_limit_hits (
  id         bigint generated always as identity primary key,
  ip         text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limit_hits_ip_time
  on public.rate_limit_hits (ip, created_at);

alter table public.rate_limit_hits enable row level security;
-- No policies => anon/authenticated have no access. service_role bypasses RLS.

create or replace function public.check_rate_limit(
  p_ip text,
  p_max int,
  p_window_seconds int
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent int;
begin
  -- Opportunistic cleanup of old rows (keeps the table from growing forever).
  delete from public.rate_limit_hits
    where created_at < now() - make_interval(secs => p_window_seconds * 10);

  select count(*) into recent
    from public.rate_limit_hits
    where ip = p_ip
      and created_at > now() - make_interval(secs => p_window_seconds);

  if recent >= p_max then
    return false;  -- over the limit
  end if;

  insert into public.rate_limit_hits (ip) values (p_ip);
  return true;     -- allowed
end;
$$;
