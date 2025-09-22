import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '../../test/test-utils';
import { useImageConverter } from '../useImageConverter';
import { createMockFile } from '../../test/test-utils';

// Mock the worker
vi.mock('../../workers/converter.worker.ts?worker', () => ({
  default: class MockWorker {
    constructor() {}
    postMessage = vi.fn();
    terminate = vi.fn();
    onmessage: ((event: MessageEvent) => void) | null = null;
  },
}));

describe('useImageConverter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useImageConverter());

    expect(result.current.files).toEqual([]);
    expect(result.current.targetFormat).toBe('webp');
    expect(result.current.quality).toBe(0.9);
    expect(result.current.appStatus).toBe('idle');
    expect(result.current.error).toBeNull();
    expect(result.current.isConverting).toBe(false);
    expect(result.current.isDownloadReady).toBe(false);
  });

  it('should handle file selection', () => {
    const { result } = renderHook(() => useImageConverter());

    const files = [createMockFile('test.jpg', 1024, 'image/jpeg')];

    act(() => {
      result.current.handleFilesSelect(files);
    });

    expect(result.current.files).toHaveLength(1);
    expect(result.current.files[0].file.name).toBe('test.jpg');
  });

  it('should update target format', () => {
    const { result } = renderHook(() => useImageConverter());

    act(() => {
      result.current.setTargetFormat('png');
    });

    expect(result.current.targetFormat).toBe('png');
  });

  it('should update quality', () => {
    const { result } = renderHook(() => useImageConverter());

    act(() => {
      result.current.setQuality(0.8);
    });

    expect(result.current.quality).toBe(0.8);
  });

  it('should reset state', () => {
    const { result } = renderHook(() => useImageConverter());

    // First add some files
    act(() => {
      result.current.handleFilesSelect([createMockFile('test.jpg', 1024, 'image/jpeg')]);
    });

    expect(result.current.files).toHaveLength(1);

    // Then reset
    act(() => {
      result.current.resetState();
    });

    expect(result.current.files).toEqual([]);
    expect(result.current.appStatus).toBe('idle');
    expect(result.current.error).toBeNull();
  });

  it('should handle resize config updates', () => {
    const { result } = renderHook(() => useImageConverter());

    const newConfig = {
      enabled: true,
      width: '800',
      height: '600',
      unit: 'px' as const,
      maintainAspectRatio: false,
    };

    act(() => {
      result.current.setResizeConfig(newConfig);
    });

    expect(result.current.resizeConfig).toEqual(newConfig);
  });

  it('should determine batch mode correctly', () => {
    const { result } = renderHook(() => useImageConverter());

    // Single file - not batch mode
    act(() => {
      result.current.handleFilesSelect([createMockFile('test.jpg', 1024, 'image/jpeg')]);
    });

    expect(result.current.isBatchMode).toBe(false);

    // Multiple files - batch mode
    act(() => {
      result.current.handleFilesSelect([
        createMockFile('test1.jpg', 1024, 'image/jpeg'),
        createMockFile('test2.jpg', 1024, 'image/jpeg'),
      ]);
    });

    expect(result.current.isBatchMode).toBe(true);
  });

  it('should persist settings to localStorage', () => {
    const { result } = renderHook(() => useImageConverter());

    act(() => {
      result.current.setTargetFormat('png');
      result.current.setQuality(0.8);
    });

    // Check that settings are saved to localStorage
    const savedSettings = localStorage.getItem('imageConverterSettings');
    expect(savedSettings).toBeTruthy();

    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      expect(parsed.targetFormat).toBe('png');
      expect(parsed.quality).toBe(0.8);
    }
  });

  it('should load settings from localStorage', () => {
    // Pre-populate localStorage
    localStorage.setItem('imageConverterSettings', JSON.stringify({
      targetFormat: 'jpeg',
      quality: 0.7,
      resizeConfig: {
        enabled: true,
        width: '1000',
        height: '',
        unit: 'px',
        maintainAspectRatio: true,
      },
    }));

    const { result } = renderHook(() => useImageConverter());

    expect(result.current.targetFormat).toBe('jpeg');
    expect(result.current.quality).toBe(0.7);
    expect(result.current.resizeConfig.enabled).toBe(true);
    expect(result.current.resizeConfig.width).toBe('1000');
  });
});