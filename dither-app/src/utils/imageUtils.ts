/**
 * Utility functions for image processing
 */

/**
 * Load an image from a URL and return an HTMLImageElement
 */
export const loadImage = (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image'));
    img.src = url;
  });
};

/**
 * Check if a file is a valid image type
 */
export const isValidImageType = (file: File): boolean => {
  return ['image/jpeg', 'image/png', 'image/gif'].includes(file.type);
};

/**
 * Check if a file size is valid
 */
export const isValidFileSize = (file: File, maxSizeMB: number): boolean => {
  return file.size <= maxSizeMB * 1024 * 1024;
};

/**
 * Convert a File to an object URL
 */
export const fileToObjectURL = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * Release an object URL to free memory
 */
export const releaseObjectURL = (url: string | null): void => {
  if (url) {
    URL.revokeObjectURL(url);
  }
};

/**
 * Draw an image to a canvas and return the canvas
 */
export const drawImageToCanvas = (img: HTMLImageElement): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  ctx.drawImage(img, 0, 0);
  return canvas;
};

/**
 * Get image data from a canvas
 */
export const getImageData = (canvas: HTMLCanvasElement): ImageData => {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

/**
 * Create a canvas from ImageData
 */
export const createCanvasFromImageData = (imageData: ImageData): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  ctx.putImageData(imageData, 0, 0);
  return canvas;
};

/**
 * Convert a canvas to a data URL
 */
export const canvasToDataURL = (canvas: HTMLCanvasElement, type = 'image/png', quality = 0.9): string => {
  return canvas.toDataURL(type, quality);
};

/**
 * Convert a canvas to a Blob
 */
export const canvasToBlob = (canvas: HTMLCanvasElement, type = 'image/png', quality = 0.9): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      type,
      quality
    );
  });
};