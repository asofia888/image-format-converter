import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock FileReader
global.FileReader = class {
  result: any = null;
  error: any = null;
  onload: any = null;
  onerror: any = null;

  readAsArrayBuffer(file: any) {
    // Mock valid JPEG signature
    const mockArrayBuffer = new ArrayBuffer(16);
    const mockUint8Array = new Uint8Array(mockArrayBuffer);
    mockUint8Array[0] = 0xFF;
    mockUint8Array[1] = 0xD8;
    mockUint8Array[2] = 0xFF;

    setTimeout(() => {
      this.result = mockArrayBuffer;
      if (this.onload) this.onload({ target: this } as any);
    }, 10);
  }

  readAsDataURL(file: any) {
    setTimeout(() => {
      this.result = 'data:image/jpeg;base64,test';
      if (this.onload) this.onload({ target: this } as any);
    }, 10);
  }
};

// Mock URL.createObjectURL
global.URL = {
  ...global.URL,
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
};

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = vi.fn((type) => {
  if (type === '2d') {
    return {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({
        data: new Uint8ClampedArray(4),
        width: 1,
        height: 1
      })),
      putImageData: vi.fn(),
      canvas: {
        width: 100,
        height: 100,
        toBlob: vi.fn((callback) => {
          callback(new Blob(['mock'], { type: 'image/jpeg' }));
        })
      }
    };
  }
  return null;
});

// Mock Worker
global.Worker = class MockWorker {
  onmessage: any = null;
  onerror: any = null;

  constructor(url: string) {}

  postMessage(data: any) {
    // Mock successful conversion
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({
          data: {
            success: true,
            blob: new Blob(['mock'], { type: 'image/jpeg' }),
            filename: 'test.jpg'
          }
        });
      }
    }, 10);
  }

  terminate() {}
};