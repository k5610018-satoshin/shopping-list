import { state, setState } from '../state.js';
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

  root.innerHTML = `
    <div class="screen home-screen">
      <header class="top-bar">
        <div class="search-row">
          <input
            id="search"
            type="search"
            placeholder="検索 / 新しい品目"
            value="${escapeAttr(state.search)}"
            autocomplete="off"
          />
          <button id="voice-btn" class="icon-btn" aria-label="音声入力">🎤</button>
          <button id="add-btn" class="icon-btn" aria-label="追加">＋</button>
        </div>
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
    setState({ tab: 'shopping', search: '' })
  );

  const voiceBtn = root.querySelector('#voice-btn');
  voiceBtn.addEventListener('click', () => startVoiceInput(search));
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    voiceBtn.style.display = 'none';
  }

  attachTileEvents(root.querySelector('.tile-grid'));
}

function startVoiceInput(searchInput) {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Rec) return;
  const rec = new Rec();
  rec.lang = 'ja-JP';
  rec.continuous = false;
  rec.interimResults = false;
  rec.onresult = (e) => {
    const text = e.results[0][0].transcript.replace(/[。、・,．\s]+$/, '');
    setState({ search: text });
    searchInput.value = text;
  };
  rec.onerror = (e) => console.warn('voice error', e.error);
  rec.start();
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
