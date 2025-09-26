import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeSwitcher from '../ThemeSwitcher';
import { ThemeProvider } from '../../hooks/useTheme';
import { TranslationProvider } from '../../hooks/useTranslation';
import React from 'react';

// Mock the useTheme hook
vi.mock('../../hooks/useTheme', async () => {
  const actual = await vi.importActual('../../hooks/useTheme');
  return {
    ...actual,
    useTheme: () => ({
      theme: 'dark',
      toggleTheme: vi.fn(),
    }),
    ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  };
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <TranslationProvider>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </TranslationProvider>
);

describe('ThemeSwitcher', () => {
  it('should render theme switcher button', () => {
    render(<ThemeSwitcher />, { wrapper: TestWrapper });
    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
  });

  it('should have correct accessibility attributes', () => {
    render(<ThemeSwitcher />, { wrapper: TestWrapper });
    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toHaveAttribute('aria-label');
  });

  it('should be clickable', () => {
    render(<ThemeSwitcher />, { wrapper: TestWrapper });
    const button = screen.getByRole('button', { name: /toggle theme/i });

    expect(() => fireEvent.click(button)).not.toThrow();
  });

  it('should contain an icon', () => {
    render(<ThemeSwitcher />, { wrapper: TestWrapper });
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });
});