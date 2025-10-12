import { useState, useCallback } from 'react';

interface UseHistoryOptions<T> {
  maxHistorySize?: number;
  initialState: T;
}

interface UseHistoryReturn<T> {
  state: T;
  setState: (newState: T | ((prevState: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
  historySize: number;
}

/**
 * Custom hook for managing state with undo/redo functionality
 *
 * @example
 * const { state, setState, undo, redo, canUndo, canRedo } = useHistory({
 *   initialState: { files: [], format: 'webp' }
 * });
 */
export function useHistory<T>({
  maxHistorySize = 50,
  initialState,
}: UseHistoryOptions<T>): UseHistoryReturn<T> {
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const state = history[currentIndex];
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const setState = useCallback((newState: T | ((prevState: T) => T)) => {
    setHistory((prevHistory) => {
      const currentState = prevHistory[currentIndex];
      const nextState = typeof newState === 'function'
        ? (newState as (prevState: T) => T)(currentState)
        : newState;

      // Don't add to history if state hasn't changed
      if (JSON.stringify(nextState) === JSON.stringify(currentState)) {
        return prevHistory;
      }

      // Remove all future states when setting new state
      const newHistory = prevHistory.slice(0, currentIndex + 1);
      newHistory.push(nextState);

      // Limit history size
      if (newHistory.length > maxHistorySize) {
        newHistory.shift();
        setCurrentIndex(currentIndex); // Adjust index after shift
        return newHistory;
      }

      setCurrentIndex(newHistory.length - 1);
      return newHistory;
    });
  }, [currentIndex, maxHistorySize]);

  const undo = useCallback(() => {
    if (canUndo) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [canRedo]);

  const clear = useCallback(() => {
    setHistory([initialState]);
    setCurrentIndex(0);
  }, [initialState]);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    clear,
    historySize: history.length,
  };
}
