/**
 * Dithering utility functions for image processing.
 */

// Dithering algorithm types
const DitheringAlgorithm = {
  FloydSteinberg: 'floyd-steinberg',
  Ordered: 'ordered',
  Random: 'random'
};

// Color palette options
const ColorPalette = {
  BlackAndWhite: 'black-and-white',
  Grayscale: 'grayscale',
  CustomRGB: 'custom-rgb'
};

// Built-in preset palettes
const PRESET_PALETTES = {
  'gameboy': [
    { r: 15, g: 56, b: 15 },
    { r: 48, g: 98, b: 48 },
    { r: 139, g: 172, b: 15 },
    { r: 155, g: 188, b: 15 }
  ],
  'cga': [
    { r: 0, g: 0, b: 0 },
    { r: 85, g: 255, b: 255 },
    { r: 255, g: 85, b: 255 },
    { r: 255, g: 255, b: 255 }
  ],
  'commodore64': [
    { r: 0, g: 0, b: 0 },
    { r: 62, g: 49, b: 162 },
    { r: 87, g: 66, b: 0 },
    { r: 140, g: 62, b: 157 },
    { r: 84, g: 84, b: 84 },
    { r: 120, g: 115, b: 223 },
    { r: 144, g: 95, b: 37 },
    { r: 124, g: 112, b: 218 },
    { r: 128, g: 128, b: 0 },
    { r: 104, g: 169, b: 65 },
    { r: 187, g: 119, b: 109 },
    { r: 122, g: 191, b: 199 },
    { r: 171, g: 171, b: 171 },
    { r: 208, g: 220, b: 113 },
    { r: 172, g: 234, b: 136 },
    { r: 255, g: 255, b: 255 }
  ]
};

/**
 * Applies dithering to an ImageData object
 */
function applyDithering(imageData, settings) {
  // Create a copy of the image data to work with
  const { width, height } = imageData;
  const outputData = new ImageData(width, height);
  
  // Copy original data
  for (let i = 0; i < imageData.data.length; i++) {
    outputData.data[i] = imageData.data[i];
  }
  
  // Apply brightness and contrast adjustments if specified
  if (settings.brightness !== undefined || settings.contrast !== undefined) {
    adjustBrightnessContrast(
      outputData, 
      settings.brightness || 0, 
      settings.contrast || 0
    );
  }
  
  // Apply the selected dithering algorithm
  switch (settings.algorithm) {
    case DitheringAlgorithm.FloydSteinberg:
      return floydSteinbergDithering(outputData, settings);
    case DitheringAlgorithm.Ordered:
      return orderedDithering(outputData, settings);
    case DitheringAlgorithm.Random:
      return randomDithering(outputData, settings);
    default:
      return outputData;
  }
}

/**
 * Gets the nearest color from the palette
 */
