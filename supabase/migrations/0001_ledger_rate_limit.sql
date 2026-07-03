-- Ledger Lens rate limiting: one row per (bucket, window-start), count incremented per hit.
create table if not exists public.rl_hits (
  bucket      text        not null,
  window_start timestamptz not null,
  hits        integer     not null default 0,
  primary key (bucket, window_start)
);

-- Never expose this table to the client; only the service role (Edge Function) touches it.
alter table public.rl_hits enable row level security;

-- Returns true if the request is allowed (and records it), false if over the limit.
create or replace function public.consume_rate_limit(p_bucket text, p_max int, p_window int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  w   timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window) * p_window);
  cur int;
begin
  insert into public.rl_hits (bucket, window_start, hits)
  values (p_bucket, w, 1)
  on conflict (bucket, window_start)
  do update set hits = public.rl_hits.hits + 1
  returning hits into cur;

  -- Opportunistic cleanup of old windows.
  delete from public.rl_hits where window_start < now() - interval '10 minutes';

  return cur <= p_max;
end;
$$;

revoke all on function public.consume_rate_limit(text, int, int) from public, anon, authenticated;
