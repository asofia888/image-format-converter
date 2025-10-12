<div align="center">

# 🎨 WebP Magic

### プライバシー保護を重視した、ブラウザ内完結型の画像変換PWAアプリ

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.3-646cff)](https://vitejs.dev/)

[🌐 Live Demo](https://image-format-converter-eight.vercel.app/) | [📖 Documentation](#documentation) | [🐛 Report Bug](https://github.com/yourusername/image-format-converter/issues)

</div>

---

## ✨ 主な機能

### 🖼️ 画像変換
- **フォーマット対応**: JPEG ⇄ PNG ⇄ WebP の相互変換
- **品質調整**: 画像品質を0.5～0.99の範囲で細かく調整
- **バッチ処理**: 最大100ファイルを一括変換

### ✂️ 画像編集
- **リサイズ**: 幅・高さを指定してリサイズ（アスペクト比維持可能）
- **クロップ**: インタラクティブな切り抜き機能
- **プリセット**: よく使う設定を保存・再利用

### 🔒 プライバシー & セキュリティ
- **完全オフライン処理**: 画像はサーバーにアップロードされません
- **ブラウザ内完結**: すべての処理がクライアント側で実行
- **セキュア**: ファイル署名検証、XSS対策、CSP実装

### 📱 PWA対応
- **オフライン動作**: Service Workerによるキャッシング
- **インストール可能**: デスクトップ・モバイルにアプリとして追加
- **レスポンシブ**: すべてのデバイスで快適に動作

### 🌓 UI/UX
- **ダークモード**: 目に優しいダークテーマ
- **多言語対応**: 日本語・英語
- **アクセシビリティ**: WCAG 2.1準拠、スクリーンリーダー対応
- **ドラッグ&ドロップ**: 直感的なファイルアップロード

---

## 🚀 クイックスタート

### 前提条件
- **Node.js**: 22.x 以上
- **npm**: 最新版推奨

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/yourusername/image-format-converter.git
cd image-format-converter

# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

アプリは `http://localhost:5173` で起動します。

### ビルド

```bash
# 本番用ビルド
npm run build

# プレビュー
npm run preview
```

---

## 🏗️ 技術スタック

### フロントエンド
- **React 19**: 最新のReactで構築
- **TypeScript 5.2**: 型安全性を重視
- **Vite 5.3**: 高速なビルドツール
- **Tailwind CSS 4**: ユーティリティファーストのCSS

### 画像処理
- **Web Workers**: メインスレッドをブロックしない並列処理
- **OffscreenCanvas**: 高速な画像処理
- **ImageBitmap API**: 効率的な画像データ操作

### ユーティリティ
- **JSZip**: 複数画像のZIPダウンロード
- **DOMPurify**: XSS対策のHTMLサニタイゼーション

### テスト
- **Vitest**: 高速なユニットテスト
- **Testing Library**: Reactコンポーネントテスト
- **jest-axe**: アクセシビリティテスト

### デプロイ
- **Vercel**: エッジデプロイメント
- **PWA**: Progressive Web App対応

---

## 📦 プロジェクト構造

```
image-format-converter/
├── public/              # 静的ファイル
│   ├── icons/          # PWAアイコン
│   ├── manifest.json   # PWAマニフェスト
│   └── sitemap.xml     # SEO用サイトマップ
├── src/
│   ├── components/     # Reactコンポーネント
│   │   ├── ui/        # 再利用可能なUIコンポーネント
│   │   └── __tests__/ # コンポーネントテスト
│   ├── hooks/         # カスタムReactフック
│   ├── utils/         # ユーティリティ関数
│   ├── workers/       # Web Workers
│   ├── types/         # TypeScript型定義
│   ├── constants/     # 定数定義
│   └── translations/  # 多言語対応
├── dist/              # ビルド成果物
└── coverage/          # テストカバレッジ
```

---

## 🧪 テスト

```bash
# すべてのテストを実行
npm test

# 1回のみ実行（CI用）
npm run test:run

# カバレッジレポート生成
npm run test:coverage

# テストUIで実行
npm run test:ui
```

**テストカバレッジ**: 17個のテストファイル、2,431行のテストコード

---

## 🎯 使用方法

### 基本的な変換フロー

1. **画像をアップロード**
   - ドラッグ&ドロップ、またはクリックしてファイル選択
   - 対応形式: JPEG, PNG, WebP（最大50MB/ファイル）

2. **設定を調整**
   - 出力フォーマットを選択（JPEG/PNG/WebP）
   - 品質スライダーで圧縮率を調整
   - 必要に応じてリサイズ・クロップ

3. **変換実行**
   - 「変換」ボタンをクリック
   - Web Workerが並列処理で高速変換

4. **ダウンロード**
   - 単一ファイル: 「ダウンロード」ボタン
   - 複数ファイル: 「ZIPでダウンロード」ボタン

### 高度な機能

#### プリセット機能
よく使う設定を保存して再利用できます：
```typescript
// 例: Web用最適化プリセット
{
  targetFormat: 'webp',
  quality: 0.85,
  resize: { enabled: true, width: 1920, maintainAspectRatio: true }
}
```

#### バッチ処理
最大100ファイルを一括変換：
- 各ファイルの個別進捗状況を表示
- エラーファイルはスキップして続行
- すべて変換後、ZIPで一括ダウンロード

---

## 🔧 設定

### 環境変数
このアプリは環境変数を必要としません（完全クライアントサイド）。

### PWA設定
`public/manifest.json` でPWA設定をカスタマイズできます：
```json
{
  "name": "WebP Magic",
  "short_name": "WebP Magic",
  "theme_color": "#8b5cf6",
  "background_color": "#1e293b"
}
```

### ビルド最適化
`vite.config.ts` でバンドルサイズを最適化：
- Code splitting（vendor chunks分離）
- Terser圧縮（console削除、dead code elimination）
- 動的インポート（JSZipなど）

---

## 🌐 ブラウザ対応

| ブラウザ | サポート |
|---------|---------|
| Chrome | ✅ 90+ |
| Firefox | ✅ 88+ |
| Safari | ✅ 14+ |
| Edge | ✅ 90+ |
| Opera | ✅ 76+ |

**必要な機能:**
- Web Workers
- OffscreenCanvas
- ImageBitmap API
- ES2020

---

## 🔐 セキュリティ

### 実装済みセキュリティ対策

- **ファイル検証**: マジックナンバーによる署名検証
- **ファイル名サニタイゼーション**: パストラバーサル攻撃対策
- **CSP**: Content Security Policy実装
- **XSS対策**: DOMPurifyによるHTMLサニタイゼーション
- **ファイルサイズ制限**: 50MB/ファイル、100ファイル/バッチ
- **拡張子検証**: MIME typeと拡張子の整合性チェック

### セキュリティレポート
セキュリティ上の問題を発見した場合は、[Issues](https://github.com/yourusername/image-format-converter/issues)にてご報告ください。

---

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更の場合は、まずIssueで議論してください。

### 開発フロー

1. このリポジトリをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

### コーディング規約
- TypeScriptの型を適切に定義
- ESLintルールに従う
- テストを追加（カバレッジ維持）
- コミットメッセージは明確に

---

## 📝 ライセンス

このプロジェクトは [MIT License](LICENSE) の下で公開されています。

---

## 👨‍💻 作者

**WebP Magic Team**

- Website: [https://image-format-converter-eight.vercel.app/](https://image-format-converter-eight.vercel.app/)
- GitHub: [@yourusername](https://github.com/yourusername)

---

## 🙏 謝辞

- [React](https://react.dev/) - UIライブラリ
- [Vite](https://vitejs.dev/) - ビルドツール
- [Tailwind CSS](https://tailwindcss.com/) - CSSフレームワーク
- [Vercel](https://vercel.com/) - ホスティング

---

## 📊 ステータス

- **バージョン**: 1.0.0
- **ビルドサイズ**: ~400KB（gzip圧縮後）
- **テストカバレッジ**: 82%
- **パフォーマンススコア**: 95/100
- **アクセシビリティスコア**: 100/100

---

<div align="center">

Made with ❤️ by WebP Magic Team

[⬆ Back to top](#-webp-magic)

</div>
