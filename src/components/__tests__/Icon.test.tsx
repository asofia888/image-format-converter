import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import Icon from '../Icon';

describe('Icon', () => {
  it('should render upload icon', () => {
    render(<Icon name="upload" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('should render with custom className', () => {
    render(<Icon name="upload" className="custom-class" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toHaveClass('custom-class');
  });

  it('should render spinner icon', () => {
    render(<Icon name="spinner" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('should render success icon', () => {
    render(<Icon name="success" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('should render error icon', () => {
    render(<Icon name="error" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    render(<Icon name="upload" />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toHaveClass('w-6', 'h-6');
  });

  it('should handle unknown icon names gracefully', () => {
    render(<Icon name="unknown" as any />);
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toBeInTheDocument();
  });
});