import { applyLocalChange } from '../data/sync.js';
import { nextStatus } from '../logic/statusTransition.js';
import { state } from '../state.js';
import { supabase } from '../data/supabase.js';
import { openEditModal } from './edit-modal.js';

const LONG_PRESS_MS = 450;

export function tileHtml(item) {
  const pinned = item.is_pinned ? ' tile-pinned' : '';
  const buyMark = item.status === 'out' ? '<span class="tile-buy-mark">買う</span>' : '';
  const editPin = state.editMode ? '<span class="tile-edit-mark">✏️</span>' : '';
  return `
    <button class="tile tile-${item.status}${pinned}" data-id="${item.id}" aria-label="${item.name}">
      <span class="tile-emoji">${item.emoji || '🛒'}</span>
      <span class="tile-name">${escapeHtml(item.name)}</span>
      ${buyMark}
      ${editPin}
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
  // 編集モード中はタップで編集モーダルを開く
  if (state.editMode) {
    openEditModal(id);
    return;
  }
  const next = nextStatus(item.status);
  tile.classList.add('tile-pulse');
  setTimeout(() => tile.classList.remove('tile-pulse'), 180);
  await applyLocalChange(id, { status: next });
}

async function handleLongPress(tile) {
  const id = tile.dataset.id;
  const item = state.items.find((i) => i.id === id);
  if (!item) return;
  // 編集モード中の長押しは無視（タップで編集なので）
  if (state.editMode) return;
  tile.classList.add('tile-bought');
  setTimeout(() => tile.classList.remove('tile-bought'), 400);
  const now = new Date().toISOString();
  let intervalDays = null;
  if (item.last_bought_at) {
    intervalDays = Math.round(
      (Date.now() - new Date(item.last_bought_at).getTime()) / 86400000
    );
  }
  await applyLocalChange(id, { status: 'stock', last_bought_at: now });
  if (supabase && state.householdId) {
    supabase
      .from('purchase_history')
      .insert({
        item_id: id,
        household_id: state.householdId,
        bought_at: now,
        bought_by: null,
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