function getNearestColor(r, g, b, palette, customPalette) {
  if (palette === ColorPalette.BlackAndWhite) {
    // Simple threshold for black and white
    const intensity = 0.299 * r + 0.587 * g + 0.114 * b;
    return intensity > 127 ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
  } else if (palette === ColorPalette.Grayscale) {
    // For 8-bit grayscale, round to nearest 32 levels
    const intensity = Math.floor((0.299 * r + 0.587 * g + 0.114 * b) / 32) * 32;
    return { r: intensity, g: intensity, b: intensity };
  } else if (palette === ColorPalette.CustomRGB && customPalette && customPalette.length > 0) {
    // Find the closest color in the custom palette
    let minDistance = Number.MAX_VALUE;
    let closestColor = customPalette[0];
    
    for (const color of customPalette) {
      const distance = Math.sqrt(
        Math.pow(r - color.r, 2) +
        Math.pow(g - color.g, 2) +
        Math.pow(b - color.b, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        closestColor = color;
      }
    }
    
    return closestColor;
  }
  
  // Default to original color if no matching palette
  return { r, g, b };
}

/**
 * Floyd-Steinberg dithering algorithm implementation
 */
function floydSteinbergDithering(imageData, settings) {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);
  const outputData = output.data;
  
  // Create buffer arrays for the original pixel values and error diffusion
  const buffer = new Float32Array(width * height * 3); // RGB buffer
  
  // Copy original values to buffer
  for (let i = 0, j = 0; i < data.length; i += 4, j += 3) {
    buffer[j] = data[i];       // R
    buffer[j + 1] = data[i + 1]; // G
    buffer[j + 2] = data[i + 2]; // B
  }
  
  // Apply Floyd-Steinberg dithering
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 3;
      
      // Get current pixel values
      const oldR = Math.min(255, Math.max(0, buffer[index]));
      const oldG = Math.min(255, Math.max(0, buffer[index + 1]));
      const oldB = Math.min(255, Math.max(0, buffer[index + 2]));
      
      // Find the nearest color in the palette
      const newColor = getNearestColor(oldR, oldG, oldB, settings.palette, settings.customPalette);
      
      // Calculate quantization errors
      const errorR = oldR - newColor.r;
      const errorG = oldG - newColor.g;
      const errorB = oldB - newColor.b;
      
      // Set output pixel to new color
      const outputIndex = (y * width + x) * 4;
      outputData[outputIndex] = newColor.r;
      outputData[outputIndex + 1] = newColor.g;
      outputData[outputIndex + 2] = newColor.b;
      outputData[outputIndex + 3] = data[(y * width + x) * 4 + 3]; // Keep original alpha
      
      // Distribute errors using Floyd-Steinberg weights
      // Spread the error to neighboring pixels according to this pattern:
      //      X   7/16
      //  3/16 5/16 1/16
      
      // Right pixel (x+1, y)
      if (x < width - 1) {
        buffer[index + 3] += errorR * 7 / 16;
        buffer[index + 4] += errorG * 7 / 16;
        buffer[index + 5] += errorB * 7 / 16;
      }
      
      // Bottom-left pixel (x-1, y+1)
      if (x > 0 && y < height - 1) {
        buffer[index + width * 3 - 3] += errorR * 3 / 16;
        buffer[index + width * 3 - 2] += errorG * 3 / 16;
        buffer[index + width * 3 - 1] += errorB * 3 / 16;
      }
      
      // Bottom pixel (x, y+1)
      if (y < height - 1) {
        buffer[index + width * 3] += errorR * 5 / 16;
        buffer[index + width * 3 + 1] += errorG * 5 / 16;
        buffer[index + width * 3 + 2] += errorB * 5 / 16;
      }
      
      // Bottom-right pixel (x+1, y+1)
      if (x < width - 1 && y < height - 1) {
        buffer[index + width * 3 + 3] += errorR * 1 / 16;
        buffer[index + width * 3 + 4] += errorG * 1 / 16;
        buffer[index + width * 3 + 5] += errorB * 1 / 16;
      }
    }
  }
  
  return output;
}

/**
 * Ordered dithering algorithm implementation (Bayer matrix)
 */
function orderedDithering(imageData, settings) {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);
  const outputData = output.data;
  
  // 4x4 Bayer matrix for ordered dithering
  const bayerMatrix = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5]
  ];
  
  // Normalize the Bayer matrix (0-15 -> 0-1)
  const normalizedMatrix = bayerMatrix.map(row => 
    row.map(val => val / 16)
  );
  
  // Apply ordered dithering
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      
      // Get current pixel values
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];
      
      // Get threshold from Bayer matrix
      const threshold = normalizedMatrix[y % 4][x % 4];
      
      // Apply threshold as an adjustment to the color values
      const adjustedR = r + (threshold - 0.5) * 32;
      const adjustedG = g + (threshold - 0.5) * 32;
      const adjustedB = b + (threshold - 0.5) * 32;
      
      // Find the nearest color in the palette
      const newColor = getNearestColor(
        Math.max(0, Math.min(255, adjustedR)),
        Math.max(0, Math.min(255, adjustedG)),
        Math.max(0, Math.min(255, adjustedB)),
        settings.palette,
        settings.customPalette
      );
      
      // Set output pixel to new color
      outputData[index] = newColor.r;
      outputData[index + 1] = newColor.g;
      outputData[index + 2] = newColor.b;
      outputData[index + 3] = a;  // Keep original alpha
    }
  }
  
  return output;
}

