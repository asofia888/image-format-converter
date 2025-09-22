import { describe, it, expect } from 'vitest';
import { sanitizeHtml } from '../sanitizeHtml';

describe('sanitizeHtml', () => {
  it('should allow safe HTML tags', () => {
    const input = '<p>Hello <strong>world</strong></p>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<p>Hello <strong>world</strong></p>');
  });

  it('should remove script tags', () => {
    const input = '<p>Hello</p><script>alert("xss")</script>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<p>Hello</p>');
  });

  it('should remove dangerous attributes', () => {
    const input = '<p onclick="alert()">Hello</p>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<p>Hello</p>');
  });

  it('should allow safe links', () => {
    const input = '<a href="https://example.com">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<a href="https://example.com">Link</a>');
  });

  it('should remove javascript: links', () => {
    const input = '<a href="javascript:alert()">Link</a>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<a>Link</a>');
  });

  it('should handle empty input', () => {
    const result = sanitizeHtml('');
    expect(result).toBe('');
  });

  it('should handle plain text', () => {
    const input = 'Just plain text';
    const result = sanitizeHtml(input);
    expect(result).toBe('Just plain text');
  });

  it('should preserve line breaks', () => {
    const input = '<p>Line 1<br>Line 2</p>';
    const result = sanitizeHtml(input);
    expect(result).toBe('<p>Line 1<br>Line 2</p>');
  });
});