import React, { useState, useCallback } from 'react';
import type { Preset } from '../types';
import Icon from './Icon';
import { useTranslation } from '../hooks/useTranslation';

interface PresetControlsProps {
  presets: Preset[];
  activePresetId: string;
  onSavePreset: (name: string) => boolean;
  onApplyPreset: (id: string) => void;
  onDeletePreset: (id: string) => void;
}

const PresetControls: React.FC<PresetControlsProps> = ({
  presets,
  activePresetId,
  onSavePreset,
  onApplyPreset,
  onDeletePreset,
}) => {
  const { t } = useTranslation();
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const handleConfirmSavePreset = useCallback(() => {
    if (onSavePreset(newPresetName)) {
      setNewPresetName('');
      setIsSavingPreset(false);
    }
  }, [onSavePreset, newPresetName]);

  const handleDeleteClick = useCallback(() => {
    if (!activePresetId) return;
    const preset = presets.find(p => p.id === activePresetId);
    if (preset && window.confirm(t('confirmDeletePreset', { presetName: preset.name }))) {
      onDeletePreset(activePresetId);
    }
  }, [activePresetId, presets, t, onDeletePreset]);

  const handlePresetChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    onApplyPreset(e.target.value);
  }, [onApplyPreset]);

  const handlePresetNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPresetName(e.target.value);
  }, []);

  const handlePresetKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleConfirmSavePreset();
  }, [handleConfirmSavePreset]);

  const handleToggleSavePreset = useCallback(() => {
    setIsSavingPreset(true);
  }, []);

  const handleCancelSavePreset = useCallback(() => {
    setIsSavingPreset(false);
  }, []);

  return (
    <div>
      <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2 mb-2">
        <Icon name="save" className="w-5 h-5" />
        {t('presetsTitle')}
      </h3>
      {!isSavingPreset ? (
        <div className="flex gap-2">
          <select
            id="preset-select"
            value={activePresetId}
            onChange={handlePresetChange}
            className="flex-1 w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm text-slate-900 dark:text-white"
          >
            <option value="">{t('customSettingsOption')}</option>
            {presets.map(preset => (
              <option key={preset.id} value={preset.id}>{preset.name}</option>
            ))}
          </select>
          <button
            onClick={handleDeleteClick}
            disabled={!activePresetId}
            title={t('deletePresetButton')}
            className="p-2 text-slate-700 dark:text-slate-300 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon name="trash" className="w-5 h-5" />
          </button>
          <button
            onClick={handleToggleSavePreset}
            title={t('saveAsPresetButton')}
            className="p-2 text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-50 dark:focus:ring-offset-slate-800 focus:ring-purple-500"
          >
            <Icon name="plus" className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="flex gap-2 items-center bg-slate-100 dark:bg-slate-900/50 p-2 rounded-md">
          <input
            type="text"
            value={newPresetName}
            onChange={handlePresetNameChange}
            placeholder={t('presetNamePlaceholder')}
            className="flex-1 w-full bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md pl-3 py-2 sm:text-sm text-slate-900 dark:text-white border focus:ring-1 focus:ring-purple-500 focus:border-purple-500 focus:outline-none"
            onKeyDown={handlePresetKeyDown}
          />
          <button
            onClick={handleConfirmSavePreset}
            className="px-4 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
          >
            {t('saveButton')}
          </button>
          <button
            onClick={handleCancelSavePreset}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-colors"
          >
            {t('cancelButton')}
          </button>
        </div>
      )}
    </div>
  );
};

export default PresetControls;