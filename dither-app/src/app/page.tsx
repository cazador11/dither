'use client';

import { useState } from 'react';
import { ImageUploader } from '../components/ImageUploader';
import { DitheringControls } from '../components/DitheringControls';
import { ImagePreview } from '../components/ImagePreview';
import { DownloadButton } from '../components/DownloadButton';
import { DitheringAlgorithm, ColorPalette, DitheringSettings } from '../utils/dithering';
import { releaseObjectURL } from '../utils/imageUtils';

export default function Home() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ditheredDataUrl, setDitheredDataUrl] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [settings, setSettings] = useState<DitheringSettings>({
    algorithm: DitheringAlgorithm.FLOYD_STEINBERG,
    palette: ColorPalette.MONOCHROME,
    brightness: 0,
    contrast: 0,
    threshold: 127
  });
  
  const handleImageSelected = (url: string, file: File) => {
    // Release previous object URL to prevent memory leaks
    if (imageUrl) {
      releaseObjectURL(imageUrl);
    }
    
    setImageUrl(url);
    setCurrentFile(file);
    setDitheredDataUrl(null);
  };
  
  const handleSettingsChange = (newSettings: DitheringSettings) => {
    setSettings(newSettings);
  };
  
  const handleProcessed = (dataUrl: string, blob: Blob) => {
    setDitheredDataUrl(dataUrl);
  };
  
  return (
    <main className="flex min-h-screen flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Image Dithering Tool</h1>
          <p className="mt-1 text-sm text-gray-600">
            Upload an image and convert it into a dithered, retro-style image
          </p>
        </div>
      </header>
      
      <div className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-6 space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">Upload Image</h2>
                <ImageUploader onImageSelected={handleImageSelected} />
                
                {imageUrl && (
                  <>
                    <h2 className="text-xl font-semibold text-gray-800 pt-6">Dithering Options</h2>
                    <DitheringControls 
                      settings={settings} 
                      onSettingsChange={handleSettingsChange} 
                    />
                    
                    <div className="pt-4">
                      <DownloadButton
                        dataUrl={ditheredDataUrl}
                        fileName={`dithered-${currentFile?.name || 'image.png'}`}
                        disabled={!ditheredDataUrl}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="lg:col-span-2">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">Preview</h2>
                
                {imageUrl ? (
                  <ImagePreview
                    originalImageUrl={imageUrl}
                    settings={settings}
                    onProcessed={handleProcessed}
                  />
                ) : (
                  <div className="flex items-center justify-center p-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <p className="text-gray-500">
                        Upload an image to get started
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} Image Dithering Tool. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}