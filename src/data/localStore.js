import { get, set } from 'idb-keyval';

const ITEMS_KEY = 'shopping-list:items';
const PENDING_KEY = 'shopping-list:pending';

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
