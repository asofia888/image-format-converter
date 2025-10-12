# Content Security Policy (CSP) Documentation

このドキュメントは、アプリケーションのContent Security Policy（CSP）設定を説明します。

## 現在のCSP設定

```
default-src 'self';
script-src 'self' 'sha256-/l7AUzKB6KJZktWRrqv1iSNi/vLFcBnwzGnrnfNJNsI=' 'sha256-i9iqcCtWFTH+9gHFg6EI4pASB11z22rOG/2Hvnn4tL0=' 'sha256-weH2QletrYWU8MgvVb02tdwNbth6cPTC34zUdCT/31I=' 'sha256-fM4bplb7wkd9OZMpoKKM9PKBsoN0CBq+Y5sZ6+5wF20=' 'sha256-2rOWYJZd8TDJrM/W1Uy634Jxqvo9gIyKZzxHuG79MBw=' https://aistudiocdn.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' https://fonts.gstatic.com;
connect-src 'self' blob: https://aistudiocdn.com;
worker-src 'self' blob:;
object-src 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests;
```

**Note:** `frame-ancestors` と `X-Frame-Options` は `<meta>` タグでは無視されるため、HTTPヘッダーで設定する必要があります。

## ディレクティブの説明

### `default-src 'self'`
デフォルトで同一オリジンからのリソースのみを許可

### `script-src`
スクリプトの読み込み元を制限：
- `'self'`: 同一オリジン
- `'sha256-...'`: インラインスクリプトのSHA-256ハッシュ（5つ）
  1. テーマ初期化スクリプト: `/l7AUzKB6KJZktWRrqv1iSNi/vLFcBnwzGnrnfNJNsI=`
  2. JSON-LD構造化データ: `i9iqcCtWFTH+9gHFg6EI4pASB11z22rOG/2Hvnn4tL0=`
  3. Import map: `weH2QletrYWU8MgvVb02tdwNbth6cPTC34zUdCT/31I=`
  4. インラインスクリプト1: `fM4bplb7wkd9OZMpoKKM9PKBsoN0CBq+Y5sZ6+5wF20=`
  5. インラインスクリプト2: `2rOWYJZd8TDJrM/W1Uy634Jxqvo9gIyKZzxHuG79MBw=`
- `https://aistudiocdn.com`: AI Studio CDN

### `style-src`
スタイルシートの読み込み元を制限：
- `'self'`: 同一オリジン
- `'unsafe-inline'`: インラインスタイル（一部コンポーネントで必要）

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
- `blob:`: Blob URL（画像変換プレビュー用）
- `https://aistudiocdn.com`: AI Studio CDN

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

### スクリプト1: テーマ初期化（index.html:129-141）

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
- `style-src`の`'unsafe-inline'`削除（全てのインラインスタイルをCSS化）
- Nonce使用への移行（動的CSP生成）

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
