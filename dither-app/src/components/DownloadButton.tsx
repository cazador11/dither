'use client';

import React from 'react';

interface DownloadButtonProps {
  dataUrl: string | null;
  fileName: string;
  disabled?: boolean;
}

export const DownloadButton = ({
  dataUrl,
  fileName,
  disabled = false
}: DownloadButtonProps) => {
  const handleDownload = () => {
    if (!dataUrl) return;
    
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <button
      onClick={handleDownload}
      disabled={disabled || !dataUrl}
      className={`w-full px-4 py-2 text-white font-medium rounded-md ${
        disabled || !dataUrl
          ? 'bg-gray-300 cursor-not-allowed'
          : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
      }`}
    >
      Download Dithered Image
    </button>
  );
};