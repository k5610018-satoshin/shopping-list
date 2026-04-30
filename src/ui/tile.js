import { applyLocalChange } from '../data/sync.js';
import { nextStatus, STATUS_DOT } from '../logic/statusTransition.js';
import { state } from '../state.js';
import { supabase } from '../data/supabase.js';

const LONG_PRESS_MS = 350;

export function tileHtml(item) {
  const dot = STATUS_DOT[item.status] || '🟢';
  const pinned = item.is_pinned ? ' tile-pinned' : '';
  return `
    <button class="tile tile-${item.status}${pinned}" data-id="${item.id}" aria-label="${item.name} ${item.status}">
      <span class="tile-emoji">${item.emoji || '🛒'}</span>
      <span class="tile-name">${escapeHtml(item.name)}</span>
      <span class="tile-dot">${dot}</span>
    </button>`;
}

export function attachTileEvents(container) {
  let pressTimer = null;
  let longPressed = false;
  let activeTile = null;

  container.addEventListener('pointerdown', (e) => {
    const tile = e.target.closest('.tile');
    if (!tile) return;
    activeTile = tile;
    longPressed = false;
    pressTimer = setTimeout(() => {
      longPressed = true;
      handleLongPress(tile);
    }, LONG_PRESS_MS);
  });

  container.addEventListener('pointerup', (e) => {
    const tile = e.target.closest('.tile');
    clearTimeout(pressTimer);
    if (!tile || tile !== activeTile) {
      activeTile = null;
      return;
    }
    if (!longPressed) handleTap(tile);
    activeTile = null;
  });

  container.addEventListener('pointercancel', () => {
    clearTimeout(pressTimer);
    activeTile = null;
  });

  container.addEventListener('pointerleave', () => {
    clearTimeout(pressTimer);
    activeTile = null;
  });

  container.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.tile')) e.preventDefault();
  });
}

async function handleTap(tile) {
  const id = tile.dataset.id;
  const item = state.items.find((i) => i.id === id);
  if (!item) return;
  const next = nextStatus(item.status);
  tile.classList.add('tile-pulse');
  setTimeout(() => tile.classList.remove('tile-pulse'), 200);
  await applyLocalChange(id, { status: next });
}

async function handleLongPress(tile) {
  const id = tile.dataset.id;
  const item = state.items.find((i) => i.id === id);
  if (!item) return;
  tile.classList.add('tile-bought');
  setTimeout(() => tile.classList.remove('tile-bought'), 400);
  const now = new Date().toISOString();
  let intervalDays = null;
  if (item.last_bought_at) {
    intervalDays = Math.round(
      (Date.now() - new Date(item.last_bought_at).getTime()) / 86400000
    );
  }
  await applyLocalChange(id, {
    status: 'stock',
    last_bought_at: now,
    sort_score: (item.sort_score || 0) + 1,
  });
  if (supabase && state.householdId) {
    supabase
      .from('purchase_history')
      .insert({
        item_id: id,
        household_id: state.householdId,
        bought_at: now,
        bought_by: state.user?.id || null,
        interval_days: intervalDays,
      })
      .then(({ error }) => {
        if (error) console.warn('history insert failed', error);
      });
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}
