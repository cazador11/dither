'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { isValidImageType, isValidFileSize, fileToObjectURL } from '../utils/imageUtils';

interface ImageUploaderProps {
  onImageSelected: (imageUrl: string, file: File) => void;
  maxSizeMB?: number;
}

export const ImageUploader = ({
  onImageSelected,
  maxSizeMB = 5,
}: ImageUploaderProps) => {
  const [error, setError] = useState<string | null>(null);
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    if (acceptedFiles.length === 0) {
      return;
    }
    
    const file = acceptedFiles[0];
    
    if (!isValidImageType(file)) {
      setError('Please upload a valid image file (JPEG, PNG, or GIF)');
      return;
    }
    
    if (!isValidFileSize(file, maxSizeMB)) {
      setError(`File size exceeds the maximum limit of ${maxSizeMB}MB`);
      return;
    }
    
    const imageUrl = fileToObjectURL(file);
    onImageSelected(imageUrl, file);
  }, [onImageSelected, maxSizeMB]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1
  });
  
  // Clean up any object URLs when the component unmounts
  useEffect(() => {
    return () => {
      // No cleanup needed here as we handle object URL revocation in the parent component
    };
  }, []);
  
  return (
    <div>
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-6 cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          {isDragActive ? (
            <p className="text-blue-500">Drop the image here ...</p>
          ) : (
            <>
              <p className="text-gray-600">
                Drag & drop an image here, or click to select
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports: JPG, PNG, GIF (Max {maxSizeMB}MB)
              </p>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};