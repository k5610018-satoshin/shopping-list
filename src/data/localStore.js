import { get, set, del } from 'idb-keyval';

// バージョン付きキー: 仕様変更時に v3, v4... と上げれば古いキャッシュを自動的に無視
const ITEMS_KEY = 'shopping-list:items:v2';
const PENDING_KEY = 'shopping-list:pending:v2';
const OLD_KEYS = [
  'shopping-list:items',
  'shopping-list:pending',
];

// 起動時に旧バージョンキャッシュを削除（古い砂糖・コーヒー等を確実に駆逐）
(async () => {
  for (const k of OLD_KEYS) {
    try { await del(k); } catch {}
  }
})();

export async function loadItems() {
  return (await get(ITEMS_KEY)) || [];
}

export async function saveItems(items) {
  await set(ITEMS_KEY, items);
}

export async function loadPending() {
  return (await get(PENDING_KEY)) || [];
}

export async function savePending(pending) {
  await set(PENDING_KEY, pending);
}

export async function pushPending(op) {
  const pending = await loadPending();
  pending.push({ ...op, queued_at: Date.now() });
  await savePending(pending);
}
