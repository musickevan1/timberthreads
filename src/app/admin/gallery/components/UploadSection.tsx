import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Tab } from './types';
import { ImageAsset } from '@/app/api/gallery/types';

interface UploadSectionProps {
  activeTab: Tab;
  filteredImages: ImageAsset[];
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string;
  actionInProgress: boolean;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement> | File) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({
  activeTab,
  filteredImages,
  isUploading,
  uploadProgress,
  uploadError,
  actionInProgress,
  handleImageUpload
}) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleImageUpload(acceptedFiles[0]);
    }
  }, [handleImageUpload]);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    disabled: isUploading || actionInProgress,
    maxFiles: 1,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false)
  });

  if (activeTab === 'deleted') {
    return null;
  }

  return (
    <div className="p-6 border-b border-stone-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-stone-800">Upload New Image</h3>
        <div className="text-sm text-stone-500">
          {filteredImages.length} images in this section
        </div>
      </div>
      
      <div 
        {...getRootProps()} 
        className={`bg-stone-50 p-6 rounded-lg border-2 border-dashed transition-colors duration-200 ${
          isDragActive ? 'border-teal-500 bg-teal-50' : 
          isDragReject ? 'border-red-500 bg-red-50' : 
          'border-stone-200'
        } ${isUploading || actionInProgress ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-12 w-12 mb-4 ${
              isDragActive ? 'text-teal-500' : 
              isDragReject ? 'text-red-500' : 
              'text-stone-400'
            }`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
            />
          </svg>
          
          {isDragActive ? (
            <p className="text-lg font-medium text-teal-600">Drop the image here...</p>
          ) : isDragReject ? (
            <p className="text-lg font-medium text-red-600">Only image files are accepted</p>
          ) : (
            <>
              <p className="text-lg font-medium text-stone-700">
                Drag & drop an image here, or click to select
              </p>
              <p className="mt-2 text-sm text-stone-500">
                Supports JPG, PNG, GIF, and WebP up to 10MB
              </p>
            </>
          )}
          
          {!isDragActive && !isDragReject && (
            <button
              type="button"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-300 disabled:cursor-not-allowed"
              disabled={isUploading || actionInProgress}
            >
              {isUploading ? 'Uploading...' : 'Select Image'}
            </button>
          )}
        </div>
        
        {isUploading && (
          <div className="mt-6">
            <div className="w-full bg-stone-200 rounded-full h-2.5">
              <div 
                className="bg-teal-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-stone-600 mt-2 text-center">Uploading: {uploadProgress}%</p>
          </div>
        )}
      </div>
      
      {uploadError && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md text-sm">
          <div className="flex">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{uploadError}</span>
          </div>
        </div>
      )}
      
      {/* Tip removed as requested */}
    </div>
  );
};

export default UploadSection;
