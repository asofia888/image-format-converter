// This worker handles the image conversion in a background thread
// to avoid blocking the UI.
// FIX: Import ResizeConfig and TargetFormat from '../types' in a single statement.
import type { ResizeConfig, TargetFormat, CropConfig } from '../types';


self.onmessage = async (e: MessageEvent) => {
  const {
    imageData,
    targetFormat,
    quality,
    fileType,
    resizeConfig,
    cropConfig,
    originalWidth,
    originalHeight,
  } = e.data as {
    imageData: ImageBitmap;
    targetFormat: TargetFormat;
    quality: number;
    fileType: string;
    resizeConfig: ResizeConfig;
    cropConfig: CropConfig;
    originalWidth: number;
    originalHeight: number;
  };

  try {
    // Determine source dimensions and coordinates for cropping
    let srcX = 0;
    let srcY = 0;
    let srcWidth = originalWidth;
    let srcHeight = originalHeight;

    // Apply cropping if enabled
    if (cropConfig.enabled && cropConfig.width > 0 && cropConfig.height > 0) {
      srcX = Math.max(0, Math.min(cropConfig.x, originalWidth));
      srcY = Math.max(0, Math.min(cropConfig.y, originalHeight));
      srcWidth = Math.max(1, Math.min(cropConfig.width, originalWidth - srcX));
      srcHeight = Math.max(1, Math.min(cropConfig.height, originalHeight - srcY));
    }

    // Determine target dimensions (start with crop dimensions)
    let targetWidth = srcWidth;
    let targetHeight = srcHeight;

    // Apply resizing if enabled (after cropping)
    if (resizeConfig.enabled) {
      const widthNum = parseInt(resizeConfig.width, 10);
      const heightNum = parseInt(resizeConfig.height, 10);

      if (resizeConfig.unit === 'px') {
        targetWidth = isNaN(widthNum) ? srcWidth : widthNum;
        targetHeight = isNaN(heightNum) ? srcHeight : heightNum;
      } else { // '%'
        targetWidth = isNaN(widthNum) ? srcWidth : srcWidth * (widthNum / 100);
        targetHeight = isNaN(heightNum) ? srcHeight : srcHeight * (heightNum / 100);
      }
    }

    // Clamp to reasonable values to avoid browser crashes
    targetWidth = Math.round(Math.max(1, targetWidth));
    targetHeight = Math.round(Math.max(1, targetHeight));

    // Create an OffscreenCanvas. It's a canvas that can be rendered off-screen,
    // and is available in a Web Worker context.
    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      self.postMessage({ success: false, error: { key: 'errorWorkerContext' } });
      return;
    }

    // When converting from a format with transparency (like PNG) to one without (like JPEG),
    // the transparent areas would become black by default. To prevent this, we draw a white
    // background first.
    if (fileType === 'image/png' && targetFormat === 'jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw the image data onto the canvas, applying crop and resize in one operation
    ctx.drawImage(
      imageData,
      srcX, srcY, srcWidth, srcHeight,  // Source rectangle (crop area)
      0, 0, targetWidth, targetHeight   // Destination rectangle (resize)
    );
    imageData.close(); // Close the ImageBitmap to free up memory

    // Convert the canvas content to a Blob in the target format.
    const blob = await canvas.convertToBlob({
      type: `image/${targetFormat}`,
      quality: quality, // This is only applicable for JPEG and WebP
    });

    if (!blob) {
      self.postMessage({ success: false, error: { key: 'errorWorkerBlob' } });
      return;
    }

    // Post the successful result (the Blob) back to the main thread.
    self.postMessage({ success: true, blob });
  } catch (error) {
    console.error('Worker conversion error:', error);
    // Post an error message back to the main thread.
    self.postMessage({ success: false, error: { key: 'errorWorkerGeneric', params: { message: error instanceof Error ? error.message : 'Unknown worker error' } } });
  }
};