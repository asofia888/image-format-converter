import { Area } from 'react-easy-crop';

export const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // needed to avoid cross-origin issues
    image.src = url;
  });


export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area
): Promise<{ url: string; blob: Blob, width: number, height: number }> {
  console.log('DEBUG: getCroppedImg called with:', { imageSrc, pixelCrop });

  const image = await createImage(imageSrc);
  console.log('DEBUG: Image loaded, dimensions:', { width: image.width, height: image.height });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context for cropping');
  }

  // Ensure crop dimensions are valid
  const cropWidth = Math.round(Math.max(1, pixelCrop.width));
  const cropHeight = Math.round(Math.max(1, pixelCrop.height));
  const cropX = Math.round(Math.max(0, Math.min(pixelCrop.x, image.width - cropWidth)));
  const cropY = Math.round(Math.max(0, Math.min(pixelCrop.y, image.height - cropHeight)));

  console.log('DEBUG: Adjusted crop parameters:', { cropX, cropY, cropWidth, cropHeight });

  // Set the size of the canvas to the crop dimensions
  canvas.width = cropWidth;
  canvas.height = cropHeight;

  // Draw the cropped image onto the canvas
  ctx.drawImage(
    image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  console.log('DEBUG: Canvas after drawing - width:', canvas.width, 'height:', canvas.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      console.log('DEBUG: Canvas toBlob result:', blob);
      if (!blob) {
        console.error('DEBUG: Canvas is empty - blob is null');
        reject(new Error('Canvas is empty'));
        return;
      }
      const url = URL.createObjectURL(blob);
      console.log('DEBUG: Successfully created cropped image URL');
      resolve({ url, blob, width: cropWidth, height: cropHeight });
    }, 'image/png'); // Using png to preserve transparency
  });
}