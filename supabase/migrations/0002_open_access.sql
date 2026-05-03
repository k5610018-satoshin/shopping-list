-- ============================================================
-- 0002: 認証を廃止して URL を知っている人なら誰でも編集可能に
-- 状態モデルを2段階化（stock / out）
-- 既存データを破棄して指定14品目をシード
-- ============================================================

-- 既存データを破棄（household_members は drop して履歴/items も cascade）
drop table if exists public.household_members cascade;

truncate table public.purchase_history cascade;
truncate table public.items cascade;
truncate table public.households cascade;

-- 状態 check を 2値に変更
alter table public.items drop constraint if exists items_status_check;
alter table public.items add constraint items_status_check
  check (status in ('stock', 'out'));

-- updated_by の auth.users 参照を nullable のまま（認証なしでも書ける）
-- updated_by は使わないが、互換のため列は残す
alter table public.items alter column updated_by drop not null;
alter table public.purchase_history alter column bought_by drop not null;

-- ============================================================
-- RLS: anon に全許可（URL を知っている人=誰でも CRUD 可）
-- ============================================================
drop policy if exists "households_insert" on public.households;
drop policy if exists "households_select" on public.households;
drop policy if exists "households_update" on public.households;
drop policy if exists "items_all" on public.items;
drop policy if exists "history_all" on public.purchase_history;

create policy "open_households_all" on public.households
  for all using (true) with check (true);

create policy "open_items_all" on public.items
  for all using (true) with check (true);

create policy "open_history_all" on public.purchase_history
  for all using (true) with check (true);

-- updated_at トリガから auth.uid() を外す（anon でも動くように）
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ============================================================
-- 固定 household 作成
-- ============================================================
insert into public.households (id, name)
values ('00000000-0000-0000-0000-000000000001', '佐藤家')
on conflict (id) do nothing;

-- ============================================================
-- 14品目シード（登録順=タイル並び順）
-- ============================================================
insert into public.items
  (household_id, name, emoji, category, status, is_pinned, sort_score, created_at)
values
  ('00000000-0000-0000-0000-000000000001', '牛乳',         '🥛',  '食材',   'stock', true, 100, now() + interval '1 ms'),
  ('00000000-0000-0000-0000-000000000001', 'ヨーグルト',    '🥣',  '食材',   'stock', true,  99, now() + interval '2 ms'),
  ('00000000-0000-0000-0000-000000000001', 'グラノーラ',    '🌾',  '食材',   'stock', true,  98, now() + interval '3 ms'),
  ('00000000-0000-0000-0000-000000000001', '卵',           '🥚',  '食材',   'stock', true,  97, now() + interval '4 ms'),
  ('00000000-0000-0000-0000-000000000001', 'パン',         '🍞',  '食材',   'stock', true,  96, now() + interval '5 ms'),
  ('00000000-0000-0000-0000-000000000001', 'キウイ',        '🥝',  '食材',   'stock', true,  95, now() + interval '6 ms'),
  ('00000000-0000-0000-0000-000000000001', '醤油',         '🥢',  '調味料', 'stock', false, 90, now() + interval '7 ms'),
  ('00000000-0000-0000-0000-000000000001', '油',           '🫗',  '調味料', 'stock', false, 89, now() + interval '8 ms'),
  ('00000000-0000-0000-0000-000000000001', 'オイスターソース','🦪', '調味料', 'stock', false, 88, now() + interval '9 ms'),
  ('00000000-0000-0000-0000-000000000001', '酒',           '🍶',  '調味料', 'stock', false, 87, now() + interval '10 ms'),
  ('00000000-0000-0000-0000-000000000001', 'みりん',        '🍯',  '調味料', 'stock', false, 86, now() + interval '11 ms'),
  ('00000000-0000-0000-0000-000000000001', '洗濯洗剤',     '🧴',  '日用品', 'stock', false, 80, now() + interval '12 ms'),
  ('00000000-0000-0000-0000-000000000001', '柔軟剤',       '🧺',  '日用品', 'stock', false, 79, now() + interval '13 ms'),
  ('00000000-0000-0000-0000-000000000001', 'ゴミ袋',       '🗑️',  '日用品', 'stock', false, 78, now() + interval '14 ms');
