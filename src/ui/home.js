import { state, setState, showToast } from '../state.js';
import { compareItems, inShoppingList } from '../logic/statusTransition.js';
import { tileHtml, attachTileEvents } from './tile.js';
import { openAddModal } from './add-modal.js';

export function renderHome(root) {
  const items = [...state.items].sort(compareItems);
  const filtered = state.search
    ? items.filter((i) => i.name.toLowerCase().includes(state.search.toLowerCase()))
    : items;
  const shoppingCount = state.items.filter((i) => inShoppingList(i.status)).length;

  const tilesHtml = filtered.map(tileHtml).join('');
  const addNew = state.search && !filtered.find((i) => i.name === state.search)
    ? `<button class="add-suggest" id="add-suggest">「${escapeHtml(state.search)}」を追加</button>`
    : '';

  const editClass = state.editMode ? ' edit-mode' : '';

  root.innerHTML = `
    <div class="screen home-screen${editClass}">
      <header class="top-bar">
        <div class="search-row">
          <input
            id="search"
            type="search"
            placeholder="検索 / 新しい品目"
            value="${escapeAttr(state.search)}"
            autocomplete="off"
          />
          <button id="add-btn" class="icon-btn" aria-label="追加">＋</button>
          <button id="edit-btn" class="icon-btn ${state.editMode ? 'icon-btn-active' : ''}" aria-label="編集">✏️</button>
          <button id="share-btn" class="icon-btn" aria-label="共有">📤</button>
        </div>
        ${state.editMode ? '<div class="edit-banner">編集モード：タイルをタップで編集／削除</div>' : ''}
        ${addNew}
      </header>

      <main class="tile-grid">
        ${filtered.length === 0
          ? `<div class="empty">該当する品目がありません</div>`
          : tilesHtml}
      </main>

      <footer class="bottom-tabs">
        <button class="tab tab-active">ホーム</button>
        <button class="tab" id="tab-shopping">
          買い物中
          ${shoppingCount > 0 ? `<span class="badge">${shoppingCount}</span>` : ''}
        </button>
      </footer>
    </div>
  `;

  const search = root.querySelector('#search');
  search.addEventListener('input', (e) => setState({ search: e.target.value }));

  root.querySelector('#add-btn').addEventListener('click', () => openAddModal(state.search));
  if (root.querySelector('#add-suggest')) {
    root.querySelector('#add-suggest').addEventListener('click', () => openAddModal(state.search));
  }
  root.querySelector('#tab-shopping').addEventListener('click', () =>
    setState({ tab: 'shopping', search: '', editMode: false })
  );
  root.querySelector('#edit-btn').addEventListener('click', () =>
    setState({ editMode: !state.editMode })
  );
  root.querySelector('#share-btn').addEventListener('click', () => shareApp());

  attachTileEvents(root.querySelector('.tile-grid'));
}

async function shareApp() {
  const url = window.location.href.split('?')[0].split('#')[0];
  const title = '買い物リスト';
  const text = '家族で同期できる買い物リスト';
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
    } catch (e) {
      // ユーザーキャンセル、何もしない
    }
  } else if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(url);
      showToast('URLをコピーしました');
    } catch {
      showToast(url);
    }
  } else {
    showToast(url);
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
function escapeAttr(s) {
  return String(s).replace(/"/g, '&quot;');
}
