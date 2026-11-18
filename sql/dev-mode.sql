-- DEV MODE migration. Safe to run more than once. Paste into Supabase SQL Editor and Run.

-- 1) Admins. RLS is on and there are NO policies, so the website can never read or edit this table.
create table if not exists admins (user_id uuid primary key references auth.users on delete cascade);
alter table admins enable row level security;

-- 2) Mark the 48 existing animals as "mock" (kept as filler) and spread their drop dates.
--    Runs only the first time, so real drops you create later are never marked as mock.
do $$
begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'drops' and column_name = 'is_mock') then
    alter table public.drops add column is_mock boolean not null default false;
    update public.drops
       set is_mock = true,
           created_at = now() - (1 + floor(random() * 400))::int * interval '1 day';
  end if;
end $$;

-- 3) Server-side admin check
create or replace function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

-- 4) Create a drop + its secret token (admin only). The token is made on the server and never lives in code.
create or replace function create_drop(p_series text, p_lng float8, p_lat float8) returns json
language plpgsql security definer set search_path = public as $$
declare ed int; did text; tok text;
begin
  if not is_admin() then raise exception 'not admin'; end if;
  if p_series !~ '^[a-z]{2,20}$' then raise exception 'bad series'; end if;
  if p_lng not between -180 and 180 or p_lat not between -85 and 85 then raise exception 'bad coordinates'; end if;
  perform pg_advisory_xact_lock(hashtext(p_series));
  select coalesce(max(edition), 0) + 1 into ed from drops where series = p_series;
  did := p_series || '-' || ed;
  tok := substr(replace(gen_random_uuid()::text, '-', ''), 1, 20);
  insert into drops (id, series, edition, lng, lat) values (did, p_series, ed, p_lng, p_lat);
  insert into drop_tokens (drop_id, token) values (did, tok);
  return json_build_object('id', did, 'series', p_series, 'edition', ed, 'token', tok);
end $$;

-- 5) Read a token again to reprint a damaged sticker (admin only)
create or replace function get_drop_token(p_drop_id text) returns text
language plpgsql security definer set search_path = public as $$
declare t text;
begin
  if not is_admin() then raise exception 'not admin'; end if;
  select token into t from drop_tokens where drop_id = p_drop_id;
  return t;
end $$;

-- 6) Delete a drop together with its token and any claim on it (admin only)
create or replace function delete_drop(p_drop_id text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not is_admin() then raise exception 'not admin'; end if;
  delete from claims where drop_id = p_drop_id;
  delete from drop_tokens where drop_id = p_drop_id;
  delete from drops where id = p_drop_id;
end $$;

-- 7) Only signed-in users may call these (non-admins still get "not admin")
revoke execute on function is_admin(), create_drop(text, float8, float8), get_drop_token(text), delete_drop(text) from public, anon;
grant execute on function is_admin(), create_drop(text, float8, float8), get_drop_token(text), delete_drop(text) to authenticated;