/**
 * Random dithering algorithm implementation
 */
function randomDithering(imageData, settings) {
  const { width, height, data } = imageData;
  const output = new ImageData(width, height);
  const outputData = output.data;
  
  // Apply random dithering
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4;
      
      // Get current pixel values
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];
      
      // Generate random noise (-16 to +16)
      const noise = (Math.random() - 0.5) * 32;
      
      // Apply noise to colors
      const adjustedR = r + noise;
      const adjustedG = g + noise;
      const adjustedB = b + noise;
      
      // Find the nearest color in the palette
      const newColor = getNearestColor(
        Math.max(0, Math.min(255, adjustedR)),
        Math.max(0, Math.min(255, adjustedG)),
        Math.max(0, Math.min(255, adjustedB)),
        settings.palette,
        settings.customPalette
      );
      
      // Set output pixel to new color
      outputData[index] = newColor.r;
      outputData[index + 1] = newColor.g;
      outputData[index + 2] = newColor.b;
      outputData[index + 3] = a;  // Keep original alpha
    }
  }
  
  return output;
}

/**
 * Adjust brightness and contrast of an ImageData object
 */
function adjustBrightnessContrast(imageData, brightness, contrast) {
  const { data } = imageData;
  
  // Convert percentage values to factor values
  const brightnessF = brightness / 100;  // -1 to 1
  const contrastF = contrast / 100;      // -1 to 1
  
  // Calculate contrast factor using a curve for more natural adjustment
  const contrastFactor = Math.tan((contrastF + 1) * Math.PI / 4);
  
  // Process each pixel
  for (let i = 0; i < data.length; i += 4) {
    // Adjust RGB channels
    for (let j = 0; j < 3; j++) {
      // Normalize the color value to range -0.5 to 0.5
      let value = data[i + j] / 255 - 0.5;
      
      // Apply contrast adjustment
      value *= contrastFactor;
      
      // Apply brightness adjustment
      value += brightnessF;
      
      // Convert back to 0-255 range and clamp
      data[i + j] = Math.max(0, Math.min(255, Math.round((value + 0.5) * 255)));
    }
    // Alpha channel remains unchanged
  }
  
  return imageData;
}

// Process an image and update the preview
function processImage() {
  if (!originalFile) return;
  
  // Show loading state
  previewContainer.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>Processing image...</p>
    </div>
  `;
  
  // Use a timeout to allow the UI to update before processing starts
  setTimeout(async () => {
    try {
      // Load image
      const image = await loadImage(originalImageUrl);
      
      // Convert to image data with scaled resolution
      const imageData = imageToImageData(image, settings.resolution);
      
      // Apply dithering
      const ditheredImageData = applyDithering(imageData, settings);
      
      // Convert back to data URL
      ditheredDataUrl = imageDataToDataURL(ditheredImageData);
      
      // Update preview
      previewContainer.innerHTML = `
        <div class="preview-container">
          <div class="preview-item">
            <p class="preview-label">Original</p>
            <div class="preview-image-container">
              <img src="${originalImageUrl}" alt="Original image" class="preview-image">
            </div>
          </div>
          
          <div class="preview-item">
            <p class="preview-label">Dithered</p>
            <div class="preview-image-container">
              <img src="${ditheredDataUrl}" alt="Dithered image" class="preview-image">
            </div>
          </div>
        </div>
      `;
      
      // Enable download button
      downloadBtn.disabled = false;
    } catch (error) {
      previewContainer.innerHTML = `
        <div class="error-message">
          <p>Error processing image: ${error.message}</p>
        </div>
      `;
    }
  }, 100);
}

// Show error message
function showError(message) {
  errorMessage.textContent = message;
  errorMessage.style.display = 'block';
}