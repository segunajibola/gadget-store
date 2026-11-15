-- =============================================================================
-- 0008 — Simple rate limiting (no extra service needed)
--
-- hit_rate_limit('track:1.2.3.4', 10, 600) records a hit and returns TRUE if
-- the caller is still within 10 hits per 600 seconds, FALSE if over the limit.
-- Server-only (service role).
-- =============================================================================

create table public.rate_limit_hits (
  id          bigint generated always as identity primary key,
  key         text not null,
  created_at  timestamptz not null default now()
);
create index rate_limit_hits_key_time on public.rate_limit_hits (key, created_at desc);

alter table public.rate_limit_hits enable row level security;
revoke all on public.rate_limit_hits from anon, authenticated;

create or replace function public.hit_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
set search_path = ''
as $$
declare
  v_count int;
begin
  -- Housekeeping: forget this key's hits that are outside the window.
  delete from public.rate_limit_hits
   where key = p_key and created_at < now() - make_interval(secs => p_window_seconds);

  select count(*) into v_count from public.rate_limit_hits where key = p_key;
  if v_count >= p_limit then
    return false;
  end if;

  insert into public.rate_limit_hits (key) values (p_key);
  return true;
end;
$$;

revoke execute on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;
