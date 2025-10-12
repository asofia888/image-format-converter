# Content Security Policy (CSP) Documentation

このドキュメントは、アプリケーションのContent Security Policy（CSP）設定を説明します。

## 現在のCSP設定

```
default-src 'self';
script-src 'self' 'sha256-5F3l4lhJ3J60CyEPA8q4aBpPdUHE5EpKDQyI6EdatLo=' 'sha256-/l7AUzKB6KJZktWRrqv1iSNi/vLFcBnwzGnrnfNJNsI=' https://aistudiocdn.com https://cdn.tailwindcss.com;
style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com;
img-src 'self' data: blob:;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' https://aistudiocdn.com https://cdn.tailwindcss.com;
worker-src 'self' blob:;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

## ディレクティブの説明

### `default-src 'self'`
デフォルトで同一オリジンからのリソースのみを許可

### `script-src`
スクリプトの読み込み元を制限：
- `'self'`: 同一オリジン
- `'sha256-...'`: インラインスクリプトのSHA-256ハッシュ（2つ）
  1. Tailwind設定スクリプト
  2. テーマ初期化スクリプト
- `https://aistudiocdn.com`: AI Studio CDN
- `https://cdn.tailwindcss.com`: Tailwind CSS CDN

### `style-src`
スタイルシートの読み込み元を制限：
- `'self'`: 同一オリジン
- `'unsafe-inline'`: インラインスタイル（Tailwind CDNに必要）
- `https://cdn.tailwindcss.com`: Tailwind CSS CDN

### `img-src`
画像の読み込み元を制限：
- `'self'`: 同一オリジン
- `data:`: Data URI（Base64画像）
- `blob:`: Blob URL（変換後の画像プレビュー）

### `font-src`
フォントの読み込み元を制限：
- `'self'`: 同一オリジン
- `https://fonts.gstatic.com`: Google Fonts

### `connect-src`
XHR、WebSocket、EventSourceの接続先を制限：
- `'self'`: 同一オリジン
- `https://aistudiocdn.com`: AI Studio CDN
- `https://cdn.tailwindcss.com`: Tailwind CSS CDN

### `worker-src`
Web Workersの読み込み元を制限：
- `'self'`: 同一オリジン
- `blob:`: Blob URL（動的Worker作成用）

### `object-src 'none'`
`<object>`, `<embed>`, `<applet>`を無効化

### `base-uri 'self'`
`<base>`タグのURIを同一オリジンに制限

### `form-action 'self'`
フォーム送信先を同一オリジンに制限

### `frame-ancestors 'none'`
このページを`<iframe>`に埋め込むことを禁止（クリックジャッキング対策）

### `upgrade-insecure-requests`
HTTPリクエストを自動的にHTTPSにアップグレード

---

## インラインスクリプトのSHA-256ハッシュ更新方法

インラインスクリプトを変更した場合、新しいSHA-256ハッシュを計算する必要があります。

### スクリプト1: Tailwind設定（index.html:86-102）

```bash
# スクリプトの内容を抽出
cat > /tmp/script.js << 'EOF'
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              'brand-primary': '#007BFF',
              'brand-secondary': '#6C757D',
              'brand-success': '#28A745',
              'brand-danger': '#DC3545',
              'brand-light': '#F8F9FA',
              'brand-dark': '#343A40',
            },
          },
        },
      }
EOF

# SHA-256ハッシュを計算
echo -n "$(cat /tmp/script.js)" | openssl dgst -sha256 -binary | openssl base64
```

現在のハッシュ: `5F3l4lhJ3J60CyEPA8q4aBpPdUHE5EpKDQyI6EdatLo=`

### スクリプト2: テーマ初期化（index.html:144-156）

```bash
# スクリプトの内容を抽出
cat > /tmp/script.js << 'EOF'
      // Prevents FOUC (Flash of Unstyled Content) or flash of incorrect theme
      (function() {
        try {
          // Default to dark mode. Only use light mode if explicitly set.
          if (localStorage.getItem('theme') === 'light') {
            document.documentElement.classList.remove('dark');
          } else {
            document.documentElement.classList.add('dark');
          }
        } catch (_) {}
      })();
EOF

# SHA-256ハッシュを計算
echo -n "$(cat /tmp/script.js)" | openssl dgst -sha256 -binary | openssl base64
```

現在のハッシュ: `/l7AUzKB6KJZktWRrqv1iSNi/vLFcBnwzGnrnfNJNsI=`

---

## セキュリティ上の注意点

### ✅ 実装済み
- インラインスクリプトの`'unsafe-inline'`削除（SHA-256ハッシュ使用）
- クリックジャッキング対策（`frame-ancestors 'none'`）
- HTTPS強制（`upgrade-insecure-requests`）
- Web Worker用のblob:許可

### ⚠️ 今後の改善点
- `style-src`の`'unsafe-inline'`削除（Tailwind CSS v4のビルトインCSSに移行後）
- Nonce使用への移行（動的CSP生成）
- Tailwind CDN削除（ビルド時にCSSを生成）

---

## テスト方法

### ブラウザでCSP違反を確認

```javascript
// ブラウザのコンソールで確認
console.log(document.querySelector('meta[http-equiv="Content-Security-Policy"]').content);
```

### CSP違反のレポート確認

ブラウザの開発者ツール > Console で、CSP違反がないか確認してください。

違反がある場合、以下のようなエラーが表示されます：
```
Refused to execute inline script because it violates the following Content Security Policy directive...
```

---

## 参考資料

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/)
- [Report URI CSP Builder](https://report-uri.com/home/generate)
