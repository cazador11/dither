'use client';

import { useState, useEffect } from 'react';
import { DitheringAlgorithm, ColorPalette, DitheringSettings, RGB } from '../utils/dithering';

interface DitheringControlsProps {
  settings: DitheringSettings;
  onSettingsChange: (settings: DitheringSettings) => void;
}

export const DitheringControls = ({
  settings,
  onSettingsChange,
}: DitheringControlsProps) => {
  const handleAlgorithmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const algorithm = e.target.value as DitheringAlgorithm;
    onSettingsChange({ ...settings, algorithm });
  };

  const handlePaletteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const palette = e.target.value as ColorPalette;
    onSettingsChange({ ...settings, palette });
  };

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const brightness = parseInt(e.target.value, 10);
    onSettingsChange({ ...settings, brightness });
  };

  const handleContrastChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const contrast = parseInt(e.target.value, 10);
    onSettingsChange({ ...settings, contrast });
  };

  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const threshold = parseInt(e.target.value, 10);
    onSettingsChange({ ...settings, threshold });
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="algorithm" className="block text-sm font-medium text-gray-700">
          Dithering Algorithm
        </label>
        <select
          id="algorithm"
          value={settings.algorithm}
          onChange={handleAlgorithmChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value={DitheringAlgorithm.NONE}>No Dithering</option>
          <option value={DitheringAlgorithm.ORDERED}>Ordered</option>
          <option value={DitheringAlgorithm.FLOYD_STEINBERG}>Floyd-Steinberg</option>
          <option value={DitheringAlgorithm.ATKINSON}>Atkinson</option>
          <option value={DitheringAlgorithm.JARVIS}>Jarvis</option>
        </select>
      </div>

      <div>
        <label htmlFor="palette" className="block text-sm font-medium text-gray-700">
          Color Palette
        </label>
        <select
          id="palette"
          value={settings.palette}
          onChange={handlePaletteChange}
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
        >
          <option value={ColorPalette.MONOCHROME}>Monochrome</option>
          <option value={ColorPalette.GRAYSCALE_4}>Grayscale (4 colors)</option>
          <option value={ColorPalette.GRAYSCALE_8}>Grayscale (8 colors)</option>
          <option value={ColorPalette.RGB_8}>8-color RGB</option>
          <option value={ColorPalette.SEPIA}>Sepia</option>
        </select>
      </div>

      <div>
        <label htmlFor="brightness" className="block text-sm font-medium text-gray-700">
          Brightness: {settings.brightness}
        </label>
        <input
          type="range"
          id="brightness"
          min="-100"
          max="100"
          step="1"
          value={settings.brightness}
          onChange={handleBrightnessChange}
          className="mt-1 block w-full"
        />
      </div>

      <div>
        <label htmlFor="contrast" className="block text-sm font-medium text-gray-700">
          Contrast: {settings.contrast}
        </label>
        <input
          type="range"
          id="contrast"
          min="-100"
          max="100"
          step="1"
          value={settings.contrast}
          onChange={handleContrastChange}
          className="mt-1 block w-full"
        />
      </div>

      {settings.algorithm === DitheringAlgorithm.NONE && settings.palette === ColorPalette.MONOCHROME && (
        <div>
          <label htmlFor="threshold" className="block text-sm font-medium text-gray-700">
            Threshold: {settings.threshold}
          </label>
          <input
            type="range"
            id="threshold"
            min="0"
            max="255"
            step="1"
            value={settings.threshold}
            onChange={handleThresholdChange}
            className="mt-1 block w-full"
          />
        </div>
      )}
    </div>
  );
};