import { supabase } from '../data/supabase.js';
import { state, setState, showToast } from '../state.js';
import { saveItems } from '../data/localStore.js';

const EMOJI_PRESETS = [
  '🛒','🥚','🥛','🍞','🍚','🍌','🍅','🍗','🐟','🥬','🥩','🥦','🥕','🍎','🍐','🍇','🍊','🍓','🍆','🌽',
  '🧀','🥓','🍖','🍣','🍤','🥟','🍪','🍰','🍫','🍿','🥨','🥐','🌮','🍝','🍱','🍙','🍘','🍡','🥜','🌾',
  '🧂','🍶','🥢','🫗','🍯','🍬','☕','🍵','🥤','🧃','🍺','🍷','🦪','🥝','🥑','🥥','🥗','🌶️','🍑','🍋',
  '🧴','🧻','🗑️','🧽','🧼','🪥','🦷','🪒','🧺','🧹','🧯','🪣','🪞','💊','📦','🪟','🪡','🧵','🪮','🪥'
];

export function openEditModal(itemId) {
  const item = state.items.find((i) => i.id === itemId);
  if (!item) return;
  const existing = document.querySelector('.modal-backdrop');
  if (existing) existing.remove();
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal">
      <h2>${escapeHtml(item.emoji || '🛒')} ${escapeHtml(item.name)} を編集</h2>
      <form id="edit-form">
        <label>
          名前
          <input id="m-name" type="text" required value="${escapeAttr(item.name)}" />
        </label>
        <label>
          絵文字
          <div class="emoji-picker">
            ${EMOJI_PRESETS.map((e) => `<button type="button" class="emoji-btn${e === item.emoji ? ' selected' : ''}" data-emoji="${e}">${e}</button>`).join('')}
          </div>
        </label>
        <label class="pin-toggle">
          <input id="m-pinned" type="checkbox" ${item.is_pinned ? 'checked' : ''} />
          📌 上に固定（ピン留め）
        </label>
        <div class="modal-buttons">
          <button type="button" class="btn-danger" id="btn-delete">🗑️ 削除</button>
          <button type="button" class="btn-cancel">キャンセル</button>
          <button type="submit" class="btn-primary">保存</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(backdrop);

  let selectedEmoji = item.emoji || '🛒';
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

  backdrop.querySelector('#btn-delete').addEventListener('click', async () => {
    if (!confirm(`「${item.name}」を削除しますか？\n（買い物履歴も一緒に消えます）`)) return;
    const items = state.items.filter((i) => i.id !== itemId);
    setState({ items });
    await saveItems(items);
    backdrop.remove();
    showToast(`「${item.name}」を削除しました`);
    if (supabase) {
      const { error } = await supabase.from('items').delete().eq('id', itemId);
      if (error) console.warn('delete failed', error);
    }
  });

  backdrop.querySelector('#edit-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = backdrop.querySelector('#m-name').value.trim();
    const isPinned = backdrop.querySelector('#m-pinned').checked;
    if (!name) return;
    const patch = { name, emoji: selectedEmoji, is_pinned: isPinned };
    const idx = state.items.findIndex((i) => i.id === itemId);
    if (idx >= 0) {
      const items = [...state.items];
      items[idx] = { ...items[idx], ...patch };
      setState({ items });
      await saveItems(items);
    }
    backdrop.remove();
    if (supabase) {
      const { error } = await supabase.from('items').update(patch).eq('id', itemId);
      if (error) console.warn('update failed', error);
    }
  });

  setTimeout(() => backdrop.querySelector('#m-name').focus(), 100);
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
function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;');
}
