import React, { createContext, useState, useContext, useMemo } from 'react';

// Embed translations to avoid module loading issues
const en = {
  "appTitle": "Image Format Converter",
  "appDescription": "Convert JPEG, PNG, and WebP images instantly in your browser.",
  "footerText": "&copy; {year} Image Converter. All rights reserved.",
  "uploadCTA": "Click to upload",
  "uploadHint": ", or drag & drop files or a folder",
  "uploadFormats": "JPEG, PNG, or WebP",
  "originalLabel": "Original",
  "convertedLabel": "Converted",
  "convertingLabel": "Converting...",
  "previewLabel": "Preview",
  "targetFormatLabel": "Target Format",
  "qualityLabel": "Quality ({quality}%)",
  "clearAllButton": "Clear All",
  "convertButton": "Convert",
  "convertAllButton": "Convert All",
  "downloadButton": "Download",
  "downloadAllButton": "Download All (.zip)",
  "errorNoValidFiles": "No valid image files (JPEG, PNG, WebP) were found.",
  "errorCanvasContext": "Could not get canvas context.",
  "errorCreateBlob": "Failed to create Blob.",
  "errorConversionFailed": "Conversion failed. The browser may not support converting to {targetFormat}.",
  "errorLoadImage": "Could not load image for conversion.",
  "errorCreateZip": "Failed to create ZIP file.",
  "errorBrowserSupport": "Your browser does not support required features for this conversion. Please use a modern browser.",
  "errorWorker": "A critical error occurred in the background conversion process. Details: {message}",
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
  "originalDimensionsLabel": "Original: {width} x {height}px"
};

const ja = {
  "appTitle": "画像フォーマットコンバーター",
  "appDescription": "ブラウザでJPEG、PNG、WebP画像を瞬時に変換します。",
  "footerText": "&copy; {year} Image Converter. All rights reserved.",
  "uploadCTA": "クリックしてアップロード",
  "uploadHint": "、またはファイルやフォルダをドラッグ＆ドロップ",
  "uploadFormats": "JPEG, PNG, または WebP",
  "originalLabel": "変換前",
  "convertedLabel": "変換後",
  "convertingLabel": "変換中...",
  "previewLabel": "プレビュー",
  "targetFormatLabel": "変換後のフォーマット",
  "qualityLabel": "画質 ({quality}%)",
  "clearAllButton": "すべてクリア",
  "convertButton": "変換",
  "convertAllButton": "すべて変換",
  "downloadButton": "ダウンロード",
  "downloadAllButton": "すべてダウンロード (.zip)",
  "errorNoValidFiles": "有効な画像ファイル（JPEG, PNG, WebP）が見つかりませんでした。",
  "errorCanvasContext": "Canvasコンテキストを取得できませんでした。",
  "errorCreateBlob": "Blobの作成に失敗しました。",
  "errorConversionFailed": "変換に失敗しました。お使いのブラウザは{targetFormat}への変換をサポートしていない可能性があります。",
  "errorLoadImage": "変換用の画像を読み込めませんでした。",
  "errorCreateZip": "ZIPファイルの作成に失敗しました。",
  "errorBrowserSupport": "お使いのブラウザはこの変換に必要な機能をサポートしていません。モダンなブラウザに更新してください。",
  "errorWorker": "バックグラウンドでの変換処理中に重大なエラーが発生しました。詳細: {message}",
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
  "originalDimensionsLabel": "元画像: {width} x {height}px"
};


const translations = { en, ja };

type Locale = 'en' | 'ja';
type Translations = typeof en;

interface TranslationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
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

  const t = useMemo(() => (key: keyof Translations, replacements?: Record<string, string | number>): string => {
    // A type assertion to allow string indexing on the translations object
    const typedTranslations = translations as Record<Locale, Record<string, string>>;
    
    let translation = typedTranslations[locale][key] || typedTranslations['en'][key];
    if (replacements) {
      Object.keys(replacements).forEach(placeholder => {
        translation = translation.replace(`{${placeholder}}`, String(replacements[placeholder]));
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