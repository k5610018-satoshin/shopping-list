import { state } from '../state.js';
import { renderAuth } from './auth.js';
import { renderHome } from './home.js';
import { renderShopping } from './shopping.js';

export function renderApp() {
  const root = document.getElementById('app');
  if (!state.ready) {
    root.innerHTML = `<div class="loading">読み込み中…</div>`;
    return;
  }
  if (!state.user) {
    renderAuth(root);
  } else if (state.tab === 'shopping') {
    renderShopping(root);
  } else {
    renderHome(root);
  }
  renderToast();
}

function renderToast() {
  const old = document.querySelector('.toast');
  if (old) old.remove();
  if (!state.toast) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = state.toast.text;
  document.body.appendChild(el);
}
