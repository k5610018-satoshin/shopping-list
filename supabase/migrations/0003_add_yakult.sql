-- ============================================================
-- 0003: ヤクルトを追加（よく買う食材としてピン留め）
-- ============================================================

insert into public.items
  (household_id, name, emoji, category, status, is_pinned, sort_score)
values
  ('00000000-0000-0000-0000-000000000001', 'ヤクルト', '🥛', '食材', 'stock', true, 94)
on conflict (household_id, name) do nothing;
