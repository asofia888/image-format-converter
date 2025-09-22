import { describe, it, expect } from 'vitest';
import { formatBytes } from '../formatBytes';

describe('formatBytes', () => {
  it('should format bytes correctly', () => {
    expect(formatBytes(0)).toBe('0 Bytes');
    expect(formatBytes(1)).toBe('1 Bytes');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1048576)).toBe('1 MB');
    expect(formatBytes(1073741824)).toBe('1 GB');
  });

  it('should handle decimal places correctly', () => {
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(1572864)).toBe('1.5 MB');
    expect(formatBytes(1610612736)).toBe('1.5 GB');
  });

  it('should handle large numbers', () => {
    expect(formatBytes(1099511627776)).toBe('1 TB');
    // Note: PB is not in the sizes array, so large numbers will show as TB
    expect(formatBytes(1125899906842624)).toBe('1024 TB');
  });

  it('should handle negative numbers', () => {
    // Note: Math.log of negative numbers returns NaN
    expect(formatBytes(-1024)).toBe('NaN Bytes');
  });

  it('should handle decimal inputs', () => {
    expect(formatBytes(1536.5)).toBe('1.5 KB');
  });
});