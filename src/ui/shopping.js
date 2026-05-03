import { state, setState } from '../state.js';
import { applyLocalChange } from '../data/sync.js';
import { inShoppingList, compareItems } from '../logic/statusTransition.js';
import { supabase } from '../data/supabase.js';

export function renderShopping(root) {
  const items = state.items
    .filter((i) => inShoppingList(i.status))
    .sort(compareItems);

  root.innerHTML = `
    <div class="screen shopping-screen">
      <header class="top-bar">
        <h2>買い物中（${items.length}件）</h2>
      </header>

      <main class="shopping-list">
        ${items.length === 0
          ? `<div class="empty">買い物リストは空です。<br/>ホームのタイルをタップすると追加されます。</div>`
          : items.map((i) => `
            <label class="shop-row" data-id="${i.id}">
              <input type="checkbox" />
              <span class="shop-emoji">${i.emoji || '🛒'}</span>
              <span class="shop-name">${escapeHtml(i.name)}</span>
            </label>
          `).join('')}
      </main>

      <footer class="bottom-tabs">
        <button class="tab" id="tab-home">ホーム</button>
        <button class="tab tab-active">
          買い物中
          ${items.length > 0 ? `<span class="badge">${items.length}</span>` : ''}
        </button>
      </footer>
    </div>
  `;

  root.querySelector('#tab-home').addEventListener('click', () => setState({ tab: 'home' }));

  root.querySelectorAll('.shop-row').forEach((row) => {
    row.addEventListener('change', async () => {
      const id = row.dataset.id;
      const checkbox = row.querySelector('input');
      if (!checkbox.checked) return;
      const item = state.items.find((i) => i.id === id);
      if (!item) return;
      row.classList.add('shop-row-bought');
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
    });
  });
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
