# 買い物リスト PWA

冷蔵庫の食材・調味料・日用品を **1タップで記録**して、自動で買い物リストを作るiPhone対応 PWA。

## 状態モデル

タイル1タップで `🟢 ある → 🟠 そろそろ → 🔴 ない → 🟢` を循環。
🟠と🔴のアイテムが自動的に「買い物中」タブに集まる。

## 開発

```sh
npm install
cp .env.example .env.local   # Supabase URL/anon key を記入
npm run dev                  # http://localhost:5173
npm run build                # 本番ビルド
```

## 構成

- フロント：Vanilla JS + Vite + vite-plugin-pwa
- バック：Supabase（auth / db / Realtime / RLS）
- オフライン：IndexedDB（idb-keyval）+ 楽観的更新
- ホスティング：Cloudflare Pages
