'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  loadImage,
  drawImageToCanvas,
  getImageData,
  createCanvasFromImageData,
  canvasToDataURL,
  canvasToBlob
} from '../utils/imageUtils';
import { applyDithering, DitheringSettings } from '../utils/dithering';

interface ImagePreviewProps {
  originalImageUrl: string;
  settings: DitheringSettings;
  onProcessed?: (dataUrl: string, blob: Blob) => void;
}

export const ImagePreview = ({
  originalImageUrl,
  settings,
  onProcessed
}: ImagePreviewProps) => {
  const [originalDataUrl, setOriginalDataUrl] = useState<string | null>(null);
  const [ditheredDataUrl, setDitheredDataUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Process the image when settings or original image changes
  useEffect(() => {
    if (!originalImageUrl) return;

    const processImage = async () => {
      try {
        setIsProcessing(true);
        setError(null);

        // Load the image
        const img = await loadImage(originalImageUrl);
        
        // Draw image to canvas
        const canvas = drawImageToCanvas(img);
        
        // Get image data from canvas
        const imageData = getImageData(canvas);
        
        // Apply dithering
        const ditheredImageData = applyDithering(imageData, settings);
        
        // Convert back to canvas and get data URL
        const ditheredCanvas = createCanvasFromImageData(ditheredImageData);
        const dataUrl = canvasToDataURL(ditheredCanvas);
        
        // Create a blob for download
        const blob = await canvasToBlob(ditheredCanvas);
        
        // Update state
        setDitheredDataUrl(dataUrl);
        
        // Call onProcessed callback
        if (onProcessed) {
          onProcessed(dataUrl, blob);
        }
      } catch (err) {
        console.error('Error processing image:', err);
        setError('Failed to process image. Please try again with a different image.');
      } finally {
        setIsProcessing(false);
      }
    };

    processImage();
  }, [originalImageUrl, settings, onProcessed]);

  return (
    <div className="space-y-4">
      {error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      ) : isProcessing ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : ditheredDataUrl ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Original</h3>
            <img 
              src={originalImageUrl} 
              alt="Original" 
              className="max-w-full h-auto rounded-md border border-gray-200"
            />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Dithered</h3>
            <img 
              src={ditheredDataUrl} 
              alt="Dithered" 
              className="max-w-full h-auto rounded-md border border-gray-200"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center p-12">
          <p className="text-gray-500">Processing image...</p>
        </div>
      )}
    </div>
  );
};