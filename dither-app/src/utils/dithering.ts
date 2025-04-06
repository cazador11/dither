/**
 * Types and functions for image dithering
 */

export type RGB = {
  r: number;
  g: number;
  b: number;
};

export enum DitheringAlgorithm {
  NONE = 'none',
  ORDERED = 'ordered',
  FLOYD_STEINBERG = 'floydSteinberg',
  ATKINSON = 'atkinson',
  JARVIS = 'jarvis',
}

export enum ColorPalette {
  MONOCHROME = 'monochrome',
  GRAYSCALE_4 = 'grayscale4',
  GRAYSCALE_8 = 'grayscale8',
  RGB_8 = 'rgb8',
  SEPIA = 'sepia',
  CUSTOM = 'custom',
}

export type DitheringSettings = {
  algorithm: DitheringAlgorithm;
  palette: ColorPalette;
  customPalette?: RGB[];
  brightness?: number;
  contrast?: number;
  threshold?: number;
};

const DEFAULT_PALETTES: Record<ColorPalette, RGB[]> = {
  [ColorPalette.MONOCHROME]: [
    { r: 0, g: 0, b: 0 },
    { r: 255, g: 255, b: 255 },
  ],
  [ColorPalette.GRAYSCALE_4]: [
    { r: 0, g: 0, b: 0 },
    { r: 85, g: 85, b: 85 },
    { r: 170, g: 170, b: 170 },
    { r: 255, g: 255, b: 255 },
  ],
  [ColorPalette.GRAYSCALE_8]: [
    { r: 0, g: 0, b: 0 },
    { r: 36, g: 36, b: 36 },
    { r: 73, g: 73, b: 73 },
    { r: 109, g: 109, b: 109 },
    { r: 146, g: 146, b: 146 },
    { r: 182, g: 182, b: 182 },
    { r: 219, g: 219, b: 219 },
    { r: 255, g: 255, b: 255 },
  ],
  [ColorPalette.RGB_8]: [
    { r: 0, g: 0, b: 0 },
    { r: 255, g: 0, b: 0 },
    { r: 0, g: 255, b: 0 },
    { r: 0, g: 0, b: 255 },
    { r: 255, g: 255, b: 0 },
    { r: 0, g: 255, b: 255 },
    { r: 255, g: 0, b: 255 },
    { r: 255, g: 255, b: 255 },
  ],
  [ColorPalette.SEPIA]: [
    { r: 112, g: 66, b: 20 },
    { r: 223, g: 213, b: 183 },
  ],
  [ColorPalette.CUSTOM]: [],
};

/**
 * Apply dithering to image data
 */
export const applyDithering = (imageData: ImageData, settings: DitheringSettings): ImageData => {
  // Create a copy of the image data to work with
  const { width, height } = imageData;
  const newImageData = new ImageData(width, height);
  const data = new Uint8ClampedArray(imageData.data);
  
  // Apply brightness and contrast adjustments if needed
  if (settings.brightness !== undefined || settings.contrast !== undefined) {
    adjustBrightnessContrast(
      data, 
      settings.brightness ?? 0, 
      settings.contrast ?? 0
    );
  }
  
  // Select palette
  let palette = settings.customPalette && settings.palette === ColorPalette.CUSTOM
    ? settings.customPalette
    : DEFAULT_PALETTES[settings.palette];
  
  // Apply dithering based on the selected algorithm
  let processedData: Uint8ClampedArray;
  
  switch (settings.algorithm) {
    case DitheringAlgorithm.NONE:
      processedData = applyNoDithering(data, width, height, palette, settings.threshold ?? 127);
      break;
    case DitheringAlgorithm.ORDERED:
      processedData = applyOrderedDithering(data, width, height, palette);
      break;
    case DitheringAlgorithm.FLOYD_STEINBERG:
      processedData = applyFloydSteinbergDithering(data, width, height, palette);
      break;
    case DitheringAlgorithm.ATKINSON:
      processedData = applyAtkinsonDithering(data, width, height, palette);
      break;
    case DitheringAlgorithm.JARVIS:
      processedData = applyJarvisDithering(data, width, height, palette);
      break;
    default:
      processedData = data;
  }
  
  // Update the new ImageData object
  newImageData.data.set(processedData);
  return newImageData;
};

/**
 * Adjust brightness and contrast of image data
 */
const adjustBrightnessContrast = (
  data: Uint8ClampedArray,
  brightness: number, 
  contrast: number
): void => {
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  
  for (let i = 0; i < data.length; i += 4) {
    // Skip the alpha channel
    for (let j = 0; j < 3; j++) {
      let color = data[i + j];
      // Apply brightness
      color = color + brightness;
      // Apply contrast
      color = Math.floor(factor * (color - 128) + 128);
      // Clamp values
      data[i + j] = Math.max(0, Math.min(255, color));
    }
  }
};

