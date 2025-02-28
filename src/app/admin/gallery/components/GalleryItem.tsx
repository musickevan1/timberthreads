import React from 'react';
import Image from 'next/image';
import { ImageAsset } from '@/app/api/gallery/types';
import { Tab } from './types';

interface GalleryItemProps {
  image: ImageAsset;
  activeTab: Tab;
  isDragging: boolean;
  draggedImage: string | null;
  actionInProgress: boolean;
  handleDragStart: (e: React.DragEvent, imageSrc: string) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent, targetImageSrc: string) => void;
  handleDragEnd: () => void;
  handleUpdateCaption: (image: ImageAsset, newCaption: string) => void;
  confirmSoftDelete: (image: ImageAsset) => void;
  confirmRestore: (image: ImageAsset) => void;
  confirmPermanentDelete: (image: ImageAsset) => void;
}

const GalleryItem: React.FC<GalleryItemProps> = ({
  image,
  activeTab,
  isDragging,
  draggedImage,
  actionInProgress,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  handleUpdateCaption,
  confirmSoftDelete,
  confirmRestore,
  confirmPermanentDelete
}) => {
  return (
    <div 
      key={image.src} 
      className={`bg-white p-4 rounded-lg shadow-sm border border-stone-200 ${
        isDragging && draggedImage === image.src ? 'opacity-50 border-dashed border-teal-500' : ''
      } ${
        activeTab !== 'deleted' ? 'cursor-grab' : ''
      } transition-all duration-200`}
      draggable={activeTab !== 'deleted' && !actionInProgress}
      onDragStart={(e) => activeTab !== 'deleted' && !actionInProgress && handleDragStart(e, image.src)}
      onDragOver={handleDragOver}
      onDrop={(e) => activeTab !== 'deleted' && !actionInProgress && handleDrop(e, image.src)}
      onDragEnd={handleDragEnd}
    >
      <div className="relative aspect-square mb-4 overflow-hidden rounded-md">
        <Image
          src={image.src}
          alt={image.alt}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        {activeTab !== 'deleted' && (
          <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md">
            <span className="text-xs font-semibold text-stone-700">
              {image.order || '?'}
            </span>
          </div>
        )}
      </div>
      <input
        type="text"
        value={image.caption}
        onChange={(e) => handleUpdateCaption(image, e.target.value)}
        className="block w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm text-sm mb-3 focus:ring-teal-500 focus:border-teal-500"
        placeholder="Image caption"
        disabled={activeTab === 'deleted' || actionInProgress}
      />
      {activeTab === 'deleted' ? (
        <div className="flex space-x-2">
          <button
            onClick={() => confirmRestore(image)}
            disabled={actionInProgress}
            className="flex-1 flex justify-center items-center px-4 py-2 bg-teal-50 text-teal-700 rounded-md text-sm font-medium hover:bg-teal-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionInProgress ? (
              <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            )}
            Restore
          </button>
          <button
            onClick={() => confirmPermanentDelete(image)}
            disabled={actionInProgress}
            className="flex-1 flex justify-center items-center px-4 py-2 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {actionInProgress ? (
              <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            )}
            Delete Forever
          </button>
        </div>
      ) : (
        <button
          onClick={() => confirmSoftDelete(image)}
          disabled={actionInProgress}
          className="w-full flex justify-center items-center px-4 py-2 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {actionInProgress ? (
            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
          Remove
        </button>
      )}
    </div>
  );
};

export default GalleryItem;
