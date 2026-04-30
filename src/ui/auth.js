import { signInWithEmail, isConfigured } from '../data/supabase.js';
import { setState, state } from '../state.js';

export function renderAuth(root) {
  if (!isConfigured) {
    root.innerHTML = `
      <div class="auth-screen">
        <h1>買い物リスト</h1>
        <p class="auth-error">⚠️ Supabase 未設定<br/><code>.env.local</code> に<br/>VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY を設定してください。</p>
      </div>`;
    return;
  }
  const message = state.authMessage
    ? `<p class="auth-message">${state.authMessage}</p>`
    : '';
  root.innerHTML = `
    <div class="auth-screen">
      <h1>🛒 買い物リスト</h1>
      <p class="auth-lead">メールアドレスにログインリンクをお送りします。</p>
      <form id="auth-form">
        <input
          id="email"
          type="email"
          required
          placeholder="example@example.com"
          autocomplete="email"
          inputmode="email"
        />
        <button type="submit">ログインリンクを送る</button>
      </form>
      ${message}
    </div>
  `;
  root.querySelector('#auth-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = root.querySelector('#email').value.trim();
    if (!email) return;
    const btn = root.querySelector('button');
    btn.disabled = true;
    btn.textContent = '送信中…';
    try {
      await signInWithEmail(email);
      setState({ authMessage: `📧 ${email} にログインリンクを送りました。メールから戻ってきてください。` });
    } catch (err) {
      setState({ authMessage: '❌ 送信に失敗しました：' + err.message });
    } finally {
      btn.disabled = false;
      btn.textContent = 'ログインリンクを送る';
    }
  });
}
