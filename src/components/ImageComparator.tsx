import React, { useState, useRef, useCallback, useEffect } from 'react';
import Icon from './Icon';
import { useTranslation } from '../hooks/useTranslation';
import { formatBytes } from '../utils/formatBytes';

interface ImageComparatorProps {
    beforeSrc: string;
    afterSrc: string | null;
    beforeLabel: string;
    afterLabel: string;
    beforeFileName?: string;
    afterFileName?: string;
    beforeFileSize?: number | null;
    afterFileSize?: number | null;
    dimensions?: { width: number; height: number; } | null;
    isLoading?: boolean;
    error?: string | null;
}

const ImageComparator: React.FC<ImageComparatorProps> = ({
    beforeSrc,
    afterSrc,
    beforeLabel,
    afterLabel,
    beforeFileName,
    afterFileName,
    beforeFileSize,
    afterFileSize,
    dimensions,
    isLoading,
    error,
}) => {
    const [sliderPosition, setSliderPosition] = useState(50);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();

    const handleMove = useCallback((clientX: number) => {
        if (!isDragging || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = clientX - rect.left;
        let percentage = (x / rect.width) * 100;
        percentage = Math.max(0, Math.min(100, percentage));
        setSliderPosition(percentage);
    }, [isDragging]);

    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const handleTouchStart = () => setIsDragging(true);
    const handleMouseUp = useCallback(() => setIsDragging(false), []);
    const handleTouchEnd = useCallback(() => setIsDragging(false), []);
    const handleMouseMove = useCallback((e: MouseEvent) => handleMove(e.clientX), [handleMove]);
    const handleTouchMove = useCallback((e: TouchEvent) => handleMove(e.touches[0].clientX), [handleMove]);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
            window.addEventListener('touchmove', handleTouchMove);
            window.addEventListener('touchend', handleTouchEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

    return (
        <div className="flex flex-col items-center space-y-4">
            <div
                ref={containerRef}
                className="w-full h-80 bg-slate-100 dark:bg-slate-900/50 rounded-lg flex items-center justify-center border border-slate-200 dark:border-slate-700 overflow-hidden relative select-none touch-none"
                onMouseUp={handleMouseUp}
                onTouchEnd={handleTouchEnd}
            >
                {/* Before Image */}
                <img src={beforeSrc} alt={beforeLabel} className="absolute inset-0 object-contain w-full h-full pointer-events-none" />
                
                {/* After Image/Content */}
                <div
                    className="absolute inset-0 w-full h-full overflow-hidden"
                    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
                >
                    {isLoading ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/50">
                            <Icon name="spinner" className="w-10 h-10 animate-spin text-purple-600 dark:text-purple-400" />
                            <p className="mt-2">{t('convertingLabel')}</p>
                        </div>
                    ) : error ? (
                        <div className="w-full h-full flex flex-col items-center justify-center text-red-600 dark:text-red-400 bg-red-500/10 p-4">
                            <Icon name="error" className="w-12 h-12" />
                            <p className="mt-2 text-center text-sm font-medium">{error}</p>
                        </div>
                    ) : afterSrc ? (
                        <img src={afterSrc} alt={afterLabel} className="absolute inset-0 object-contain w-full h-full pointer-events-none" />
                    ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-900/50">
                            <Icon name="image" className="w-12 h-12" />
                            <span className="mt-2 text-sm">{t('previewLabel')}</span>
                        </div>
                    )}
                </div>

                {/* Labels */}
                <div className="absolute top-2 left-2 z-10 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded pointer-events-none transition-opacity" style={{ opacity: sliderPosition > 10 ? 1 : 0 }}>{beforeLabel}</div>
                <div className="absolute top-2 right-2 z-10 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded pointer-events-none transition-opacity" style={{ opacity: sliderPosition < 90 ? 1 : 0 }}>{afterLabel}</div>

                {/* Slider Handle */}
                <div
                    className="absolute top-0 bottom-0 z-10 w-1 bg-white/50 cursor-ew-resize flex items-center justify-center"
                    style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
                    onMouseDown={handleMouseDown}
                    onTouchStart={handleTouchStart}
                >
                    <div className="w-10 h-10 bg-white/80 dark:bg-slate-800/80 rounded-full flex items-center justify-center shadow-lg backdrop-blur-sm ring-2 ring-white/20 dark:ring-black/20">
                        <Icon name="arrowsHorizontal" className="w-5 h-5 text-slate-800 dark:text-white" />
                    </div>
                </div>

                {/* Accessible control */}
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPosition}
                    onChange={(e) => setSliderPosition(Number(e.target.value))}
                    className="sr-only"
                    aria-label="Image comparison slider"
                />
            </div>

            {/* File Info */}
            <div className="w-full grid grid-cols-2 gap-4 text-sm text-slate-600 dark:text-slate-400 text-center px-4">
                <div>
                    <p className="truncate font-medium text-slate-800 dark:text-slate-200" title={beforeFileName}>{beforeFileName}</p>
                     {beforeFileSize != null && (
                         <div className="text-xs space-x-2">
                             <span className="font-semibold">{formatBytes(beforeFileSize)}</span>
                             {dimensions && <span>{`(${dimensions.width}x${dimensions.height})`}</span>}
                         </div>
                     )}
                </div>
                <div>
                    <p className="truncate font-medium text-slate-800 dark:text-slate-200" title={afterFileName || '...'}>{afterFileName || '...'}</p>
                    {afterFileSize != null && (
                        <div className="flex items-center justify-center gap-2 text-xs">
                            <span className="font-semibold">{formatBytes(afterFileSize)}</span>
                            {beforeFileSize != null && afterFileSize < beforeFileSize && (
                                <span className="text-green-600 dark:text-green-400 font-semibold">
                                    ({(((beforeFileSize - afterFileSize) / beforeFileSize) * 100).toFixed(0)}% smaller)
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ImageComparator;