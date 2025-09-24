import { describe, it, expect } from 'vitest';
import { render } from '../../test/test-utils';
import Icon from '../Icon';

describe('Icon', () => {
  it('should render upload icon', () => {
    const { container } = render(<Icon name="upload" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render with custom className', () => {
    const { container } = render(<Icon name="upload" className="custom-class" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('custom-class');
  });

  it('should render spinner icon', () => {
    const { container } = render(<Icon name="spinner" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render success icon', () => {
    const { container } = render(<Icon name="success" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should render error icon', () => {
    const { container } = render(<Icon name="error" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    const { container } = render(<Icon name="upload" className="w-6 h-6" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('w-6', 'h-6');
  });

  it('should handle unknown icon names gracefully', () => {
    const { container } = render(<Icon name="unknown" as any />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeInTheDocument();
  });
});