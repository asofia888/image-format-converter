import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '../../test/test-utils';
import { useCropPositioning } from '../useCropPositioning';

describe('useCropPositioning', () => {
  const mockImageDimensions = { width: 800, height: 600 };
  const mockCropBox = { x: 100, y: 100, width: 200, height: 150 };

  it('should initialize with correct positioning mode', () => {
    const { result } = renderHook(() =>
      useCropPositioning(mockImageDimensions, mockCropBox, () => {})
    );

    expect(result.current.isPositioning).toBe(false);
    expect(result.current.isDragging).toBe(false);
  });

  it('should enter positioning mode on double click', () => {
    const { result } = renderHook(() =>
      useCropPositioning(mockImageDimensions, mockCropBox, () => {})
    );

    act(() => {
      result.current.handleDoubleClick();
    });

    expect(result.current.isPositioning).toBe(true);
  });

  it('should exit positioning mode on outside click', () => {
    const { result } = renderHook(() =>
      useCropPositioning(mockImageDimensions, mockCropBox, () => {})
    );

    // Enter positioning mode
    act(() => {
      result.current.handleDoubleClick();
    });

    expect(result.current.isPositioning).toBe(true);

    // Click outside
    act(() => {
      result.current.handleOutsideClick();
    });

    expect(result.current.isPositioning).toBe(false);
  });

  it('should start dragging on mouse down in positioning mode', () => {
    const { result } = renderHook(() =>
      useCropPositioning(mockImageDimensions, mockCropBox, () => {})
    );

    // Enter positioning mode
    act(() => {
      result.current.handleDoubleClick();
    });

    // Start dragging
    act(() => {
      result.current.handleMouseDown({ clientX: 150, clientY: 125 } as MouseEvent);
    });

    expect(result.current.isDragging).toBe(true);
  });

  it('should update position during drag', () => {
    const mockOnUpdate = vi.fn();
    const { result } = renderHook(() =>
      useCropPositioning(mockImageDimensions, mockCropBox, mockOnUpdate)
    );

    // Enter positioning mode and start dragging
    act(() => {
      result.current.handleDoubleClick();
    });

    act(() => {
      result.current.handleMouseDown({ clientX: 150, clientY: 125 } as MouseEvent);
    });

    // Drag to new position
    act(() => {
      result.current.handleMouseMove({ clientX: 200, clientY: 175 } as MouseEvent);
    });

    expect(mockOnUpdate).toHaveBeenCalled();
    const lastCall = mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1][0];
    expect(lastCall.x).toBe(150); // 100 + (200 - 150)
    expect(lastCall.y).toBe(150); // 100 + (175 - 125)
  });

  it('should constrain position within image bounds', () => {
    const mockOnUpdate = vi.fn();
    const { result } = renderHook(() =>
      useCropPositioning(mockImageDimensions, mockCropBox, mockOnUpdate)
    );

    // Enter positioning mode and start dragging
    act(() => {
      result.current.handleDoubleClick();
    });

    act(() => {
      result.current.handleMouseDown({ clientX: 150, clientY: 125 } as MouseEvent);
    });

    // Try to drag beyond bounds
    act(() => {
      result.current.handleMouseMove({ clientX: 1000, clientY: 800 } as MouseEvent);
    });

    expect(mockOnUpdate).toHaveBeenCalled();
    const lastCall = mockOnUpdate.mock.calls[mockOnUpdate.mock.calls.length - 1][0];

    // Should be constrained within bounds
    expect(lastCall.x + mockCropBox.width).toBeLessThanOrEqual(mockImageDimensions.width);
    expect(lastCall.y + mockCropBox.height).toBeLessThanOrEqual(mockImageDimensions.height);
    expect(lastCall.x).toBeGreaterThanOrEqual(0);
    expect(lastCall.y).toBeGreaterThanOrEqual(0);
  });

  it('should stop dragging on mouse up', () => {
    const { result } = renderHook(() =>
      useCropPositioning(mockImageDimensions, mockCropBox, () => {})
    );

    // Enter positioning mode and start dragging
    act(() => {
      result.current.handleDoubleClick();
    });

    act(() => {
      result.current.handleMouseDown({ clientX: 150, clientY: 125 } as MouseEvent);
    });

    expect(result.current.isDragging).toBe(true);

    // Stop dragging
    act(() => {
      result.current.handleMouseUp();
    });

    expect(result.current.isDragging).toBe(false);
  });

  it('should not drag when not in positioning mode', () => {
    const mockOnUpdate = vi.fn();
    const { result } = renderHook(() =>
      useCropPositioning(mockImageDimensions, mockCropBox, mockOnUpdate)
    );

    // Try to start dragging without positioning mode
    act(() => {
      result.current.handleMouseDown({ clientX: 150, clientY: 125 } as MouseEvent);
    });

    act(() => {
      result.current.handleMouseMove({ clientX: 200, clientY: 175 } as MouseEvent);
    });

    expect(mockOnUpdate).not.toHaveBeenCalled();
    expect(result.current.isDragging).toBe(false);
  });
});