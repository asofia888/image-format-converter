# Undo/Redo Functionality Guide

このドキュメントでは、アプリケーションに実装されたundo/redo機能について説明します。

## 🎯 概要

Undo/Redo機能により、ユーザーは以下の操作を元に戻したり、やり直したりできます:
- 画像のアップロード
- 設定の変更（フォーマット、品質、リサイズ、クロップ）
- ファイルの削除

## 🏗️ アーキテクチャ

### 1. `useHistory` Hook

状態管理と履歴トラッキングを行うカスタムフック。

```typescript
import { useHistory } from './hooks/useHistory';

const {
  state,       // 現在の状態
  setState,    // 状態を更新（履歴に追加）
  undo,        // 1つ前の状態に戻る
  redo,        // 1つ先の状態に進む
  canUndo,     // undo可能かどうか
  canRedo,     // redo可能かどうか
  clear,       // 履歴をクリア
  historySize  // 履歴のサイズ
} = useHistory({
  initialState: { files: [], format: 'webp' },
  maxHistorySize: 50  // 最大履歴数（デフォルト: 50）
});
```

#### 特徴

- **自動重複除去**: 同じ状態は履歴に追加されない
- **メモリ管理**: 最大履歴サイズを設定可能
- **型安全**: TypeScriptの完全なサポート
- **関数型setState**: `setState((prev) => newState)` をサポート

### 2. `useKeyboardShortcuts` Hook

キーボードショートカットを管理するカスタムフック。

```typescript
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

useKeyboardShortcuts({
  onUndo: () => undo(),           // Ctrl+Z
  onRedo: () => redo(),           // Ctrl+Y / Ctrl+Shift+Z
  onSave: () => download(),       // Ctrl+S
  onOpen: () => openFileDialog(), // Ctrl+O
  onClear: () => clear()          // Escape
});
```

#### サポートするショートカット

| ショートカット | Windows/Linux | macOS | 機能 |
|--------------|---------------|-------|------|
| Undo | `Ctrl+Z` | `Cmd+Z` | 元に戻す |
| Redo | `Ctrl+Y` or `Ctrl+Shift+Z` | `Cmd+Y` or `Cmd+Shift+Z` | やり直す |
| Save | `Ctrl+S` | `Cmd+S` | ダウンロード |
| Open | `Ctrl+O` | `Cmd+O` | ファイルを開く |
| Clear | `Escape` | `Escape` | すべてクリア |

---

## 📝 使用方法

### 基本的な使用例

```typescript
import { useHistory } from './hooks/useHistory';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

function MyComponent() {
  const {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo
  } = useHistory({
    initialState: { count: 0 }
  });

  // キーボードショートカットを設定
  useKeyboardShortcuts({
    onUndo: undo,
    onRedo: redo
  });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => setState({ count: state.count + 1 })}>
        Increment
      </button>
      <button onClick={undo} disabled={!canUndo}>
        Undo
      </button>
      <button onClick={redo} disabled={!canRedo}>
        Redo
      </button>
    </div>
  );
}
```

### 複雑な状態管理

```typescript
interface AppState {
  files: File[];
  targetFormat: 'webp' | 'jpeg' | 'png';
  quality: number;
  resizeConfig: ResizeConfig;
  cropConfig: CropConfig;
}

const {
  state,
  setState,
  undo,
  redo,
  canUndo,
  canRedo
} = useHistory<AppState>({
  initialState: {
    files: [],
    targetFormat: 'webp',
    quality: 0.9,
    resizeConfig: { enabled: false },
    cropConfig: { enabled: false }
  },
  maxHistorySize: 100
});

// ファイルを追加（履歴に記録）
const handleAddFile = (newFile: File) => {
  setState(prev => ({
    ...prev,
    files: [...prev.files, newFile]
  }));
};

// フォーマットを変更（履歴に記録）
const handleFormatChange = (format: 'webp' | 'jpeg' | 'png') => {
  setState(prev => ({
    ...prev,
    targetFormat: format
  }));
};
```

---

## 🎨 UI コンポーネント

### Undo/Redo ボタン

ActionButtonsコンポーネントにundo/redoボタンが統合されています:

```tsx
<ActionButtons
  onClear={resetState}
  onConvert={handleConvert}
  isConverting={isConverting}
  hasBeenConverted={hasBeenConverted}
  isBatchMode={isBatchMode}
  onDownloadZip={handleDownloadZip}
  convertedImageSrc={convertedImageSrc}
  convertedFileName={convertedFileName}
  onUndo={undo}
  onRedo={redo}
  canUndo={canUndo}
  canRedo={canRedo}
/>
```

### ボタンの状態

