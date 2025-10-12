# Error Messages Guide

このドキュメントでは、ユーザーフレンドリーなエラーメッセージの作成ガイドラインを説明します。

## 🎯 基本原則

### 1. **技術用語を避ける**
❌ Bad: "Canvas context error"
✅ Good: "Unable to process the image"

### 2. **解決策を提示する**
❌ Bad: "Invalid file type"
✅ Good: "This file type is not supported. Please use JPEG, PNG, or WebP images."

### 3. **ユーザーの行動を促す**
❌ Bad: "Blob creation failed"
✅ Good: "Unable to save the converted image. Please try again."

### 4. **平易な言葉を使う**
❌ Bad: "The browser may not support converting to {format}"
✅ Good: "Couldn't convert to {format} format. Please try a different format or browser."

---

## 📝 改善されたエラーメッセージ一覧

### ファイル関連エラー

| エラーキー | 改善前 | 改善後 |
|-----------|--------|--------|
| `errorNoValidFiles` | "No valid image files (JPEG, PNG, WebP) were found." | "No image files were found. Please select JPEG, PNG, or WebP files." |
| `errorFileTooLarge` | "File '{fileName}' is too large ({fileSize}). Max size is {maxSize}MB." | "The file '{fileName}' ({fileSize}) is too large. Please use a file smaller than {maxSize}MB." |
| `errorTooManyFiles` | "Cannot process more than {maxFiles} files at once." | "You can only convert up to {maxFiles} files at once. Please select fewer files." |

### 変換エラー

| エラーキー | 改善前 | 改善後 |
|-----------|--------|--------|
| `errorLoadImage` | "Could not load image for conversion." | "This file appears to be damaged or not a valid image. Please try a different file." |
| `errorConversionFailed` | "Conversion failed. The browser may not support converting to {targetFormat}." | "Couldn't convert to {targetFormat} format. Please try a different format or browser." |
| `errorCreateBlob` | "Failed to create Blob." | "Unable to save the converted image. Please try again." |

### 技術的エラー

| エラーキー | 改善前 | 改善後 |
|-----------|--------|--------|
| `errorCanvasContext` | "Could not get canvas context." | "Unable to process the image. Please try a different file." |
| `errorWorkerGeneric` | "A background conversion error occurred: {message}" | "Something went wrong during conversion. Please try again." |
| `errorBrowserSupport` | "Your browser does not support required features for this conversion. Please use a modern browser." | "Your browser is too old for this feature. Please update your browser or try Chrome, Firefox, or Safari." |

### その他のエラー

| エラーキー | 改善前 | 改善後 |
|-----------|--------|--------|
| `errorCreateZip` | "Failed to create ZIP file." | "Unable to create the download package. Please try downloading files individually." |
| `errorCrop` | "Could not crop the image. Please try again." | "Unable to crop the image. Please try again or select a different area." |

---

## 🌏 多言語対応

### 日本語のエラーメッセージ原則

1. **敬語を使用** - 「お試しください」「ご利用ください」
2. **具体的な数値** - 「{maxSize}MB以下」
3. **代替案を提示** - 「別のファイルをお試しください」
4. **親しみやすさ** - 技術的すぎない表現

### 例：日本語エラーメッセージ

```typescript
// 改善前
"Canvasコンテキストを取得できませんでした。"

// 改善後
"画像を処理できませんでした。別のファイルをお試しください。"
```

---

## ✍️ 新しいエラーメッセージを追加する方法

### 1. `useTranslation.tsx`に追加

```typescript
// 英語版
const en = {
  // ... existing translations
  "errorNewFeature": "Clear explanation of what went wrong. What the user should do.",
};

// 日本語版
const ja = {
  // ... existing translations
  "errorNewFeature": "何が問題か明確に説明。ユーザーが取るべき行動。",
};
```

### 2. エラーメッセージのチェックリスト

✅ 技術用語を避けているか？
✅ ユーザーが理解できる言葉か？
✅ 次のアクションが明確か？
✅ 親切で丁寧な表現か？
✅ 解決策を提示しているか？

---

## 🧪 テスト方法

### ブラウザでエラーを確認

1. 意図的にエラーを発生させる
2. エラーメッセージを確認
3. 非技術者に読んでもらう
4. 理解できるか、行動できるかを確認

### エラーメッセージの例

```tsx
// 良い例
<ErrorMessage>
  このファイルは破損しているか、画像ファイルではありません。
  別のファイルをお試しください。
</ErrorMessage>

// 悪い例
<ErrorMessage>
  FileReader.readAsArrayBuffer failed: DOMException
</ErrorMessage>
```

---

## 📚 参考資料

### エラーメッセージの書き方

1. **明確性** - 何が起こったのかを明確に
2. **行動指向** - ユーザーが何をすべきかを示す
3. **共感** - ユーザーの立場に立つ
4. **簡潔性** - 長すぎない、短すぎない

### 良いエラーメッセージの条件

- ✅ **人間的** - ロボットのような表現を避ける
- ✅ **前向き** - 解決策に焦点を当てる
- ✅ **具体的** - 曖昧な表現を避ける
- ✅ **実用的** - 実際に役立つ情報を提供

---

## 🎨 トーン＆マナー

### 推奨するトーン

```
❌ 冷たい: "Error: Invalid input"
✅ 親切: "This file type is not supported. Please use JPEG, PNG, or WebP images."

❌ 技術的: "Blob instantiation failed"
✅ 分かりやすい: "Unable to save the converted image. Please try again."

❌ 責める: "You entered an invalid file"
✅ 中立的: "This file appears to be damaged"
```

---

## 🔄 継続的改善

### エラーメッセージの改善サイクル

1. **収集** - ユーザーフィードバックを集める
2. **分析** - どのエラーが理解されていないか
3. **改善** - より分かりやすい表現に書き換え
4. **テスト** - 実際のユーザーで検証
5. **反復** - 継続的に改善

---

## 📊 改善の効果

### 改善前後の比較

**改善前:**
- 技術的な用語が多い
- ユーザーが次に何をすべきか不明
- 開発者向けの説明

**改善後:**
- 平易な言葉で説明
- 具体的な行動を提示
- ユーザーフレンドリー

### UXへの影響

- ✅ ユーザーの不安を軽減
- ✅ サポート問い合わせの削減
- ✅ アプリの信頼性向上
- ✅ ユーザー満足度の向上

---

**最終更新:** 2025-01-12
**バージョン:** 1.0
