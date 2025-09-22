import '@testing-library/jest-dom';

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock FileReader
global.FileReader = class FileReader {
  result: string | ArrayBuffer | null = null;
  readAsDataURL = vi.fn(function(this: FileReader) {
    this.result = 'data:image/png;base64,mockbase64';
    if (this.onload) this.onload({} as ProgressEvent<FileReader>);
  });
  onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => any) | null = null;
} as any;

// Mock OffscreenCanvas for Worker tests
global.OffscreenCanvas = class OffscreenCanvas {
  constructor(public width: number, public height: number) {}
  getContext() {
    return {
      drawImage: vi.fn(),
      getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
    };
  }
  convertToBlob = vi.fn(() => Promise.resolve(new Blob()));
} as any;

// Mock createImageBitmap
global.createImageBitmap = vi.fn(() =>
  Promise.resolve({
    width: 100,
    height: 100,
    close: vi.fn(),
  } as ImageBitmap)
);

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;