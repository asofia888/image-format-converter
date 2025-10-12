import { useEffect } from 'react';

interface KeyboardShortcutHandlers {
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onOpen?: () => void;
  onClear?: () => void;
}

/**
 * Custom hook for handling keyboard shortcuts
 * Supports common shortcuts like Ctrl+Z (undo), Ctrl+Y (redo), etc.
 *
 * @example
 * useKeyboardShortcuts({
 *   onUndo: () => undo(),
 *   onRedo: () => redo(),
 *   onSave: () => download()
 * });
 */
export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onSave,
  onOpen,
  onClear,
}: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      // Ignore if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Ctrl/Cmd + Z: Undo
      if (ctrlKey && e.key === 'z' && !e.shiftKey && onUndo) {
        e.preventDefault();
        onUndo();
        return;
      }

      // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y: Redo
      if (
        ((ctrlKey && e.key === 'z' && e.shiftKey) ||
          (ctrlKey && e.key === 'y')) &&
        onRedo
      ) {
        e.preventDefault();
        onRedo();
        return;
      }

      // Ctrl/Cmd + S: Save/Download
      if (ctrlKey && e.key === 's' && onSave) {
        e.preventDefault();
        onSave();
        return;
      }

      // Ctrl/Cmd + O: Open file dialog
      if (ctrlKey && e.key === 'o' && onOpen) {
        e.preventDefault();
        onOpen();
        return;
      }

      // Escape: Clear
      if (e.key === 'Escape' && onClear) {
        e.preventDefault();
        onClear();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onUndo, onRedo, onSave, onOpen, onClear]);
}
