import React, { useState, useCallback } from 'react';
import type { AppStatus } from '../types';
import Icon from './Icon';
import { useTranslation } from '../hooks/useTranslation';

interface FileUploaderProps {
  onFilesSelect: (files: File[]) => void;
  status: AppStatus;
  error: string | null;
}

// FIX: Moved helper functions outside component to prevent re-creation on each render
// and to fix useCallback dependency issues.
const readDirectoryEntries = async (directoryReader: any): Promise<any[]> => {
  return new Promise((resolve, reject) => {
      directoryReader.readEntries((entries: any[]) => {
          resolve(entries);
      }, reject);
  });
}

const getFilesInDirectory = async (directoryEntry: any): Promise<File[]> => {
  let files: File[] = [];
  const reader = directoryEntry.createReader();
  let entries: any[];
  do {
    entries = await readDirectoryEntries(reader);
    for (const entry of entries) {
      if (entry.isDirectory) {
        files = files.concat(await getFilesInDirectory(entry));
      } else if (entry.isFile) {
         const file = await new Promise<File>((resolve, reject) => entry.file(resolve, reject));
         files.push(file);
      }
    }
  } while (entries.length > 0);
  return files;
};

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelect, status, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const { t } = useTranslation();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    let droppedFiles: File[] = [];
    if (e.dataTransfer.items) {
      const items = [...e.dataTransfer.items];
      const filePromises = items.map(item => {
        // Use webkitGetAsEntry to handle directories
        const entry = item.webkitGetAsEntry();
        if (entry) {
          if (entry.isDirectory) {
            return getFilesInDirectory(entry);
          }
          if (entry.isFile) {
            return new Promise<File[]>((resolve, reject) => {
              // FIX: Property 'file' does not exist on type 'FileSystemEntry'. Cast to FileSystemFileEntry.
              (entry as FileSystemFileEntry).file((file: File) => resolve([file]), reject);
            });
          }
        }
        return Promise.resolve([]);
      });
      
      const fileArrays = await Promise.all(filePromises);
      droppedFiles = fileArrays.flat();

    } else {
        droppedFiles = [...e.dataTransfer.files];
    }
    
    if (droppedFiles.length > 0) {
        onFilesSelect(droppedFiles);
    }
    
    e.dataTransfer.clearData();
  }, [onFilesSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesSelect(Array.from(e.target.files));
    }
  };

  const borderColor = isDragging ? 'border-purple-500' : 'border-slate-600';

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <label
        htmlFor="dropzone-file"
        className={`flex flex-col items-center justify-center w-full h-64 border-2 ${borderColor} border-dashed rounded-lg cursor-pointer bg-slate-800 hover:bg-slate-700/50 transition-colors duration-300`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          <Icon name="upload" className="w-10 h-10 mb-4 text-slate-400" />
          <p className="mb-2 text-sm text-slate-400">
            <span className="font-semibold text-purple-400">{t('uploadCTA')}</span>{t('uploadHint')}
          </p>
          <p className="text-xs text-slate-500">{t('uploadFormats')}</p>
        </div>
        <input id="dropzone-file" type="file" className="hidden" onChange={handleFileChange} accept="image/jpeg,image/png,image/webp" multiple />
      </label>
      {status === 'error' && error && (
        <div className="mt-4 text-center bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg flex items-center">
            <Icon name="error" className="w-5 h-5 mr-2" />
            <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default FileUploader;