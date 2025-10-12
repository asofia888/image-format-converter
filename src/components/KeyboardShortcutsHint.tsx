import React, { useState } from 'react';
import Icon from './Icon';

const KeyboardShortcutsHint: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { keys: ['Ctrl', 'Z'], description: '元に戻す（Undo）', mac: ['⌘', 'Z'] },
    { keys: ['Ctrl', 'Y'], description: 'やり直し（Redo）', mac: ['⌘', 'Y'] },
    { keys: ['Ctrl', '⇧', 'Z'], description: 'やり直し（Redo）', mac: ['⌘', '⇧', 'Z'] },
    { keys: ['Ctrl', 'S'], description: 'ダウンロード', mac: ['⌘', 'S'] },
    { keys: ['Ctrl', 'O'], description: 'ファイルを開く', mac: ['⌘', 'O'] },
    { keys: ['Esc'], description: 'すべてクリア', mac: ['Esc'] },
  ];

  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Hint Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-800 dark:bg-slate-700 text-white p-3 rounded-full shadow-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
        title="キーボードショートカット"
        aria-label="キーボードショートカット"
      >
        <Icon name="info" className="w-5 h-5" />
      </button>

      {/* Shortcuts Popup */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          {/* Popup Content */}
          <div className="absolute bottom-16 right-0 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-700 p-4 w-80">
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                キーボードショートカット
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <Icon name="close" className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-slate-600 dark:text-slate-400">
                    {shortcut.description}
                  </span>
                  <div className="flex gap-1">
                    {(isMac ? shortcut.mac : shortcut.keys).map((key, keyIndex) => (
                      <kbd
                        key={keyIndex}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded text-xs font-mono border border-slate-300 dark:border-slate-600"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
              ※入力フィールド外で使用できます
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default KeyboardShortcutsHint;