/**
 * Find the closest color in the palette
 */
const findClosestColor = (r: number, g: number, b: number, palette: RGB[]): RGB => {
  let minDistance = Infinity;
  let closestColor = palette[0];
  
  for (const color of palette) {
    const dr = r - color.r;
    const dg = g - color.g;
    const db = b - color.b;
    const distance = dr * dr + dg * dg + db * db;
    
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  }
  
  return closestColor;
};

/**
 * Apply no dithering (simple color quantization)
 */
const applyNoDithering = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  palette: RGB[],
  threshold: number
): Uint8ClampedArray => {
  const result = new Uint8ClampedArray(data);
  
  // For monochrome palette, use threshold for faster processing
  if (palette.length === 2 && 
      palette[0].r === 0 && palette[0].g === 0 && palette[0].b === 0 &&
      palette[1].r === 255 && palette[1].g === 255 && palette[1].b === 255) {
    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
      const value = gray < threshold ? 0 : 255;
      result[i] = result[i + 1] = result[i + 2] = value;
    }
  } else {
    // General case - find closest color
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const closestColor = findClosestColor(r, g, b, palette);
      
      result[i] = closestColor.r;
      result[i + 1] = closestColor.g;
      result[i + 2] = closestColor.b;
    }
  }
  
  return result;
};

/**
 * Apply Floyd-Steinberg dithering
 */
const applyFloydSteinbergDithering = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  palette: RGB[]
): Uint8ClampedArray => {
  // Create a copy of the data to work with
  const result = new Uint8ClampedArray(data);
  
  // Create buffer arrays for the original pixel values and error diffusion
  const buffer = new Float32Array(width * height * 3);
  
  // Initialize buffer with original pixel values
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const j = (y * width + x) * 3;
      buffer[j] = data[i];
      buffer[j + 1] = data[i + 1];
      buffer[j + 2] = data[i + 2];
    }
  }
  
  // Apply Floyd-Steinberg dithering
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 3;
      const resultIndex = (y * width + x) * 4;
      
      // Get current pixel color
      const oldR = Math.max(0, Math.min(255, Math.round(buffer[index])));
      const oldG = Math.max(0, Math.min(255, Math.round(buffer[index + 1])));
      const oldB = Math.max(0, Math.min(255, Math.round(buffer[index + 2])));
      
      // Find the closest color from the palette
      const newColor = findClosestColor(oldR, oldG, oldB, palette);
      
      // Update the result with the new color
      result[resultIndex] = newColor.r;
      result[resultIndex + 1] = newColor.g;
      result[resultIndex + 2] = newColor.b;
      
      // Calculate quantization errors
      const errorR = oldR - newColor.r;
      const errorG = oldG - newColor.g;
      const errorB = oldB - newColor.b;
      
      // Distribute errors to neighboring pixels
      // Skip error diffusion for border pixels to avoid array out-of-bounds
      if (x < width - 1) {
        // Right pixel: 7/16
        buffer[index + 3] += errorR * 7 / 16;
        buffer[index + 4] += errorG * 7 / 16;
        buffer[index + 5] += errorB * 7 / 16;
      }
      
      if (y < height - 1) {
        if (x > 0) {
          // Bottom-left pixel: 3/16
          buffer[index + width * 3 - 3] += errorR * 3 / 16;
          buffer[index + width * 3 - 2] += errorG * 3 / 16;
          buffer[index + width * 3 - 1] += errorB * 3 / 16;
        }
        
        // Bottom pixel: 5/16
        buffer[index + width * 3] += errorR * 5 / 16;
        buffer[index + width * 3 + 1] += errorG * 5 / 16;
        buffer[index + width * 3 + 2] += errorB * 5 / 16;
        
        if (x < width - 1) {
          // Bottom-right pixel: 1/16
          buffer[index + width * 3 + 3] += errorR * 1 / 16;
          buffer[index + width * 3 + 4] += errorG * 1 / 16;
          buffer[index + width * 3 + 5] += errorB * 1 / 16;
        }
      }
    }
  }
  
  return result;
};

/**
 * Apply ordered dithering
 */
