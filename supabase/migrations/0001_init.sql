-- ============================================================
-- 買い物リスト PWA 初期スキーマ
-- ============================================================

-- 家族グループ
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- メンバー（ユーザー ↔ household）
create table if not exists public.household_members (
  household_id uuid references public.households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  joined_at timestamptz default now(),
  primary key (household_id, user_id)
);

-- 商品マスター（status カラムで shopping_list を兼ねる）
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  name text not null,
  emoji text default '🛒',
  category text,
  status text not null default 'stock'
    check (status in ('stock', 'soon', 'out')),
  is_pinned boolean default false,
  sort_score numeric default 0,
  default_interval_days int,
  last_bought_at timestamptz,
  predicted_next_at timestamptz,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id),
  created_at timestamptz default now(),
  unique (household_id, name)
);
create index if not exists items_household_status_idx
  on public.items (household_id, status);
create index if not exists items_pinned_score_idx
  on public.items (household_id, is_pinned, sort_score desc);

-- 購入履歴（学習用、append-only）
create table if not exists public.purchase_history (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  household_id uuid not null references public.households(id) on delete cascade,
  bought_at timestamptz not null default now(),
  bought_by uuid references auth.users(id),
  interval_days int
);
create index if not exists purchase_history_item_idx
  on public.purchase_history (item_id, bought_at desc);

-- ============================================================
-- updated_at の自動更新トリガ
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  new.updated_by = coalesce(auth.uid(), new.updated_by);
  return new;
end $$;

drop trigger if exists trg_items_updated_at on public.items;
create trigger trg_items_updated_at
  before update on public.items
  for each row execute function public.set_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.items enable row level security;
alter table public.purchase_history enable row level security;

drop policy if exists "households_insert" on public.households;
drop policy if exists "households_select" on public.households;
drop policy if exists "households_update" on public.households;
drop policy if exists "members_all_own" on public.household_members;
drop policy if exists "items_all" on public.items;
drop policy if exists "history_all" on public.purchase_history;

create policy "households_insert"
  on public.households for insert
  with check (auth.uid() is not null);

create policy "households_select"
  on public.households for select
  using (
    id in (
      select household_id from public.household_members
      where user_id = auth.uid()
    )
  );

create policy "households_update"
  on public.households for update
  using (
    id in (
      select household_id from public.household_members
      where user_id = auth.uid()
    )
  );

create policy "members_all_own"
  on public.household_members for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "items_all"
  on public.items for all
  using (
    household_id in (
      select household_id from public.household_members
      where user_id = auth.uid()
    )
  )
  with check (
    household_id in (
      select household_id from public.household_members
      where user_id = auth.uid()
    )
  );

create policy "history_all"
  on public.purchase_history for all
  using (
    household_id in (
      select household_id from public.household_members
      where user_id = auth.uid()
    )
  )
  with check (
    household_id in (
      select household_id from public.household_members
      where user_id = auth.uid()
    )
  );

-- ============================================================
-- Realtime publication
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'items'
  ) then
    alter publication supabase_realtime add table public.items;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'purchase_history'
  ) then
    alter publication supabase_realtime add table public.purchase_history;
  end if;
end $$;
