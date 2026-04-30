import { signInWithEmail, verifyOtp, isConfigured } from '../data/supabase.js';
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
  const sentEmail = sessionStorage.getItem('shopping-list:sent-email');
  const message = state.authMessage
    ? `<p class="auth-message">${state.authMessage}</p>`
    : '';

  if (sentEmail) {
    root.innerHTML = `
      <div class="auth-screen">
        <h1>🛒 買い物リスト</h1>
        <p class="auth-lead">📧 <strong>${escapeHtml(sentEmail)}</strong> に<br/>メールを送りました。</p>

        <div class="auth-divider"><span>方法A：メールのリンクをタップ</span></div>
        <p class="auth-hint">メール内の青いリンクをタップすると、自動的にこのアプリに戻ってログインされます。</p>

        <div class="auth-divider"><span>方法B：6桁コードを入力</span></div>
        <p class="auth-hint">メール内の <strong>6桁の数字</strong> を直接入力（リンクが開かない時用）。</p>
        <form id="otp-form">
          <input
            id="otp"
            type="text"
            inputmode="numeric"
            pattern="[0-9]*"
            maxlength="6"
            required
            placeholder="123456"
            autocomplete="one-time-code"
          />
          <button type="submit">この6桁でログイン</button>
        </form>

        <button id="back-btn" class="auth-link">← メールアドレスを変える</button>
        ${message}
      </div>
    `;
    root.querySelector('#otp-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const token = root.querySelector('#otp').value.trim();
      if (token.length !== 6) return;
      const btn = root.querySelector('#otp-form button');
      btn.disabled = true;
      btn.textContent = '確認中…';
      try {
        await verifyOtp(sentEmail, token);
        sessionStorage.removeItem('shopping-list:sent-email');
        setState({ authMessage: null });
      } catch (err) {
        setState({ authMessage: '❌ コードが違うようです：' + err.message });
        btn.disabled = false;
        btn.textContent = 'この6桁でログイン';
      }
    });
    root.querySelector('#back-btn').addEventListener('click', () => {
      sessionStorage.removeItem('shopping-list:sent-email');
      setState({ authMessage: null });
    });
    return;
  }

  root.innerHTML = `
    <div class="auth-screen">
      <h1>🛒 買い物リスト</h1>
      <p class="auth-lead">メールアドレスにログインリンクと6桁コードをお送りします。</p>
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
      sessionStorage.setItem('shopping-list:sent-email', email);
      setState({ authMessage: null });
    } catch (err) {
      setState({ authMessage: '❌ 送信に失敗しました：' + err.message });
      btn.disabled = false;
      btn.textContent = 'ログインリンクを送る';
    }
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
