import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Point, Area } from 'react-easy-crop';
import { useTranslation } from '../hooks/useTranslation';
import Icon from './Icon';

interface ImageCropperProps {
  imageSrc: string;
  onConfirm: (croppedAreaPixels: Area) => void;
  onCancel: () => void;
}

const aspectRatios = [
    { value: 1 / 1, text: '1:1' },
    { value: 4 / 3, text: '4:3' },
    { value: 16 / 9, text: '16:9' },
];

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onConfirm, onCancel }) => {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const { t } = useTranslation();

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleConfirm = () => {
    if (croppedAreaPixels) {
      onConfirm(croppedAreaPixels);
    }
  };

  return (
    <div 
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" 
        aria-modal="true"
        role="dialog"
        aria-labelledby="crop-modal-title"
    >
      <div className="bg-slate-100 dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <header className="p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 id="crop-modal-title" className="text-xl font-bold text-slate-800 dark:text-slate-200">{t('cropModalTitle')}</h2>
        </header>

        <div className="relative flex-1 min-h-0">
             <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
            />
        </div>

        <div className="p-4 space-y-4 bg-slate-200/50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700">
            {/* Zoom Controls */}
            <div className="flex flex-col">
                <label htmlFor="zoom-slider" className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">{t('zoomLabel')}</label>
                 <input
                    id="zoom-slider"
                    type="range"
                    min="1"
                    max="3"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-300 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-purple-600 dark:accent-purple-500"
                />
            </div>
            {/* Aspect Ratio Controls */}
            <div className="flex flex-col">
                 <label className="mb-1 text-sm font-medium text-slate-600 dark:text-slate-400">{t('aspectRatioLabel')}</label>
                 <div className="flex gap-2">
                     <button onClick={() => setAspect(undefined)} className={`px-3 py-1 text-sm rounded-md transition-colors ${!aspect ? 'bg-purple-600 text-white' : 'bg-slate-300 dark:bg-slate-700'}`}>{t('aspectRatioFree')}</button>
                    {aspectRatios.map(ratio => (
                         <button key={ratio.text} onClick={() => setAspect(ratio.value)} className={`px-3 py-1 text-sm rounded-md transition-colors ${aspect === ratio.value ? 'bg-purple-600 text-white' : 'bg-slate-300 dark:bg-slate-700'}`}>
                            {ratio.text}
                        </button>
                    ))}
                 </div>
            </div>
        </div>

        <footer className="flex justify-end gap-3 p-4">
            <button
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-md transition-colors"
            >
                {t('cancelButton')}
            </button>
            <button
                onClick={handleConfirm}
                className="inline-flex items-center justify-center px-6 py-2 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
            >
                <Icon name="crop" className="w-5 h-5 mr-2" />
                {t('applyCropButton')}
            </button>
        </footer>
      </div>
    </div>
  );
};

export default ImageCropper;