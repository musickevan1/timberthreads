import React, { useRef } from 'react';
import { Tab } from './types';
import { ImageAsset } from '@/app/api/gallery/types';

interface UploadSectionProps {
  activeTab: Tab;
  filteredImages: ImageAsset[];
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string;
  actionInProgress: boolean;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      
      <div className="bg-stone-50 p-6 rounded-lg border border-stone-200">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex-grow">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading || actionInProgress}
              className="block w-full text-sm text-stone-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-medium
                file:bg-teal-50 file:text-teal-700
                hover:file:bg-teal-100
                disabled:opacity-50"
            />
          </div>
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || actionInProgress}
            className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-300 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Image
              </>
            )}
          </button>
        </div>
        
        {isUploading && (
          <div className="mt-4">
            <div className="w-full bg-stone-200 rounded-full h-2.5">
              <div 
                className="bg-teal-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p className="text-sm text-stone-600 mt-1">Uploading: {uploadProgress}%</p>
          </div>
        )}
        
        {uploadError && (
          <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {uploadError}
          </div>
        )}
      </div>
      
      {filteredImages.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 rounded-md flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-700">
            <span className="font-semibold">Tip:</span> You can drag and drop images to reorder them. The order will be reflected on the website.
          </p>
        </div>
      )}
    </div>
  );
};

export default UploadSection;
