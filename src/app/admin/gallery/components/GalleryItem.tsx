import React, { useState, useRef, useEffect } from 'react';
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
  handleMoveUp?: (image: ImageAsset) => void;
  handleMoveDown?: (image: ImageAsset) => void;
  isFirst?: boolean;
  isLast?: boolean;
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
  confirmPermanentDelete,
  handleMoveUp,
  handleMoveDown,
  isFirst,
  isLast
}) => {
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionDraft, setCaptionDraft] = useState(image.caption);
  const [showFullCaption, setShowFullCaption] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Update draft when image caption changes externally
  useEffect(() => {
    setCaptionDraft(image.caption);
  }, [image.caption]);
  
  // Auto-focus and auto-resize textarea when editing
  useEffect(() => {
    if (isEditingCaption && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditingCaption]);
  
  // Handle textarea resize on input
  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };
  
  // Save caption changes
  const saveCaption = () => {
    if (captionDraft !== image.caption) {
      handleUpdateCaption(image, captionDraft);
    }
    setIsEditingCaption(false);
  };
  
  // Handle keyboard events in textarea
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      saveCaption();
    } else if (e.key === 'Escape') {
      setCaptionDraft(image.caption);
      setIsEditingCaption(false);
    }
  };
  
  // Truncate caption for display
  const displayCaption = image.caption.length > 50 && !showFullCaption
    ? `${image.caption.substring(0, 50)}...`
    : image.caption;
  
  return (
    <div 
      key={image.src} 
      className={`bg-white p-4 rounded-lg shadow-sm border border-stone-200 ${
        isDragging && draggedImage === image.src ? 'opacity-50 border-dashed border-teal-500' : ''
      } ${
        activeTab !== 'deleted' && !isEditingCaption ? 'cursor-grab' : ''
      } transition-all duration-200 h-full`}
    >
      <div className="relative aspect-square mb-4 overflow-hidden rounded-md">
        {/* Reordering buttons - visible on all devices */}
        {activeTab !== 'deleted' && handleMoveUp && handleMoveDown && (
          <div className="absolute left-2 top-2 flex flex-col space-y-2 z-10">
            <button
              onClick={() => handleMoveUp && handleMoveUp(image)}
              disabled={isFirst || actionInProgress}
              className={`bg-teal-500 rounded-full p-2 shadow-md text-white hover:bg-teal-600 active:bg-teal-700 transition-colors ${isFirst ? 'opacity-50 cursor-not-allowed bg-gray-400' : ''}`}
              aria-label="Move up"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <button
              onClick={() => handleMoveDown && handleMoveDown(image)}
              disabled={isLast || actionInProgress}
              className={`bg-teal-500 rounded-full p-2 shadow-md text-white hover:bg-teal-600 active:bg-teal-700 transition-colors ${isLast ? 'opacity-50 cursor-not-allowed bg-gray-400' : ''}`}
              aria-label="Move down"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
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
      
      {isEditingCaption ? (
        <div className="mb-3">
          <textarea
            ref={textareaRef}
            value={captionDraft}
            onChange={(e) => setCaptionDraft(e.target.value)}
            onInput={handleTextareaInput}
            onKeyDown={handleKeyDown}
            className="block w-full px-3 py-2 border border-stone-300 rounded-md shadow-sm text-sm focus:ring-teal-500 focus:border-teal-500 min-h-[80px] resize-none"
            placeholder="Image caption"
            disabled={actionInProgress}
          />
          <div className="flex justify-between items-center mt-2 text-xs text-stone-500">
            <span>{captionDraft.length} characters</span>
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => {
                  setCaptionDraft(image.caption);
                  setIsEditingCaption(false);
                }}
                className="px-2 py-1 text-stone-600 hover:text-stone-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveCaption}
                className="px-2 py-1 bg-teal-50 text-teal-700 rounded hover:bg-teal-100"
              >
                Save
              </button>
            </div>
          </div>
          <div className="text-xs text-stone-500 mt-1">
            Press Ctrl+Enter to save, Esc to cancel
          </div>
        </div>
      ) : (
        <div 
          className="mb-3 px-3 py-2 border border-stone-200 rounded-md text-sm min-h-[40px] cursor-pointer hover:border-stone-300"
          onClick={() => !actionInProgress && activeTab !== 'deleted' && setIsEditingCaption(true)}
        >
          {image.caption ? (
            <>
              <p className="text-stone-700">{displayCaption}</p>
              {image.caption.length > 50 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowFullCaption(!showFullCaption);
                  }}
                  className="text-xs text-teal-600 hover:text-teal-700 mt-1"
                >
                  {showFullCaption ? 'Show less' : 'Show more'}
                </button>
              )}
            </>
          ) : (
            <p className="text-stone-400 italic">Add a caption...</p>
          )}
        </div>
      )}
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
