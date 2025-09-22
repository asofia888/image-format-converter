import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../test/test-utils';
import FileUploader from '../FileUploader';
import { createMockFile } from '../../test/test-utils';

describe('FileUploader', () => {
  const mockOnFilesSelect = vi.fn();

  beforeEach(() => {
    mockOnFilesSelect.mockClear();
  });

  it('should render file uploader', () => {
    render(<FileUploader onFilesSelect={mockOnFilesSelect} status="idle" error={null} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument();
  });

  it('should show error message when error prop is provided', () => {
    const error = 'Test error message';
    render(<FileUploader onFilesSelect={mockOnFilesSelect} status="idle" error={error} />);

    expect(screen.getByText(error)).toBeInTheDocument();
  });

  it('should show loading state when status is converting', () => {
    render(<FileUploader onFilesSelect={mockOnFilesSelect} status="converting" error={null} />);

    // Should show some loading indicator
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should handle file input change', async () => {
    render(<FileUploader onFilesSelect={mockOnFilesSelect} status="idle" error={null} />);

    const fileInput = screen.getByRole('button').querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();

    const file = createMockFile('test.jpg', 1024, 'image/jpeg');
    const fileList = {
      0: file,
      length: 1,
      item: (index: number) => index === 0 ? file : null,
    } as FileList;

    if (fileInput) {
      Object.defineProperty(fileInput, 'files', {
        value: fileList,
        writable: false,
      });

      fireEvent.change(fileInput);
      expect(mockOnFilesSelect).toHaveBeenCalledWith([file]);
    }
  });

  it('should have proper accessibility attributes', () => {
    render(<FileUploader onFilesSelect={mockOnFilesSelect} status="idle" error={null} />);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('type', 'button');

    const fileInput = button.querySelector('input[type="file"]');
    expect(fileInput).toHaveAttribute('accept', 'image/*');
    expect(fileInput).toHaveAttribute('multiple');
  });

  it('should handle drag and drop events', () => {
    render(<FileUploader onFilesSelect={mockOnFilesSelect} status="idle" error={null} />);

    const dropZone = screen.getByRole('button');

    // Test dragover event
    fireEvent.dragOver(dropZone);

    // Test drop event
    const file = createMockFile('test.jpg', 1024, 'image/jpeg');
    const dropEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [file],
      },
    };

    fireEvent.drop(dropZone, dropEvent);
    expect(mockOnFilesSelect).toHaveBeenCalledWith([file]);
  });
});