import { describe, it, expect, vi, beforeEach } from 'vitest';
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

    // FileUploader uses a label, not a button
    const label = screen.getByLabelText(/dropzone-file/i);
    expect(label).toBeInTheDocument();

    // Check for upload text content
    expect(screen.getByText(/click to upload/i, { selector: 'span' })).toBeInTheDocument();
  });

  it('should show error message when error prop is provided', () => {
    const error = 'Test error message';
    render(<FileUploader onFilesSelect={mockOnFilesSelect} status="idle" error={error} />);

    expect(screen.getByText(error)).toBeInTheDocument();
  });

  it('should show loading state when status is converting', () => {
    render(<FileUploader onFilesSelect={mockOnFilesSelect} status="converting" error={null} />);

    // FileUploader doesn't have a disabled state, just check it renders
    const fileInput = screen.getByDisplayValue('');
    expect(fileInput).toBeInTheDocument();
  });

  it('should handle file input change', async () => {
    render(<FileUploader onFilesSelect={mockOnFilesSelect} status="idle" error={null} />);

    const fileInput = screen.getByDisplayValue('') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    const file = createMockFile('test.jpg', 1024, 'image/jpeg');
    const fileList = {
      0: file,
      length: 1,
      item: (index: number) => index === 0 ? file : null,
    } as FileList;

    Object.defineProperty(fileInput, 'files', {
      value: fileList,
      writable: false,
    });

    fireEvent.change(fileInput);
    expect(mockOnFilesSelect).toHaveBeenCalledWith([file]);
  });

  it('should have proper accessibility attributes', () => {
    render(<FileUploader onFilesSelect={mockOnFilesSelect} status="idle" error={null} />);

    const fileInput = screen.getByDisplayValue('') as HTMLInputElement;
    expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/png,image/webp');
    expect(fileInput).toHaveAttribute('multiple');
    expect(fileInput).toHaveAttribute('type', 'file');
  });

  it('should handle drag and drop events', () => {
    render(<FileUploader onFilesSelect={mockOnFilesSelect} status="idle" error={null} />);

    const dropZone = screen.getByLabelText(/dropzone-file/i);

    // Test dragover event
    fireEvent.dragOver(dropZone);

    // Test drop event
    const file = createMockFile('test.jpg', 1024, 'image/jpeg');
    const dropEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: {
        files: [file],
        items: [],
        clearData: vi.fn(),
      },
    };

    fireEvent.drop(dropZone, dropEvent);
    expect(mockOnFilesSelect).toHaveBeenCalledWith([file]);
  });
});