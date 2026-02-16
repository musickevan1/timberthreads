import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import type { CloudinaryUploadWidgetResults } from 'next-cloudinary';
import { Tab } from './types';
import { ImageAsset } from '@/app/api/gallery/types';

// Dynamically import CldUploadWidget to avoid SSR/build-time issues
const CldUploadWidget = dynamic(
  () => import('next-cloudinary').then(mod => mod.CldUploadWidget),
  { ssr: false }
);

interface UploadSectionProps {
  activeTab: Tab;
  filteredImages: ImageAsset[];
  actionInProgress: boolean;
  section: 'Facility' | 'Quilting';
  onUploadSuccess: () => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({
  activeTab,
  filteredImages,
  actionInProgress,
  section,
  onUploadSuccess
}) => {
  const [uploadError, setUploadError] = useState('');

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

      <CldUploadWidget
        signatureEndpoint="/api/cloudinary-signature"
        options={{
          folder: 'timber-threads/gallery',
          tags: [section.toLowerCase(), 'gallery'],
          maxFiles: 1,
          sources: ['local', 'url'],
          multiple: false,
          resourceType: 'image',
          clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
          maxFileSize: 10000000,
        }}
        onSuccess={async (result: CloudinaryUploadWidgetResults) => {
          if (result.info && typeof result.info !== 'string') {
            const { public_id, width, height } = result.info;

            try {
              const response = await fetch('/api/gallery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  src: public_id,
                  alt: public_id.split('/').pop() || 'Gallery image',
                  caption: (public_id.split('/').pop() || 'Image')
                    .replace(/-/g, ' ')
                    .replace(/_/g, ' ')
                    .split(' ')
                    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                    .join(' '),
                  section,
                  width,
                  height,
                }),
              });

              if (!response.ok) throw new Error('Failed to save image metadata');
              setUploadError('');
              onUploadSuccess();
            } catch (error) {
              console.error('Error saving upload metadata:', error);
              setUploadError('Upload succeeded but failed to save metadata. Please refresh the page.');
            }
          }
        }}
      >
        {({ open }) => (
          <div
            className="bg-stone-50 p-6 rounded-lg border-2 border-dashed border-stone-200 cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-colors"
            onClick={() => !actionInProgress && open()}
          >
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mb-4 text-stone-400"
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
              <p className="text-lg font-medium text-stone-700">Click to upload an image</p>
              <p className="mt-2 text-sm text-stone-500">
                Supports JPG, PNG, GIF, and WebP up to 10MB
              </p>
              <button
                type="button"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-300 disabled:cursor-not-allowed"
                disabled={actionInProgress}
              >
                Select Image
              </button>
            </div>
          </div>
        )}
      </CldUploadWidget>

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
    </div>
  );
};

export default UploadSection;