const applyOrderedDithering = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  palette: RGB[]
): Uint8ClampedArray => {
  const result = new Uint8ClampedArray(data);
  
  // Bayer matrix 4x4 (normalized to the range [0, 255])
  const bayerMatrix = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      
      // Get the threshold value from the Bayer matrix
      const threshold = (bayerMatrix[y % 4][x % 4] * 16) / 16;
      
      // Apply threshold to each color channel
      let r = data[i] + threshold - 127;
      let g = data[i + 1] + threshold - 127;
      let b = data[i + 2] + threshold - 127;
      
      // Clamp values
      r = Math.max(0, Math.min(255, r));
      g = Math.max(0, Math.min(255, g));
      b = Math.max(0, Math.min(255, b));
      
      // Find the closest color from the palette
      const closestColor = findClosestColor(r, g, b, palette);
      
      result[i] = closestColor.r;
      result[i + 1] = closestColor.g;
      result[i + 2] = closestColor.b;
    }
  }
  
  return result;
};

/**
 * Apply Atkinson dithering
 */
const applyAtkinsonDithering = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  palette: RGB[]
): Uint8ClampedArray => {
  // Similar to Floyd-Steinberg but with different error distribution pattern
  const result = new Uint8ClampedArray(data);
  const buffer = new Float32Array(width * height * 3);
  
  // Initialize buffer
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const j = (y * width + x) * 3;
      buffer[j] = data[i];
      buffer[j + 1] = data[i + 1];
      buffer[j + 2] = data[i + 2];
    }
  }
  
  // Apply Atkinson dithering
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 3;
      const resultIndex = (y * width + x) * 4;
      
      // Get current pixel color
      const oldR = Math.max(0, Math.min(255, Math.round(buffer[index])));
      const oldG = Math.max(0, Math.min(255, Math.round(buffer[index + 1])));
      const oldB = Math.max(0, Math.min(255, Math.round(buffer[index + 2])));
      
      // Find the closest color
      const newColor = findClosestColor(oldR, oldG, oldB, palette);
      
      // Update result
      result[resultIndex] = newColor.r;
      result[resultIndex + 1] = newColor.g;
      result[resultIndex + 2] = newColor.b;
      
      // Calculate error (1/8 distribution to 6 neighboring pixels)
      const errorR = (oldR - newColor.r) / 8;
      const errorG = (oldG - newColor.g) / 8;
      const errorB = (oldB - newColor.b) / 8;
      
      // Distribute error (only if within bounds)
      const patterns = [
        [1, 0], [2, 0],
        [-1, 1], [0, 1], [1, 1],
        [0, 2]
      ];
      
      for (const [dx, dy] of patterns) {
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const ni = (ny * width + nx) * 3;
          buffer[ni] += errorR;
          buffer[ni + 1] += errorG;
          buffer[ni + 2] += errorB;
        }
      }
    }
  }
  
  return result;
};

/**
 * Apply Jarvis-Judice-Ninke dithering
 */
const applyJarvisDithering = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  palette: RGB[]
): Uint8ClampedArray => {
  // Similar implementation with different error distribution pattern
  const result = new Uint8ClampedArray(data);
  const buffer = new Float32Array(width * height * 3);
  
  // Initialize buffer
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const j = (y * width + x) * 3;
      buffer[j] = data[i];
      buffer[j + 1] = data[i + 1];
      buffer[j + 2] = data[i + 2];
    }
  }
  
  // Apply Jarvis dithering
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 3;
      const resultIndex = (y * width + x) * 4;
      
      // Get current pixel color
      const oldR = Math.max(0, Math.min(255, Math.round(buffer[index])));
      const oldG = Math.max(0, Math.min(255, Math.round(buffer[index + 1])));
      const oldB = Math.max(0, Math.min(255, Math.round(buffer[index + 2])));
      
      // Find the closest color
      const newColor = findClosestColor(oldR, oldG, oldB, palette);
      
      // Update result
      result[resultIndex] = newColor.r;
      result[resultIndex + 1] = newColor.g;
      result[resultIndex + 2] = newColor.b;
      
      // Calculate errors
      const errorR = oldR - newColor.r;
      const errorG = oldG - newColor.g;
      const errorB = oldB - newColor.b;
      
      // Jarvis-Judice-Ninke kernel:
      // (Forward rows only)
      //     X   7   5
      // 3   5   7   5   3
      // 1   3   5   3   1
      // (divided by 48)
      
      const patterns = [
        [1, 0, 7], [2, 0, 5],
        [-2, 1, 3], [-1, 1, 5], [0, 1, 7], [1, 1, 5], [2, 1, 3],
        [-2, 2, 1], [-1, 2, 3], [0, 2, 5], [1, 2, 3], [2, 2, 1]
      ];
      
      for (const [dx, dy, weight] of patterns) {
        const nx = x + dx;
        const ny = y + dy;
        
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const ni = (ny * width + nx) * 3;
          buffer[ni] += errorR * weight / 48;
          buffer[ni + 1] += errorG * weight / 48;
          buffer[ni + 2] += errorB * weight / 48;
        }
      }
    }
  }
  
  return result;
};