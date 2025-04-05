/**
 * Utility functions for handling images.
 */

/**
 * Loads an image from a URL and returns a Promise that resolves with an HTMLImageElement.
 */
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Enable CORS for images from other domains
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

/**
 * Creates an ImageData object from an HTMLImageElement.
 */
function imageToImageData(img, scale = 1) {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  
  // Calculate new dimensions based on scale
  const width = Math.round(img.width * scale);
  const height = Math.round(img.height * scale);
  
  // Set canvas dimensions
  canvas.width = width;
  canvas.height = height;
  
  // Draw the image onto the canvas with scaling
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Use nearest-neighbor scaling for pixel art look when downscaling
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0, width, height);
  
  // Get image data
  return ctx.getImageData(0, 0, width, height);
}

/**
 * Creates a data URL from an ImageData object.
 */
function imageDataToDataURL(imageData) {
  // Create a canvas element
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  
  // Draw the image data onto the canvas
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  ctx.putImageData(imageData, 0, 0);
  
  // Convert canvas to data URL
  return canvas.toDataURL('image/png');
}

/**
 * Creates a blob from an ImageData object.
 */
function imageDataToBlob(imageData) {
  return new Promise((resolve, reject) => {
    // Create a canvas element
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    
    // Draw the image data onto the canvas
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }
    
    ctx.putImageData(imageData, 0, 0);
    
    // Convert canvas to blob
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/png'
    );
  });
}

/**
 * Checks if a file is a valid image file type.
 */
function isValidImageType(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
  return validTypes.includes(file.type);
}

/**
 * Gets an object URL from a file.
 */
function fileToObjectURL(file) {
  return URL.createObjectURL(file);
}

/**
 * Releases an object URL to free memory.
 */
function releaseObjectURL(url) {
  URL.revokeObjectURL(url);
}

/**
 * Validates file size is under the maximum allowed.
 */
function isValidFileSize(file, maxSizeMB = 10) {
  const maxSizeBytes = maxSizeMB * 1024 * 1024; // Convert MB to bytes
  return file.size <= maxSizeBytes;
}

// Expose functions to the global scope
window.loadImage = loadImage;
window.imageToImageData = imageToImageData;
window.imageDataToDataURL = imageDataToDataURL;
window.imageDataToBlob = imageDataToBlob;
window.isValidImageType = isValidImageType;
window.fileToObjectURL = fileToObjectURL;
window.releaseObjectURL = releaseObjectURL;
window.isValidFileSize = isValidFileSize;