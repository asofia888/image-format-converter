import React, { createContext, useState, useContext, useMemo } from 'react';

// FIX: Reverted to embedding translations to resolve module loading errors in the environment.
// This ensures the application can run without relying on potentially problematic static file imports.
const en = {
  "_version": "7251664_no_avif_2025",
  "appTitle": "Image Format Converter",
  "appDescription": "Transform your JPEG, PNG, and WebP images instantly using your browser.",
  "footerText": "&copy; {year} Image Converter. All rights reserved.",
  "footerTerms": "Terms of Service",
  "footerDisclaimer": "Disclaimer",
  "footerHowTo": "How to Use",
  "uploadCTA": "Click to upload",
  "uploadHint": ", or drag & drop files or a folder",
  "uploadFormats": "Supported formats: JPEG, PNG, WebP",
  "originalLabel": "Original",
  "convertedLabel": "Converted",
  "convertingLabel": "Converting...",
  "previewLabel": "Preview",
  "targetFormatLabel": "Target Format",
  "qualityLabel": "Image Quality",
  "qualityDescription": "Lower quality results in a smaller file size.",
  "clearAllButton": "Clear All",
  "convertButton": "Convert",
  "convertAllButton": "Convert All",
  "downloadButton": "Download",
  "downloadAllButton": "Download All (.zip)",
  "removeFile": "Remove file",
  "errorNoValidFiles": "No valid image files (JPEG, PNG, WebP) were found.",
  "errorFileTooLarge": "File '{fileName}' is too large ({fileSize}). Max size is {maxSize}MB.",
  "errorTooManyFiles": "Cannot process more than {maxFiles} files at once.",
  "errorFileValidation": "File validation failed: {errors}",
  "errorCanvasContext": "Could not get canvas context.",
  "errorCreateBlob": "Failed to create Blob.",
  "errorConversionFailed": "Conversion failed. The browser may not support converting to {targetFormat}.",
  "errorLoadImage": "Could not load image for conversion.",
  "errorCreateZip": "Failed to create ZIP file.",
  "errorBrowserSupport": "Your browser does not support required features for this conversion. Please use a modern browser.",
  "errorWorkerContext": "Failed to prepare image for conversion (canvas context error).",
  "errorWorkerBlob": "Failed to generate the converted image file (blob creation error).",
  "errorWorkerGeneric": "A background conversion error occurred: {message}",
  "errorCrop": "Could not crop the image. Please try again.",
  "fileStatusPending": "Pending",
  "fileStatusConverting": "Converting",
  "fileStatusSuccess": "Success",
  "fileStatusError": "Error",
  "progressText": "{convertedCount} of {totalFiles} files converted",
  "liveRegionConversionStarted": "Conversion started for {count} files.",
  "liveRegionConversionComplete": "Conversion complete for {count} files.",
  "resizeOptionsTitle": "Resize (Optional)",
  "enableResizeLabel": "Enable",
  "widthLabel": "Width",
  "heightLabel": "Height",
  "maintainAspectRatioLabel": "Maintain aspect ratio",
  "originalDimensionsLabel": "Current: {width} x {height}px",
  "cancelButton": "Cancel",
  "modalTitleTerms": "Terms of Service",
  "modalTitleDisclaimer": "Disclaimer",
  "modalTitleHowTo": "How to Use",
  "modalContentTerms": "<p>Welcome to the Image Format Converter. By using this tool, you agree to the following terms:</p><ul class='list-disc list-inside space-y-2 mt-4'><li><strong>Privacy First:</strong> All image processing is performed directly in your browser. Your files are never uploaded to any server.</li><li><strong>Permitted Use:</strong> This tool is provided for personal and commercial use. You are responsible for ensuring you have the rights to any images you process.</li><li><strong>No Guarantees:</strong> The service is provided 'as is' without any warranties.</li></ul>",
  "modalContentDisclaimer": "<p>The Image Format Converter is provided 'as is', without warranty of any kind, express or implied.</p><ul class='list-disc list-inside space-y-2 mt-4'><li><strong>No Liability:</strong> In no event shall the creators be liable for any claim, damages, or other liability, including any loss of data, corruption of files, or other issues arising from the use of this software.</li><li><strong>Use at Your Own Risk:</strong> You are solely responsible for your data and for backing up your files.</li></ul>",
  "modalContentHowTo": "<p>Using the converter is simple. Follow these steps:</p><ol class='list-decimal list-inside space-y-2 mt-4'><li><strong>Upload Images:</strong> Click the upload area or drag and drop one or more image files (JPEG, PNG, WebP). You can also drop an entire folder.</li><li><strong>Set Conversion Options:</strong> Choose the target format, adjust the quality (for JPEG/WebP), and set optional resize or crop parameters.</li><li><strong>Convert:</strong> Click the 'Convert' button. The processing happens in your browser.</li><li><strong>Download:</strong> Once complete, download your converted files individually or as a single ZIP file for batch conversions.</li></ol>",
  "presetsTitle": "Presets",
  "saveAsPresetButton": "Save as Preset",
  "deletePresetButton": "Delete Preset",
  "presetNamePlaceholder": "e.g., Blog Thumbnail",
  "customSettingsOption": "Custom Settings",
  "saveButton": "Save",
  "confirmDeletePreset": "Are you sure you want to delete the preset '{presetName}'?",
  "presetSaveSuccess": "Preset '{presetName}' saved.",
  "presetDeleteSuccess": "Preset '{presetName}' deleted.",
  "errorPresetNameExists": "A preset with this name already exists.",
  "errorPresetNameEmpty": "Preset name cannot be empty.",
  "presetDuplicateError": "A preset with the same settings already exists."
};

