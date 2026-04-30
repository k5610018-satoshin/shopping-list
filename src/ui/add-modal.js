import { supabase } from '../data/supabase.js';
import { state, setState, showToast } from '../state.js';
import { saveItems } from '../data/localStore.js';

const EMOJI_PRESETS = ['🛒', '🥚', '🥛', '🍞', '🍚', '🍌', '🍅', '🍗', '🐟', '🥬', '🧂', '🍶', '🍬', '☕', '🍵', '🧴', '🧻', '🗑️', '🧽', '🦷', '🍙', '🍝', '🥕', '🍎'];

export function openAddModal(prefillName = '') {
  const existing = document.querySelector('.modal-backdrop');
  if (existing) existing.remove();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <h2>新しい品目を追加</h2>
      <form id="add-form">
        <label>
          名前
          <input id="m-name" type="text" required placeholder="例：豆腐" value="${escapeAttr(prefillName)}" />
        </label>
        <label>
          絵文字
          <div class="emoji-picker">
            ${EMOJI_PRESETS.map((e, i) => `<button type="button" class="emoji-btn${i === 0 ? ' selected' : ''}" data-emoji="${e}">${e}</button>`).join('')}
          </div>
        </label>
        <div class="modal-buttons">
          <button type="button" class="btn-cancel">キャンセル</button>
          <button type="submit" class="btn-primary">追加</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(backdrop);
  let selectedEmoji = '🛒';
  backdrop.querySelectorAll('.emoji-btn').forEach((b) => {
    b.addEventListener('click', () => {
      backdrop.querySelectorAll('.emoji-btn').forEach((x) => x.classList.remove('selected'));
      b.classList.add('selected');
      selectedEmoji = b.dataset.emoji;
    });
  });
  backdrop.querySelector('.btn-cancel').addEventListener('click', () => backdrop.remove());
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) backdrop.remove();
  });
  backdrop.querySelector('#add-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = backdrop.querySelector('#m-name').value.trim();
    if (!name) return;
    if (state.items.find((i) => i.name === name)) {
      showToast('同じ名前の品目があります');
      return;
    }
    const tempItem = {
      id: crypto.randomUUID(),
      household_id: state.householdId,
      name,
      emoji: selectedEmoji,
      status: 'out',
      is_pinned: false,
      sort_score: 0,
      updated_at: new Date().toISOString(),
    };
    setState({ items: [tempItem, ...state.items] });
    await saveItems(state.items);
    backdrop.remove();
    if (supabase) {
      const { data, error } = await supabase
        .from('items')
        .insert({
          household_id: state.householdId,
          name,
          emoji: selectedEmoji,
          status: 'out',
        })
        .select()
        .single();
      if (!error && data) {
        const idx = state.items.findIndex((i) => i.id === tempItem.id);
        if (idx >= 0) {
          const items = [...state.items];
          items[idx] = data;
          setState({ items });
          await saveItems(items);
        }
      }
    }
  });
  setTimeout(() => backdrop.querySelector('#m-name').focus(), 100);
}

function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;');
}
