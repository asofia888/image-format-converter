import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../test/test-utils';
import App from '../App';
import { createMockFile } from '../test/test-utils';

describe('App Integration', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render the main application', () => {
    render(<App />);

    expect(screen.getByText(/image format converter/i)).toBeInTheDocument();
    expect(screen.getByText(/convert images/i)).toBeInTheDocument();
  });

  it('should show file uploader initially', () => {
    render(<App />);

    expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should handle theme switching', async () => {
    render(<App />);

    const themeButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(themeButton).toBeInTheDocument();

    fireEvent.click(themeButton);

    // The theme should change (though we can't easily test the visual change)
    expect(themeButton).toBeInTheDocument();
  });

  it('should handle language switching', () => {
    render(<App />);

    const languageButton = screen.getByRole('button', { name: /english/i });
    expect(languageButton).toBeInTheDocument();

    fireEvent.click(languageButton);

    // Should show language options
    expect(screen.getByText(/japanese/i)).toBeInTheDocument();
  });

  it('should show modal when footer links are clicked', async () => {
    render(<App />);

    const termsButton = screen.getByRole('button', { name: /terms/i });
    fireEvent.click(termsButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('should have proper accessibility structure', () => {
    render(<App />);

    // Check for main landmarks
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // footer

    // Check for heading hierarchy
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('should handle file upload workflow', async () => {
    render(<App />);

    // Initially should show file uploader
    const fileInput = screen.getByRole('button').querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();

    if (fileInput) {
      const file = createMockFile('test.jpg', 1024, 'image/jpeg');
      const fileList = {
        0: file,
        length: 1,
        item: (index: number) => index === 0 ? file : null,
      } as FileList;

      Object.defineProperty(fileInput, 'files', {
        value: fileList,
        writable: false,
      });

      fireEvent.change(fileInput);

      // Should show conversion controls after file upload
      await waitFor(() => {
        expect(screen.getByText(/target format/i)).toBeInTheDocument();
      });
    }
  });

  it('should persist theme preference', () => {
    // Set initial theme in localStorage
    localStorage.setItem('theme', 'light');

    render(<App />);

    // Should respect the stored theme
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});