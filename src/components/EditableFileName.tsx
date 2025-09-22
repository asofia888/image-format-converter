import React, { useState, useRef, useEffect } from 'react';
import Icon from './Icon';

interface EditableFileNameProps {
  originalName: string;
  customName?: string;
  onNameChange: (newName: string) => void;
  className?: string;
}

const EditableFileName: React.FC<EditableFileNameProps> = ({
  originalName,
  customName,
  onNameChange,
  className = ''
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const getFileNameWithoutExtension = (fileName: string) => {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  };

  const getFileExtension = (fileName: string) => {
    const lastDotIndex = fileName.lastIndexOf('.');
    return lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';
  };

  const displayName = customName || getFileNameWithoutExtension(originalName);
  const extension = getFileExtension(originalName);

  const handleStartEdit = () => {
    setTempName(displayName);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (tempName.trim()) {
      onNameChange(tempName.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempName('');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <input
          ref={inputRef}
          type="text"
          value={tempName}
          onChange={(e) => setTempName(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="flex-1 px-2 py-1 text-sm border border-purple-300 dark:border-purple-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          placeholder="Enter file name"
        />
        <span className="text-sm text-slate-500 dark:text-slate-400">{extension}</span>
        <button
          onClick={handleSave}
          className="p-1 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"
          title="Save"
        >
          <Icon name="success" className="w-4 h-4" />
        </button>
        <button
          onClick={handleCancel}
          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
          title="Cancel"
        >
          <Icon name="error" className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 group cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded px-2 py-1 transition-colors ${className}`} onClick={handleStartEdit}>
      <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate" title={`${displayName}${extension}`}>
        {displayName}
      </span>
      <span className="text-sm text-slate-500 dark:text-slate-400">{extension}</span>
      <Icon
        name="edit"
        className="w-4 h-4 text-slate-400 dark:text-slate-500 opacity-60 group-hover:opacity-100 transition-opacity flex-shrink-0"
        title="Edit filename"
      />
    </div>
  );
};

export default EditableFileName;