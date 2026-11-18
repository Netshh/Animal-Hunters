-- Read-only checks. Run each block in Supabase > SQL Editor and look at the result.
-- 1) How many drops exist, and are the example ones there?
select count(*) as total_drops, count(*) filter (where is_mock) as example_drops from public.drops;
-- 2) Your newest drops (a drop you created in Admin mode should be listed here)
select id, series, edition, is_mock, created_at from public.drops order by created_at desc limit 10;
-- 3) Who may read what (a table with RLS on and no SELECT policy looks empty to the website)
select tablename, policyname, cmd, roles from pg_policies where schemaname = 'public' order by tablename;
-- 4) Column names the website expects
select table_name, column_name from information_schema.columns
 where table_schema = 'public' and table_name in ('drops', 'claims', 'profiles', 'drop_tokens') order by table_name, ordinal_position;