- **無効状態**: `canUndo={false}` / `canRedo={false}` の場合、ボタンは半透明で無効化
- **ツールチップ**: ホバー時にショートカットキーを表示
- **アクセシビリティ**: `aria-label` でスクリーンリーダー対応

---

## 🧪 テスト

### テストファイル

`src/hooks/__tests__/useHistory.test.ts`

```bash
npm test useHistory.test.ts
```

### テストケース

- ✅ 初期状態の確認
- ✅ 状態の追加
- ✅ Undo機能
- ✅ Redo機能
- ✅ 重複状態の除去
- ✅ 最大履歴サイズの制限
- ✅ 関数型setState
- ✅ 履歴のクリア

---

## 🔧 カスタマイズ

### 履歴サイズの変更

```typescript
const { state, setState } = useHistory({
  initialState: { data: [] },
  maxHistorySize: 100  // デフォルトは50
});
```

### ショートカットキーの無効化

```typescript
// 特定のショートカットのみ有効化
useKeyboardShortcuts({
  onUndo: undo,
  onRedo: redo,
  // onSave, onOpen, onClearは省略（無効）
});
```

### カスタムショートカットの追加

`useKeyboardShortcuts.ts` を編集して、新しいショートカットを追加できます:

```typescript
// Ctrl+D: 複製
if (ctrlKey && e.key === 'd' && onDuplicate) {
  e.preventDefault();
  onDuplicate();
  return;
}
```

---

## 🚀 パフォーマンス最適化

### 1. 浅い比較を使用

状態の変更を検出する際、JSON.stringify を使用していますが、大きなオブジェクトの場合は注意が必要です。

```typescript
// 改善案: 浅い比較
const hasChanged = Object.keys(nextState).some(
  key => nextState[key] !== currentState[key]
);
```

### 2. メモ化

頻繁に変更される状態の場合、useMemo を使用して最適化:

```typescript
const memoizedState = useMemo(() => state, [state]);
```

### 3. 選択的な履歴記録

すべての状態変更を記録する必要がない場合:

```typescript
// 履歴に記録しない更新
const updateWithoutHistory = (newData) => {
  // 直接状態を更新（履歴に追加しない）
  setInternalState(newData);
};

// 履歴に記録する更新
const updateWithHistory = (newData) => {
  setState(newData);
};
```

---

## 📊 メモリ使用量

### 推定メモリ使用量

各状態のスナップショットサイズを `N` bytes、最大履歴サイズを `M` とすると:

```
メモリ使用量 ≈ N × M bytes
```

### 例

- 状態サイズ: 1KB (ファイル情報、設定など)
- 最大履歴: 50
- 推定使用量: 50KB

### メモリ管理のベストプラクティス

1. **適切な最大履歴サイズ**: 通常20-50で十分
2. **大きなデータの除外**: 画像データ自体は履歴に含めない
3. **定期的なクリア**: アプリをリセット時に履歴もクリア

---

## 🌐 多言語対応

翻訳ファイル(`useTranslation.tsx`)に以下のキーを追加済み:

### 英語
```typescript
"undoButton": "Undo",
"redoButton": "Redo",
"undoTooltip": "Undo (Ctrl+Z)",
"redoTooltip": "Redo (Ctrl+Y)",
```

### 日本語
```typescript
"undoButton": "元に戻す",
"redoButton": "やり直す",
"undoTooltip": "元に戻す (Ctrl+Z)",
"redoTooltip": "やり直す (Ctrl+Y)",
```

---

## 🐛 トラブルシューティング

### Q: Undoが動作しない

**A:** 以下を確認してください:
- `canUndo` が `true` か確認
- `setState` を使用して状態を更新しているか
- 入力フィールドにフォーカスしていないか（ショートカット無効）

### Q: 履歴がすぐに一杯になる

**A:** `maxHistorySize` を増やすか、重複状態の除去が正しく動作しているか確認してください。

### Q: キーボードショートカットが反応しない

**A:**
- ブラウザのデフォルトショートカットと競合していないか確認
- 入力フィールドやテキストエリアにフォーカスしていないか確認
- useKeyboardShortcuts フックが正しく呼び出されているか確認

---

## 📚 参考資料

### 類似の実装

- [Redux DevTools](https://github.com/reduxjs/redux-devtools) - Time travel debugging
- [Immer](https://immerjs.github.io/immer/) - Immutable state management
- [use-undo](https://github.com/homerchen19/use-undo) - Similar React hook

### 関連記事

- [Command Pattern](https://refactoring.guru/design-patterns/command) - Undo/Redoの設計パターン
- [React History Management](https://reactrouter.com/en/main/hooks/use-history) - React Router の履歴管理

---

**最終更新:** 2025-01-12
**バージョン:** 1.0
