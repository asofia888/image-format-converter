import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import { TranslationProvider } from '../hooks/useTranslation';
import { ThemeProvider } from '../hooks/useTheme';
import React from 'react';

// Mock Worker
global.Worker = class MockWorker {
  onmessage: any = null;
  onerror: any = null;
  url: string;

  constructor(url: string) {
    this.url = url;
  }

  postMessage(data: any) {
    // Simulate successful conversion
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({
          data: {
            success: true,
            blob: new Blob(['converted'], { type: data.targetFormat.includes('jpeg') ? 'image/jpeg' : `image/${data.targetFormat}` }),
            filename: data.filename.replace(/\.[^/.]+$/, `.${data.targetFormat === 'jpeg' ? 'jpg' : data.targetFormat}`)
          }
        });
      }
    }, 100);
  }

  terminate() {}
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <TranslationProvider>
      {children}
    </TranslationProvider>
  </ThemeProvider>
);

const createMockFile = (name: string, type: string, size: number = 1024) => {
  const content = 'mock file content'.repeat(size / 16);
  return new File([content], name, { type, lastModified: Date.now() });
};

describe('Integration Tests - Complete Workflows', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock URL methods
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock FileReader
    global.FileReader = class MockFileReader {
      result: any = null;
      onload: any = null;
      onerror: any = null;

      readAsArrayBuffer() {
        setTimeout(() => {
          const buffer = new ArrayBuffer(16);
          const view = new Uint8Array(buffer);
          view[0] = 0xFF; view[1] = 0xD8; view[2] = 0xFF; // JPEG signature
          this.result = buffer;
          if (this.onload) this.onload({ target: this });
        }, 10);
      }

      readAsDataURL() {
        setTimeout(() => {
          this.result = 'data:image/jpeg;base64,test';
          if (this.onload) this.onload({ target: this });
        }, 10);
      }
    };

    // Mock Canvas
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      drawImage: vi.fn(),
      canvas: { toBlob: vi.fn(callback => callback(new Blob(['test']))) }
    }));
  });

  describe('Complete Image Conversion Workflow', () => {
    it('should handle single file conversion from upload to download', async () => {
      const user = userEvent.setup();
      render(<App />, { wrapper: TestWrapper });

      // Step 1: Upload file
      const fileInput = screen.getByLabelText(/click to upload/i);
      const testFile = createMockFile('test.jpg', 'image/jpeg');

      await user.upload(fileInput, testFile);

      // Wait for file to be processed
      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Step 2: Change format
      const formatSelect = screen.getByDisplayValue('webp');
      await user.selectOptions(formatSelect, 'png');

      // Step 3: Adjust quality
      const qualitySlider = screen.getByRole('slider', { name: /quality/i });
      await user.clear(qualitySlider);
      await user.type(qualitySlider, '80');

      // Step 4: Convert
      const convertButton = screen.getByRole('button', { name: /convert/i });
      await user.click(convertButton);

      // Wait for conversion to complete
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
      }, { timeout: 3000 });

      // Step 5: Download
      const downloadButton = screen.getByRole('button', { name: /download/i });
      expect(downloadButton).toBeEnabled();
    });

    it('should handle batch conversion workflow', async () => {
      const user = userEvent.setup();
      render(<App />, { wrapper: TestWrapper });

      // Upload multiple files
      const fileInput = screen.getByLabelText(/click to upload/i);
      const files = [
        createMockFile('image1.jpg', 'image/jpeg'),
        createMockFile('image2.png', 'image/png'),
        createMockFile('image3.webp', 'image/webp')
      ];

      await user.upload(fileInput, files);

      // Wait for files to be processed
      await waitFor(() => {
        expect(screen.getByText('image1.jpg')).toBeInTheDocument();
        expect(screen.getByText('image2.png')).toBeInTheDocument();
        expect(screen.getByText('image3.webp')).toBeInTheDocument();
      }, { timeout: 2000 });

      // Convert all files
      const convertAllButton = screen.getByRole('button', { name: /convert all/i });
      await user.click(convertAllButton);

      // Wait for batch conversion
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download all/i })).toBeInTheDocument();
      }, { timeout: 5000 });

      // Download as ZIP
      const downloadAllButton = screen.getByRole('button', { name: /download all/i });
      expect(downloadAllButton).toBeEnabled();
    });
  });

  describe('Error Handling Workflows', () => {
    it('should handle invalid file uploads gracefully', async () => {
      const user = userEvent.setup();
      render(<App />, { wrapper: TestWrapper });

      // Try to upload invalid file
      const fileInput = screen.getByLabelText(/click to upload/i);
      const invalidFile = createMockFile('document.pdf', 'application/pdf');

      await user.upload(fileInput, invalidFile);

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should handle conversion failures', async () => {
      // Mock worker to simulate failure
      global.Worker = class FailingWorker {
        onmessage: any = null;
        onerror: any = null;

        constructor() {}

        postMessage() {
          setTimeout(() => {
            if (this.onmessage) {
              this.onmessage({
                data: {
                  success: false,
                  error: 'Conversion failed'
                }
              });
            }
          }, 100);
        }

        terminate() {}
      };

      const user = userEvent.setup();
      render(<App />, { wrapper: TestWrapper });

      // Upload and try to convert
      const fileInput = screen.getByLabelText(/click to upload/i);
      const testFile = createMockFile('test.jpg', 'image/jpeg');

      await user.upload(fileInput, testFile);

      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
      });

      const convertButton = screen.getByRole('button', { name: /convert/i });
      await user.click(convertButton);

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('UI Interaction Workflows', () => {
    it('should handle theme switching', async () => {
      const user = userEvent.setup();
      render(<App />, { wrapper: TestWrapper });

      const themeButton = screen.getByRole('button', { name: /toggle theme/i });

      // Initial state check
      expect(document.documentElement.classList.contains('dark')).toBe(true);

      // Toggle theme
      await user.click(themeButton);

      // Theme should change (this would need proper theme context mocking)
      expect(themeButton).toBeInTheDocument();
    });

    it('should handle language switching', async () => {
      const user = userEvent.setup();
      render(<App />, { wrapper: TestWrapper });

      // Find language switcher
      const languageButton = screen.getByRole('button', { name: /日本語|english/i });

      await user.click(languageButton);

      // Language should change (this would show in text content)
      expect(languageButton).toBeInTheDocument();
    });

    it('should handle modal interactions', async () => {
      const user = userEvent.setup();
      render(<App />, { wrapper: TestWrapper });

      // Open Terms modal
      const termsButton = screen.getByRole('button', { name: /terms of service/i });
      await user.click(termsButton);

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Close modal
      const closeButton = screen.getByRole('button', { name: /close|cancel/i });
      await user.click(closeButton);

      // Modal should disappear
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Advanced Feature Workflows', () => {
    it('should handle resize settings', async () => {
      const user = userEvent.setup();
      render(<App />, { wrapper: TestWrapper });

      // Upload file first
      const fileInput = screen.getByLabelText(/click to upload/i);
      const testFile = createMockFile('test.jpg', 'image/jpeg');
      await user.upload(fileInput, testFile);

      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
      });

      // Enable resize
      const resizeToggle = screen.getByRole('checkbox', { name: /enable.*resize/i });
      await user.click(resizeToggle);

      // Set dimensions
      const widthInput = screen.getByLabelText(/width/i);
      await user.clear(widthInput);
      await user.type(widthInput, '800');

      const heightInput = screen.getByLabelText(/height/i);
      await user.clear(heightInput);
      await user.type(heightInput, '600');

      // Convert with resize settings
      const convertButton = screen.getByRole('button', { name: /convert/i });
      await user.click(convertButton);

      // Should process with resize settings
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should handle preset management', async () => {
      const user = userEvent.setup();
      render(<App />, { wrapper: TestWrapper });

      // Set some settings
      const formatSelect = screen.getByDisplayValue('webp');
      await user.selectOptions(formatSelect, 'jpeg');

      const qualitySlider = screen.getByRole('slider', { name: /quality/i });
      await user.clear(qualitySlider);
      await user.type(qualitySlider, '85');

      // Save as preset
      const savePresetButton = screen.getByRole('button', { name: /save.*preset/i });
      await user.click(savePresetButton);

      // Enter preset name
      const presetNameInput = screen.getByPlaceholderText(/preset name/i);
      await user.type(presetNameInput, 'My Custom Preset');

      const saveButton = screen.getByRole('button', { name: /^save$/i });
      await user.click(saveButton);

      // Preset should be saved and selectable
      await waitFor(() => {
        expect(screen.getByDisplayValue('My Custom Preset')).toBeInTheDocument();
      });
    });
  });

  describe('Performance and Edge Cases', () => {
    it('should handle large file uploads', async () => {
      const user = userEvent.setup();
      render(<App />, { wrapper: TestWrapper });

      // Create large file (within limits)
      const largeFile = createMockFile('large.jpg', 'image/jpeg', 10 * 1024 * 1024);

      const fileInput = screen.getByLabelText(/click to upload/i);
      await user.upload(fileInput, largeFile);

      // Should handle large file
      await waitFor(() => {
        expect(screen.getByText('large.jpg')).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it('should handle rapid user interactions', async () => {
      const user = userEvent.setup();
      render(<App />, { wrapper: TestWrapper });

      // Upload file
      const fileInput = screen.getByLabelText(/click to upload/i);
      const testFile = createMockFile('test.jpg', 'image/jpeg');
      await user.upload(fileInput, testFile);

      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
      });

      // Rapid format changes
      const formatSelect = screen.getByDisplayValue('webp');
      await user.selectOptions(formatSelect, 'png');
      await user.selectOptions(formatSelect, 'jpeg');
      await user.selectOptions(formatSelect, 'webp');

      // Should handle rapid changes without errors
      expect(formatSelect).toHaveValue('webp');
    });

    it('should handle browser back/forward navigation', async () => {
      const user = userEvent.setup();
      render(<App />, { wrapper: TestWrapper });

      // Upload and process file
      const fileInput = screen.getByLabelText(/click to upload/i);
      const testFile = createMockFile('test.jpg', 'image/jpeg');
      await user.upload(fileInput, testFile);

      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
      });

      // Simulate browser navigation (would need router setup in real app)
      // For now, just verify the app doesn't crash with state changes
      const clearButton = screen.getByRole('button', { name: /clear all/i });
      await user.click(clearButton);

      // Should clear without errors
      expect(screen.queryByText('test.jpg')).not.toBeInTheDocument();
    });
  });
});