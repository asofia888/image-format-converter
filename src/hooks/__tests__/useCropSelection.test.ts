import { describe, it, expect } from 'vitest';
import { renderHook, act } from '../../test/test-utils';
import { useCropSelection } from '../useCropSelection';

describe('useCropSelection', () => {
  const mockImageDimensions = { width: 800, height: 600 };

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useCropSelection(mockImageDimensions));

    expect(result.current.selectionBox).toEqual({
      x: 0,
      y: 0,
      width: 200,
      height: 200,
    });
    expect(result.current.isSelecting).toBe(false);
  });

  it('should handle mouse down to start selection', () => {
    const { result } = renderHook(() => useCropSelection(mockImageDimensions));

    act(() => {
      result.current.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent);
    });

    expect(result.current.isSelecting).toBe(true);
  });

  it('should update selection box during mouse move', () => {
    const { result } = renderHook(() => useCropSelection(mockImageDimensions));

    // Start selection
    act(() => {
      result.current.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent);
    });

    // Move mouse to create selection
    act(() => {
      result.current.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent);
    });

    expect(result.current.selectionBox.width).toBeGreaterThan(0);
    expect(result.current.selectionBox.height).toBeGreaterThan(0);
  });

  it('should maintain aspect ratio when constrainAspectRatio is true', () => {
    const { result } = renderHook(() => useCropSelection(mockImageDimensions, 1.5, true));

    act(() => {
      result.current.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent);
    });

    act(() => {
      result.current.handleMouseMove({ clientX: 250, clientY: 200 } as MouseEvent);
    });

    const { width, height } = result.current.selectionBox;
    const ratio = width / height;
    expect(Math.abs(ratio - 1.5)).toBeLessThan(0.1); // Allow small tolerance
  });

  it('should complete selection on mouse up', () => {
    const { result } = renderHook(() => useCropSelection(mockImageDimensions));

    act(() => {
      result.current.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent);
    });

    act(() => {
      result.current.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent);
    });

    act(() => {
      result.current.handleMouseUp();
    });

    expect(result.current.isSelecting).toBe(false);
  });

  it('should constrain selection within image bounds', () => {
    const { result } = renderHook(() => useCropSelection(mockImageDimensions));

    act(() => {
      result.current.handleMouseDown({ clientX: 700, clientY: 500 } as MouseEvent);
    });

    act(() => {
      result.current.handleMouseMove({ clientX: 1000, clientY: 800 } as MouseEvent);
    });

    const { x, y, width, height } = result.current.selectionBox;
    expect(x + width).toBeLessThanOrEqual(mockImageDimensions.width);
    expect(y + height).toBeLessThanOrEqual(mockImageDimensions.height);
  });

  it('should reset selection', () => {
    const { result } = renderHook(() => useCropSelection(mockImageDimensions));

    // Create a selection
    act(() => {
      result.current.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent);
    });

    act(() => {
      result.current.handleMouseMove({ clientX: 300, clientY: 250 } as MouseEvent);
    });

    // Reset
    act(() => {
      result.current.resetSelection();
    });

    expect(result.current.selectionBox).toEqual({
      x: 0,
      y: 0,
      width: 200,
      height: 200,
    });
    expect(result.current.isSelecting).toBe(false);
  });
});