-- Restores the 48 example ("contoh") animals as filler on the map. Safe to run more than once:
-- ids that already exist are left untouched. Paste into Supabase > SQL Editor > Run.
alter table public.drops add column if not exists is_mock boolean not null default false;
alter table public.drops add column if not exists created_at timestamptz not null default now();

insert into public.drops (id, series, edition, lng, lat, is_mock, created_at) values
  ('rabbit-4', 'rabbit', 4, 106.83748264189633, -6.178372161424457, true, now() - interval '12 days'),
  ('fox-6', 'fox', 6, 106.85268248834802, -6.220384114876471, true, now() - interval '13 days'),
  ('hedgehog-6', 'hedgehog', 6, 106.83727311808347, -6.189297517288117, true, now() - interval '17 days'),
  ('owl-2', 'owl', 2, 106.82455044578263, -6.254099376231616, true, now() - interval '36 days'),
  ('owl-3', 'owl', 3, 106.88256031912609, -6.22243927415791, true, now() - interval '55 days'),
  ('owl-6', 'owl', 6, 106.87463622830477, -6.221393758134139, true, now() - interval '72 days'),
  ('panda-2', 'panda', 2, 106.85504949241978, -6.228258481644703, true, now() - interval '72 days'),
  ('frog-6', 'frog', 6, 106.84162831821875, -6.264257957528338, true, now() - interval '82 days'),
  ('panda-4', 'panda', 4, 106.87072141738882, -6.167258293366837, true, now() - interval '83 days'),
  ('rabbit-6', 'rabbit', 6, 106.8583755915421, -6.1875447207638805, true, now() - interval '118 days'),
  ('frog-5', 'frog', 5, 106.84706152008418, -6.160609089906591, true, now() - interval '122 days'),
  ('penguin-6', 'penguin', 6, 106.84017655628203, -6.19053130982228, true, now() - interval '126 days'),
  ('hedgehog-4', 'hedgehog', 4, 106.84873366501853, -6.174719267402817, true, now() - interval '129 days'),
  ('hedgehog-2', 'hedgehog', 2, 106.81765007683173, -6.188091627913721, true, now() - interval '131 days'),
  ('panda-6', 'panda', 6, 106.82858848541257, -6.195249263492999, true, now() - interval '148 days'),
  ('turtle-1', 'turtle', 1, 106.82143749330558, -6.221600356274862, true, now() - interval '152 days'),
  ('panda-3', 'panda', 3, 106.83294449599354, -6.257366723642636, true, now() - interval '166 days'),
  ('turtle-2', 'turtle', 2, 106.83206157204324, -6.26449714165682, true, now() - interval '176 days'),
  ('frog-3', 'frog', 3, 106.79179261884185, -6.204646871724816, true, now() - interval '180 days'),
  ('fox-5', 'fox', 5, 106.82741635950293, -6.252015627411992, true, now() - interval '189 days'),
  ('panda-1', 'panda', 1, 106.85837947258153, -6.264422628928518, true, now() - interval '191 days'),
  ('owl-4', 'owl', 4, 106.85139037594891, -6.203951700779092, true, now() - interval '193 days'),
  ('rabbit-2', 'rabbit', 2, 106.86858817898546, -6.223763396634663, true, now() - interval '196 days'),
  ('fox-4', 'fox', 4, 106.8447097597419, -6.242032708596009, true, now() - interval '201 days'),
  ('penguin-5', 'penguin', 5, 106.90217011774845, -6.210929565059695, true, now() - interval '219 days'),
  ('turtle-5', 'turtle', 5, 106.85529697542474, -6.234417248703711, true, now() - interval '219 days'),
  ('penguin-2', 'penguin', 2, 106.79258453397154, -6.230876977941855, true, now() - interval '232 days'),
  ('hedgehog-3', 'hedgehog', 3, 106.7987258763399, -6.207404319164101, true, now() - interval '236 days'),
  ('frog-4', 'frog', 4, 106.858827367442, -6.205629732690534, true, now() - interval '239 days'),
  ('turtle-4', 'turtle', 4, 106.87733002846714, -6.233570453269374, true, now() - interval '248 days'),
  ('fox-2', 'fox', 2, 106.86541210360036, -6.170028700011572, true, now() - interval '250 days'),
  ('owl-1', 'owl', 1, 106.83867332719417, -6.177070028409863, true, now() - interval '264 days'),
  ('fox-1', 'fox', 1, 106.8132641388007, -6.232637745130175, true, now() - interval '268 days'),
  ('hedgehog-1', 'hedgehog', 1, 106.81440501065777, -6.184494615371965, true, now() - interval '275 days'),
  ('hedgehog-5', 'hedgehog', 5, 106.83190559268586, -6.2334510002498975, true, now() - interval '278 days'),
  ('penguin-4', 'penguin', 4, 106.83432313038625, -6.1701738681340705, true, now() - interval '279 days'),
  ('rabbit-3', 'rabbit', 3, 106.8508654841251, -6.1968341607580895, true, now() - interval '284 days'),
  ('owl-5', 'owl', 5, 106.80219363385372, -6.245600761971781, true, now() - interval '288 days'),
  ('penguin-3', 'penguin', 3, 106.82152633817829, -6.169215664969283, true, now() - interval '292 days'),
  ('frog-1', 'frog', 1, 106.8440141534359, -6.19397103835621, true, now() - interval '314 days'),
  ('panda-5', 'panda', 5, 106.80663708776797, -6.249722553547531, true, now() - interval '317 days'),
  ('turtle-3', 'turtle', 3, 106.87726231617755, -6.162746042488936, true, now() - interval '337 days'),
  ('frog-2', 'frog', 2, 106.83589740728797, -6.210672081257354, true, now() - interval '338 days'),
  ('turtle-6', 'turtle', 6, 106.88748594201239, -6.21289457172673, true, now() - interval '338 days'),
  ('rabbit-1', 'rabbit', 1, 106.89703171068108, -6.205717818980451, true, now() - interval '351 days'),
  ('fox-3', 'fox', 3, 106.87296144860659, -6.239649514234604, true, now() - interval '353 days'),
  ('rabbit-5', 'rabbit', 5, 106.85647570665826, -6.149991906647321, true, now() - interval '396 days'),
  ('penguin-1', 'penguin', 1, 106.7916476305732, -6.215724749994385, true, now() - interval '399 days')
on conflict (id) do nothing;

-- Make sure the website can READ the drops list (it holds public info only; secret tokens live in drop_tokens).
do $$ begin
  if (select relrowsecurity from pg_class where oid = 'public.drops'::regclass)
     and not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'drops' and cmd in ('SELECT', 'ALL')) then
    create policy "drops are public" on public.drops for select using (true);
  end if;
end $$;
grant select on public.drops to anon, authenticated;
