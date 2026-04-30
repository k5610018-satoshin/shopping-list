import { supabase } from './supabase.js';
import { loadPending, savePending, pushPending, saveItems } from './localStore.js';
import { state, setState, showToast } from '../state.js';

let realtimeChannel = null;

export async function fetchItems(householdId) {
  if (!supabase || !householdId) return [];
  const { data, error } = await supabase
    .from('items')
    .select('*')
    .eq('household_id', householdId)
    .order('is_pinned', { ascending: false })
    .order('sort_score', { ascending: false });
  if (error) {
    console.warn('fetchItems error', error);
    return state.items;
  }
  return data || [];
}

export async function applyLocalChange(itemId, patch) {
  const idx = state.items.findIndex((i) => i.id === itemId);
  if (idx === -1) return;
  const next = { ...state.items[idx], ...patch, updated_at: new Date().toISOString() };
  const items = [...state.items];
  items[idx] = next;
  setState({ items });
  await saveItems(items);
  await pushOrQueue(itemId, patch);
}

async function pushOrQueue(itemId, patch) {
  if (!supabase || !navigator.onLine) {
    await pushPending({ kind: 'update', itemId, patch });
    return;
  }
  try {
    const { error } = await supabase.from('items').update(patch).eq('id', itemId);
    if (error) throw error;
  } catch (e) {
    console.warn('push failed, queued', e);
    await pushPending({ kind: 'update', itemId, patch });
  }
}

export async function flushPending() {
  if (!supabase || !navigator.onLine) return;
  const pending = await loadPending();
  if (pending.length === 0) return;
  const remaining = [];
  for (const op of pending) {
    try {
      if (op.kind === 'update') {
        const { error } = await supabase.from('items').update(op.patch).eq('id', op.itemId);
        if (error) remaining.push(op);
      } else if (op.kind === 'insert') {
        const { error } = await supabase.from('items').insert(op.row);
        if (error) remaining.push(op);
      } else if (op.kind === 'delete') {
        const { error } = await supabase.from('items').delete().eq('id', op.itemId);
        if (error) remaining.push(op);
      } else if (op.kind === 'history') {
        const { error } = await supabase.from('purchase_history').insert(op.row);
        if (error) remaining.push(op);
      }
    } catch {
      remaining.push(op);
    }
  }
  await savePending(remaining);
  if (pending.length > remaining.length) {
    showToast(`${pending.length - remaining.length}件の変更を同期しました`);
  }
}

export function startRealtime(householdId) {
  if (!supabase || !householdId) return;
  if (realtimeChannel) supabase.removeChannel(realtimeChannel);
  realtimeChannel = supabase
    .channel(`items:${householdId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'items', filter: `household_id=eq.${householdId}` },
      (payload) => handleRealtime(payload)
    )
    .subscribe();
}

function handleRealtime(payload) {
  const items = [...state.items];
  if (payload.eventType === 'INSERT') {
    if (!items.find((i) => i.id === payload.new.id)) items.push(payload.new);
  } else if (payload.eventType === 'UPDATE') {
    const idx = items.findIndex((i) => i.id === payload.new.id);
    if (idx >= 0) items[idx] = payload.new;
    else items.push(payload.new);
  } else if (payload.eventType === 'DELETE') {
    const idx = items.findIndex((i) => i.id === payload.old.id);
    if (idx >= 0) items.splice(idx, 1);
  }
  setState({ items });
  saveItems(items);
}

export function stopRealtime() {
  if (realtimeChannel && supabase) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
}

window.addEventListener('online', () => {
  flushPending();
});
