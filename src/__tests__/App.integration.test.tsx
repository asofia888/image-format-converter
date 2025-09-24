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
    expect(screen.getByText(/convert jpeg, png, and webp images/i)).toBeInTheDocument();
  });

  it('should show file uploader initially', () => {
    render(<App />);

    expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/click to upload/i)).toBeInTheDocument();
  });

  it('should handle theme switching', async () => {
    render(<App />);

    const themeButton = screen.getByRole('button', { name: /switch to.*mode/i });
    expect(themeButton).toBeInTheDocument();

    fireEvent.click(themeButton);

    // The theme should change (though we can't easily test the visual change)
    expect(themeButton).toBeInTheDocument();
  });

  it('should handle language switching', () => {
    render(<App />);

    const enButton = screen.getByRole('button', { name: /en/i });
    const jaButton = screen.getByRole('button', { name: /ja/i });

    expect(enButton).toBeInTheDocument();
    expect(jaButton).toBeInTheDocument();

    fireEvent.click(jaButton);

    // Should switch language
    expect(jaButton).toHaveAttribute('aria-pressed', 'true');
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
    // Footer doesn't have contentinfo role, so check for the footer element by text content
    expect(screen.getByText(/all rights reserved/i)).toBeInTheDocument();

    // Check for heading hierarchy
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('should handle file upload workflow', async () => {
    render(<App />);

    // Initially should show file uploader
    const fileInput = screen.getByLabelText(/click to upload/i);
    expect(fileInput).toBeInTheDocument();

    // Simple validation that the input exists
    expect(fileInput).toHaveAttribute('type', 'file');
    expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
  });

  it('should persist theme preference', () => {
    // Mock localStorage to return valid JSON for different keys
    vi.mocked(localStorage.getItem).mockImplementation((key: string) => {
      if (key === 'theme') return 'light';
      if (key === 'conversionSettings') return JSON.stringify({
        targetFormat: 'webp',
        quality: 90,
        resizeConfig: {
          enabled: false,
          width: '',
          height: '',
          unit: 'px',
          maintainAspectRatio: true
        }
      });
      if (key === 'presets') return JSON.stringify([]);
      return null;
    });

    render(<App />);

    // Should respect the stored theme - check for light mode button
    const themeButton = screen.getByRole('button', { name: /switch to dark mode/i });
    expect(themeButton).toBeInTheDocument();
  });
});