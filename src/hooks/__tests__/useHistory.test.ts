import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHistory } from '../useHistory';

describe('useHistory', () => {
  it('should initialize with initial state', () => {
    const { result } = renderHook(() =>
      useHistory({ initialState: { count: 0 } })
    );

    expect(result.current.state).toEqual({ count: 0 });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should add new state to history', () => {
    const { result } = renderHook(() =>
      useHistory({ initialState: { count: 0 } })
    );

    act(() => {
      result.current.setState({ count: 1 });
    });

    expect(result.current.state).toEqual({ count: 1 });
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should support undo functionality', () => {
    const { result } = renderHook(() =>
      useHistory({ initialState: { count: 0 } })
    );

    act(() => {
      result.current.setState({ count: 1 });
      result.current.setState({ count: 2 });
    });

    expect(result.current.state).toEqual({ count: 2 });

    act(() => {
      result.current.undo();
    });

    expect(result.current.state).toEqual({ count: 1 });
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(true);
  });

  it('should support redo functionality', () => {
    const { result } = renderHook(() =>
      useHistory({ initialState: { count: 0 } })
    );

    act(() => {
      result.current.setState({ count: 1 });
      result.current.setState({ count: 2 });
      result.current.undo();
    });

    expect(result.current.state).toEqual({ count: 1 });

    act(() => {
      result.current.redo();
    });

    expect(result.current.state).toEqual({ count: 2 });
    expect(result.current.canRedo).toBe(false);
  });

  it('should clear future history when setting new state after undo', () => {
    const { result } = renderHook(() =>
      useHistory({ initialState: { count: 0 } })
    );

    act(() => {
      result.current.setState({ count: 1 });
      result.current.setState({ count: 2 });
      result.current.undo();
      result.current.setState({ count: 3 });
    });

    expect(result.current.state).toEqual({ count: 3 });
    expect(result.current.canRedo).toBe(false);
  });

  it('should not add duplicate states', () => {
    const { result } = renderHook(() =>
      useHistory({ initialState: { count: 0 } })
    );

    act(() => {
      result.current.setState({ count: 1 });
      result.current.setState({ count: 1 });
    });

    expect(result.current.historySize).toBe(2); // Initial + 1 change
  });

  it('should respect maxHistorySize', () => {
    const { result } = renderHook(() =>
      useHistory({ initialState: { count: 0 }, maxHistorySize: 3 })
    );

    act(() => {
      result.current.setState({ count: 1 });
      result.current.setState({ count: 2 });
      result.current.setState({ count: 3 });
      result.current.setState({ count: 4 });
    });

    expect(result.current.historySize).toBe(3);
    expect(result.current.state).toEqual({ count: 4 });
  });

  it('should support function setState', () => {
    const { result } = renderHook(() =>
      useHistory({ initialState: { count: 0 } })
    );

    act(() => {
      result.current.setState((prev) => ({ count: prev.count + 1 }));
    });

    expect(result.current.state).toEqual({ count: 1 });
  });

  it('should clear history', () => {
    const { result } = renderHook(() =>
      useHistory({ initialState: { count: 0 } })
    );

    act(() => {
      result.current.setState({ count: 1 });
      result.current.setState({ count: 2 });
      result.current.clear();
    });

    expect(result.current.state).toEqual({ count: 0 });
    expect(result.current.historySize).toBe(1);
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should not undo when at the beginning', () => {
    const { result } = renderHook(() =>
      useHistory({ initialState: { count: 0 } })
    );

    const initialState = result.current.state;

    act(() => {
      result.current.undo();
    });

    expect(result.current.state).toEqual(initialState);
  });

  it('should not redo when at the end', () => {
    const { result } = renderHook(() =>
      useHistory({ initialState: { count: 0 } })
    );

    act(() => {
      result.current.setState({ count: 1 });
    });

    const currentState = result.current.state;

    act(() => {
      result.current.redo();
    });

    expect(result.current.state).toEqual(currentState);
  });
});
