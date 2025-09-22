import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider } from '../hooks/useTheme';
import { TranslationProvider } from '../hooks/useTranslation';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider>
      <TranslationProvider>
        {children}
      </TranslationProvider>
    </ThemeProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };

// Mock file creation utility
export const createMockFile = (
  name: string = 'test.jpg',
  size: number = 1024,
  type: string = 'image/jpeg'
): File => {
  const blob = new Blob([''], { type });
  return new File([blob], name, { type, lastModified: Date.now() });
};

// Mock image creation utility
export const createMockImage = (width: number = 100, height: number = 100) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas.toDataURL();
};