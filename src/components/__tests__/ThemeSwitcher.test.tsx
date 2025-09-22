import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/test-utils';
import ThemeSwitcher from '../ThemeSwitcher';

// Mock the useTheme hook
vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'dark',
    toggleTheme: vi.fn(),
  }),
}));

describe('ThemeSwitcher', () => {
  it('should render theme switcher button', () => {
    render(<ThemeSwitcher />);
    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toBeInTheDocument();
  });

  it('should have correct accessibility attributes', () => {
    render(<ThemeSwitcher />);
    const button = screen.getByRole('button', { name: /toggle theme/i });
    expect(button).toHaveAttribute('aria-label');
  });

  it('should be clickable', () => {
    render(<ThemeSwitcher />);
    const button = screen.getByRole('button', { name: /toggle theme/i });

    expect(() => fireEvent.click(button)).not.toThrow();
  });

  it('should contain an icon', () => {
    render(<ThemeSwitcher />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });
});