const ja = {
  "_version": "7251664_no_avif_2025",
  "appTitle": "画像フォーマットコンバーター",
  "appDescription": "ブラウザでJPEG、PNG、WebP画像を瞬時に変換。",
  "footerText": "&copy; {year} Image Converter. All rights reserved.",
  "footerTerms": "利用規約",
  "footerDisclaimer": "免責事項",
  "footerHowTo": "使用方法",
  "uploadCTA": "クリックしてアップロード",
  "uploadHint": "、またはファイルやフォルダをドラッグ＆ドロップ",
  "uploadFormats": "対応形式：JPEG、PNG、WebP",
  "originalLabel": "変換前",
  "convertedLabel": "変換後",
  "convertingLabel": "変換中...",
  "previewLabel": "プレビュー",
  "targetFormatLabel": "変換後のフォーマット",
  "qualityLabel": "画質",
  "qualityDescription": "品質を下げるとファイルサイズが小さくなります。",
  "clearAllButton": "すべてクリア",
  "convertButton": "変換",
  "convertAllButton": "すべて変換",
  "downloadButton": "ダウンロード",
  "downloadAllButton": "すべてダウンロード (.zip)",
  "removeFile": "ファイルを削除",
  "errorNoValidFiles": "有効な画像ファイル（JPEG, PNG, WebP）が見つかりませんでした。",
  "errorFileTooLarge": "ファイル「{fileName}」は大きすぎます ({fileSize})。最大サイズは{maxSize}MBです。",
  "errorTooManyFiles": "{maxFiles}個を超えるファイルは一度に処理できません。",
  "errorFileValidation": "ファイル検証に失敗しました: {errors}",
  "errorCanvasContext": "Canvasコンテキストを取得できませんでした。",
  "errorCreateBlob": "Blobの作成に失敗しました。",
  "errorConversionFailed": "変換に失敗しました。お使いのブラウザは{targetFormat}への変換をサポートしていない可能性があります。",
  "errorLoadImage": "変換用の画像を読み込めませんでした。",
  "errorCreateZip": "ZIPファイルの作成に失敗しました。",
  "errorBrowserSupport": "お使いのブラウザはこの変換に必要な機能をサポートしていません。モダンなブラウザに更新してください。",
  "errorWorkerContext": "画像変換の準備に失敗しました（キャンバスコンテキストエラー）。",
  "errorWorkerBlob": "変換後の画像ファイルの生成に失敗しました（Blob作成エラー）。",
  "errorWorkerGeneric": "バックグラウンド変換エラーが発生しました: {message}",
  "errorCrop": "画像の切り抜きに失敗しました。もう一度お試しください。",
  "fileStatusPending": "待機中",
  "fileStatusConverting": "変換中",
  "fileStatusSuccess": "成功",
  "fileStatusError": "エラー",
  "progressText": "{convertedCount} / {totalFiles} 個のファイルを変換済み",
  "liveRegionConversionStarted": "{count}個のファイルの変換を開始しました。",
  "liveRegionConversionComplete": "{count}個のファイルの変換が完了しました。",
  "resizeOptionsTitle": "リサイズ (任意)",
  "enableResizeLabel": "有効にする",
  "widthLabel": "幅",
  "heightLabel": "高さ",
  "maintainAspectRatioLabel": "アスペクト比を維持",
  "originalDimensionsLabel": "現在: {width} x {height}px",
  "cancelButton": "キャンセル",
  "modalTitleTerms": "利用規約",
  "modalTitleDisclaimer": "免責事項",
  "modalTitleHowTo": "使用方法",
  "modalContentTerms": "<p>画像フォーマットコンバーターへようこそ。本ツールを使用することにより、以下の規約に同意したものとみなされます:</p><ul class='list-disc list-inside space-y-2 mt-4'><li><strong>プライバシー第一:</strong> すべての画像処理は、お使いのブラウザ内で直接実行されます。あなたのファイルがサーバーにアップロードされることは一切ありません。</li><li><strong>許可された使用:</strong> 本ツールは個人利用および商用利用のために提供されています。処理するすべての画像に対する権利を所有していることを確認する責任は、ユーザーにあります。</li><li><strong>無保証:</strong> 本サービスは、いかなる保証もなく「現状有姿」で提供されます。</li></ul>",
  "modalContentDisclaimer": "<p>画像フォーマットコンバーターは、明示または黙示を問わず、いかなる種類の保証もなく「現状有姿」で提供されます。</p><ul class='list-disc list-inside space-y-2 mt-4'><li><strong>責任の制限:</strong> いかなる場合においても、本ソフトウェアの使用に起因するデータの損失、ファイルの破損、その他の問題を含む、いかなる請求、損害、その他の責任について、作成者は責任を負わないものとします。</li><li><strong>自己責任での使用:</strong> あなたのデータとファイルのバックアップについては、あなた自身が単独で責任を負います。</li></ul>",
  "modalContentHowTo": "<p>このコンバーターの使い方は簡単です。以下の手順に従ってください:</p><ol class='list-decimal list-inside space-y-2 mt-4'><li><strong>画像のアップロード:</strong> アップロードエリアをクリックするか、1つ以上の画像ファイル（JPEG, PNG, WebP）をドラッグ＆ドロップします。フォルダごとドロップすることも可能です。</li><li><strong>変換オプションの設定:</strong> 変換後のフォーマットを選択し、画質（JPEG/WebPの場合）を調整し、任意でリサイズや切り抜きのパラメータを設定します。</li><li><strong>変換:</strong> 「変換」ボタンをクリックします。処理はブラウザ内で行われます。</li><li><strong>ダウンロード:</strong> 完了後、変換されたファイルを個別にダウンロードするか、バッチ変換の場合は単一のZIPファイルとしてダウンロードします。</li></ol>",
  "presetsTitle": "プリセット",
  "saveAsPresetButton": "プリセットとして保存",
  "deletePresetButton": "プリセットを削除",
  "presetNamePlaceholder": "例：ブログのサムネイル",
  "customSettingsOption": "カスタム設定",
  "saveButton": "保存",
  "confirmDeletePreset": "プリセット「{presetName}」を削除してもよろしいですか？",
  "presetSaveSuccess": "プリセット「{presetName}」を保存しました。",
  "presetDeleteSuccess": "プリセット「{presetName}」を削除しました。",
  "errorPresetNameExists": "この名前のプリセットは既に存在します。",
  "errorPresetNameEmpty": "プリセット名は空にできません。",
  "presetDuplicateError": "同じ設定のプリセットが既に存在します。"
};

const translations = { en, ja };

type Locale = 'en' | 'ja';
// FIX: Export TranslationKeys to be used in other modules for type safety.
export type TranslationKeys = keyof typeof en;

interface TranslationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKeys, replacements?: Record<string, string | number>) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const getInitialLocale = (): Locale => {
  if (typeof window !== 'undefined') {
    const browserLang = navigator.language.split(/[-_]/)[0];
    return browserLang === 'ja' ? 'ja' : 'en';
  }
  return 'en';
};

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocale] = useState<Locale>(getInitialLocale);

  const t = useMemo(() => (key: TranslationKeys, replacements?: Record<string, string | number>): string => {
    let translation = translations[locale][key] || translations['en'][key];
    if (replacements) {
      Object.entries(replacements).forEach(([placeholder, value]) => {
        translation = translation.replace(`{${placeholder}}`, String(value));
      });
    }
    return translation || String(key);
  }, [locale]);

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = (): TranslationContextType => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
