import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import App from '../../App';
import { TranslationProvider } from '../../hooks/useTranslation';
import { ThemeProvider } from '../../hooks/useTheme';
import React from 'react';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <TranslationProvider>
      {children}
    </TranslationProvider>
  </ThemeProvider>
);

describe('Accessibility Tests', () => {
  it('should not have any accessibility violations on main app', async () => {
    const { container } = render(<App />, { wrapper: TestWrapper });
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading hierarchy', () => {
    render(<App />, { wrapper: TestWrapper });

    // Check for main heading
    const mainHeading = screen.getByRole('heading', { level: 1 });
    expect(mainHeading).toBeInTheDocument();
    expect(mainHeading).toHaveTextContent('WebP Magic');
  });

  it('should have proper landmark roles', () => {
    render(<App />, { wrapper: TestWrapper });

    // Check for main content area
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();

    // Check for footer
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  it('should have keyboard navigation support', () => {
    render(<App />, { wrapper: TestWrapper });

    // All interactive elements should be focusable
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('tabindex', expect.any(String));
    });
  });

  it('should have proper ARIA labels for icon buttons', () => {
    render(<App />, { wrapper: TestWrapper });

    // Theme switcher should have aria-label
    const themeButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(themeButton).toHaveAttribute('aria-label');
  });

  it('should have proper form labels and associations', () => {
    render(<App />, { wrapper: TestWrapper });

    // File input should have proper labeling
    const fileInput = screen.getByLabelText(/click to upload/i);
    expect(fileInput).toBeInTheDocument();
  });

  it('should have proper color contrast in both themes', async () => {
    // Test dark theme
    const { container: darkContainer } = render(
      <div className="dark">
        <App />
      </div>,
      { wrapper: TestWrapper }
    );

    const darkResults = await axe(darkContainer, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
    expect(darkResults).toHaveNoViolations();

    // Test light theme
    const { container: lightContainer } = render(
      <div className="">
        <App />
      </div>,
      { wrapper: TestWrapper }
    );

    const lightResults = await axe(lightContainer, {
      rules: {
        'color-contrast': { enabled: true }
      }
    });
    expect(lightResults).toHaveNoViolations();
  });

  it('should announce important state changes to screen readers', () => {
    render(<App />, { wrapper: TestWrapper });

    // Check for live region for status updates
    const liveRegion = screen.getByRole('status', { hidden: true });
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('should have descriptive error messages', () => {
    render(<App />, { wrapper: TestWrapper });

    // Error messages should be associated with relevant controls
    // This would be tested with actual error states in integration tests
    const errorElements = screen.queryAllByRole('alert');
    errorElements.forEach(error => {
      expect(error).toHaveAttribute('aria-live');
    });
  });

  it('should support high contrast mode', async () => {
    // Simulate high contrast mode
    const { container } = render(
      <div style={{ filter: 'contrast(200%)' }}>
        <App />
      </div>,
      { wrapper: TestWrapper }
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper focus management for modals', () => {
    render(<App />, { wrapper: TestWrapper });

    // Modal triggers should be properly labeled
    const modalTriggers = screen.getAllByRole('button').filter(
      button => button.textContent?.includes('Terms') ||
               button.textContent?.includes('Disclaimer') ||
               button.textContent?.includes('How to Use')
    );

    modalTriggers.forEach(trigger => {
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute('type', 'button');
    });
  });

  it('should have proper semantics for file upload area', () => {
    render(<App />, { wrapper: TestWrapper });

    // File upload area should be properly labeled and have dropzone semantics
    const uploadArea = screen.getByLabelText(/click to upload/i);
    expect(uploadArea).toBeInTheDocument();
    expect(uploadArea).toHaveAttribute('type', 'file');
    expect(uploadArea).toHaveAttribute('multiple');
  });

  it('should provide alternative text for images', () => {
    render(<App />, { wrapper: TestWrapper });

    // Logo should have alt text
    const logo = screen.getByAltText('WebP Magic');
    expect(logo).toBeInTheDocument();
  });

  it('should have proper table semantics for file lists', () => {
    // This would be tested when files are actually loaded
    // For now, check that table elements would have proper roles
    render(<App />, { wrapper: TestWrapper });

    // When file table is present, it should have proper headers
    // This is more of a structural test for when files are added
    const tables = screen.queryAllByRole('table');
    tables.forEach(table => {
      expect(table).toHaveAttribute('role', 'table');
    });
  });

  it('should support reduced motion preferences', async () => {
    // Mock reduced motion preference
    Object.defineProperty(window, 'matchMedia', {
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    const { container } = render(<App />, { wrapper: TestWrapper });

    // Should not have accessibility violations even with reduced motion
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});