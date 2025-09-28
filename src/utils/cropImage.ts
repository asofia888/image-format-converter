import type { CropConfig } from '../types';

export const cropImage = async (
  imageSrc: string,
  cropConfig: CropConfig
): Promise<{ croppedSrc: string; croppedWidth: number; croppedHeight: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        // Create canvas for cropping
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas size to crop dimensions
        canvas.width = cropConfig.width;
        canvas.height = cropConfig.height;

        // Draw the cropped portion of the image
        ctx.drawImage(
          img,
          cropConfig.x, cropConfig.y, cropConfig.width, cropConfig.height, // Source rectangle
          0, 0, cropConfig.width, cropConfig.height // Destination rectangle
        );

        // Convert to blob URL
        canvas.toBlob((blob) => {
          if (blob) {
            const croppedSrc = URL.createObjectURL(blob);
            resolve({
              croppedSrc,
              croppedWidth: cropConfig.width,
              croppedHeight: cropConfig.height,
            });
          } else {
            reject(new Error('Failed to create blob from canvas'));
          }
        }, 'image/png');
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for cropping'));
    };

    img.src = imageSrc;
  });
};