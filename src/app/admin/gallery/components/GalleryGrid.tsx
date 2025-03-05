import React, { useState, useEffect, useRef } from 'react';
import { ImageAsset } from '@/app/api/gallery/types';
import { Tab } from './types';
import GalleryItem from './GalleryItem';
import EmptyState from './EmptyState';

interface GalleryGridProps {
  filteredImages: ImageAsset[];
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

const GalleryGrid: React.FC<GalleryGridProps> = ({
  filteredImages,
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
  // Local state for images to enable smooth reordering UI
  const [localImages, setLocalImages] = useState<ImageAsset[]>(filteredImages);
  
  // Mobile touch state
  const [touchDragging, setTouchDragging] = useState(false);
  const [touchDraggedItem, setTouchDraggedItem] = useState<string | null>(null);
  const [touchDraggedElement, setTouchDraggedElement] = useState<HTMLElement | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);
  
  // Handle moving an image up in order (for mobile)
  const handleMoveUp = async (image: ImageAsset) => {
    if (actionInProgress) return;
    
    // Find the current index of the image
    const currentIndex = localImages.findIndex(img => img.src === image.src);
    if (currentIndex <= 0) return; // Already at the top
    
    // Create a new array with the reordered items
    const reorderedImages = [...localImages];
    const [removed] = reorderedImages.splice(currentIndex, 1);
    reorderedImages.splice(currentIndex - 1, 0, removed);
    
    // Update local state for immediate UI feedback
    setLocalImages(reorderedImages);
    
    // Create a fake event to pass to handleDrop
    const fakeEvent = { preventDefault: () => {} } as React.DragEvent<HTMLDivElement>;
    
    // Call the parent handler to update the backend
    handleDrop(fakeEvent, localImages[currentIndex - 1].src);
  };
  
  // Handle moving an image down in order (for mobile)
  const handleMoveDown = async (image: ImageAsset) => {
    if (actionInProgress) return;
    
    // Find the current index of the image
    const currentIndex = localImages.findIndex(img => img.src === image.src);
    if (currentIndex === -1 || currentIndex >= localImages.length - 1) return; // Already at the bottom
    
    // Create a new array with the reordered items
    const reorderedImages = [...localImages];
    const [removed] = reorderedImages.splice(currentIndex, 1);
    reorderedImages.splice(currentIndex + 1, 0, removed);
    
    // Update local state for immediate UI feedback
    setLocalImages(reorderedImages);
    
    // Create a fake event to pass to handleDrop
    const fakeEvent = { preventDefault: () => {} } as React.DragEvent<HTMLDivElement>;
    
    // Call the parent handler to update the backend
    handleDrop(fakeEvent, localImages[currentIndex + 1].src);
  };

  // Update local images when filtered images change
  useEffect(() => {
    setLocalImages(filteredImages);
  }, [filteredImages]);
  
  // Don't use drag and drop for deleted items
  if (activeTab === 'deleted') {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.length > 0 ? (
            filteredImages.map((image) => (
              <GalleryItem
                key={image.src}
                image={image}
                activeTab={activeTab}
                isDragging={isDragging}
                draggedImage={draggedImage}
                actionInProgress={actionInProgress}
                handleDragStart={handleDragStart}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                handleDragEnd={handleDragEnd}
                handleUpdateCaption={handleUpdateCaption}
                confirmSoftDelete={confirmSoftDelete}
                confirmRestore={confirmRestore}
                confirmPermanentDelete={confirmPermanentDelete}
              />
            ))
          ) : (
            <EmptyState activeTab={activeTab} />
          )}
        </div>
      </div>
    );
  }
  
  // Handle drag start
  const onDragStart = (e: React.DragEvent<HTMLDivElement>, imageSrc: string) => {
    if (actionInProgress) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.setData('text/plain', imageSrc);
    
    // Create a transparent drag image
    const dragImage = new Image();
    dragImage.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(dragImage, 0, 0);
    
    handleDragStart(e, imageSrc);
  };
  
  // Handle drag over
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    // Add a class to the target element to indicate it's a drop target
    if (e.currentTarget.classList) {
      e.currentTarget.classList.add('drop-target');
    }
    
    handleDragOver(e);
  };
  
  // Handle drag leave
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Remove the drop target indicator
    if (e.currentTarget.classList) {
      e.currentTarget.classList.remove('drop-target');
    }
  };
  
  // Handle drop
  const onDrop = (e: React.DragEvent<HTMLDivElement>, targetImageSrc: string) => {
    e.preventDefault();
    
    // Remove the drop target indicator
    if (e.currentTarget.classList) {
      e.currentTarget.classList.remove('drop-target');
    }
    
    const sourceImageSrc = e.dataTransfer.getData('text/plain');
    if (!sourceImageSrc || sourceImageSrc === targetImageSrc) {
      return;
    }
    
    // Find the indices of the dragged and target images
    const sourceIndex = localImages.findIndex(img => img.src === sourceImageSrc);
    const targetIndex = localImages.findIndex(img => img.src === targetImageSrc);
    
    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }
    
    // Create a new array with the reordered items
    const reorderedImages = [...localImages];
    const [removed] = reorderedImages.splice(sourceIndex, 1);
    reorderedImages.splice(targetIndex, 0, removed);
    
    // Update local state for immediate UI feedback
    setLocalImages(reorderedImages);
    
    // Call the parent handler to update the backend
    handleDrop(e, targetImageSrc);
  };
  
  // Mobile touch handlers
  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>, imageSrc: string) => {
    if (actionInProgress) return;
    
    // Store the touch start position
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
    
    // Start a timer for long press detection
    longPressTimer.current = setTimeout(() => {
      // Long press detected, start dragging
      setTouchDragging(true);
      setTouchDraggedItem(imageSrc);
      setTouchDraggedElement(e.currentTarget as HTMLElement);
      
      // Add visual feedback
      if (e.currentTarget && e.currentTarget.classList) {
        e.currentTarget.classList.add('touch-dragging');
      }
      
      // Create a fake drag event to notify the parent
      const fakeEvent = { preventDefault: () => {} } as React.DragEvent<HTMLDivElement>;
      handleDragStart(fakeEvent, imageSrc);
    }, 500); // 500ms long press
  };
  
  const onTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchDragging || !touchDraggedItem || !touchDraggedElement) {
      // If not dragging but timer is running, check if we should cancel the timer
      if (longPressTimer.current && touchStartPos.current) {
        const dx = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
        const dy = Math.abs(e.touches[0].clientY - touchStartPos.current.y);
        
        // If moved more than 10px in any direction, cancel the long press
        if (dx > 10 || dy > 10) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
      }
      return;
    }
    
    e.preventDefault(); // Prevent scrolling while dragging
    
    // Find the element under the touch point
    const touch = e.touches[0];
    const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
    
    // Find the gallery item container
    let galleryItemContainer = elementUnderTouch;
    while (galleryItemContainer && !galleryItemContainer.dataset?.imageSrc) {
      galleryItemContainer = galleryItemContainer.parentElement as HTMLElement;
      if (!galleryItemContainer) break;
    }
    
    // If we found a valid drop target
    if (galleryItemContainer && galleryItemContainer.dataset?.imageSrc) {
      // Add drop target indicator
      document.querySelectorAll('.drop-target').forEach(el => {
        el.classList.remove('drop-target');
      });
      galleryItemContainer.classList.add('drop-target');
    }
  };
  
  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>, targetImageSrc: string) => {
    // Clear the long press timer if it's still running
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // If not dragging, do nothing
    if (!touchDragging || !touchDraggedItem || !touchDraggedElement) {
      return;
    }
    
    // Remove visual feedback
    if (touchDraggedElement && touchDraggedElement.classList) {
      touchDraggedElement.classList.remove('touch-dragging');
    }
    
    // Find the element under the touch point
    const touch = e.changedTouches[0];
    const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement;
    
    // Find the gallery item container
    let galleryItemContainer = elementUnderTouch;
    while (galleryItemContainer && !galleryItemContainer.dataset?.imageSrc) {
      galleryItemContainer = galleryItemContainer.parentElement as HTMLElement;
      if (!galleryItemContainer) break;
    }
    
    // If we found a valid drop target
    if (galleryItemContainer && galleryItemContainer.dataset?.imageSrc) {
      const dropTargetImageSrc = galleryItemContainer.dataset.imageSrc;
      
      // If dropping on a different item
      if (dropTargetImageSrc !== touchDraggedItem) {
        // Find the indices of the dragged and target images
        const sourceIndex = localImages.findIndex(img => img.src === touchDraggedItem);
        const targetIndex = localImages.findIndex(img => img.src === dropTargetImageSrc);
        
        if (sourceIndex !== -1 && targetIndex !== -1) {
          // Create a new array with the reordered items
          const reorderedImages = [...localImages];
          const [removed] = reorderedImages.splice(sourceIndex, 1);
          reorderedImages.splice(targetIndex, 0, removed);
          
          // Update local state for immediate UI feedback
          setLocalImages(reorderedImages);
          
          // Call the parent handler to update the backend
          const fakeEvent = { preventDefault: () => {} } as React.DragEvent<HTMLDivElement>;
          handleDrop(fakeEvent, dropTargetImageSrc);
        }
      }
    }
    
    // Remove any drop target indicators
    document.querySelectorAll('.drop-target').forEach(el => {
      el.classList.remove('drop-target');
    });
    
    // Reset touch dragging state
    setTouchDragging(false);
    setTouchDraggedItem(null);
    setTouchDraggedElement(null);
    
    // Notify parent that drag has ended
    handleDragEnd();
  };
  
  return (
    <div className="p-6">
      {/* Tips removed as requested */}
      {localImages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {localImages.map((image) => (
            <div
              key={image.src}
              data-image-src={image.src}
              className={`relative ${isDragging && draggedImage === image.src ? 'opacity-50 border-dashed border-teal-500' : ''} ${touchDragging && touchDraggedItem === image.src ? 'touch-dragging' : ''}`}
              draggable={!actionInProgress}
              onDragStart={(e) => onDragStart(e, image.src)}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={(e) => onDrop(e, image.src)}
              onDragEnd={(e) => {
                // Remove any drop target indicators
                document.querySelectorAll('.drop-target').forEach(el => {
                  el.classList.remove('drop-target');
                });
                handleDragEnd();
              }}
            >
              <GalleryItem
                image={image}
                activeTab={activeTab}
                isDragging={isDragging}
                draggedImage={draggedImage}
                actionInProgress={actionInProgress}
                handleDragStart={handleDragStart}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
                handleDragEnd={handleDragEnd}
                handleUpdateCaption={handleUpdateCaption}
                confirmSoftDelete={confirmSoftDelete}
                confirmRestore={confirmRestore}
                confirmPermanentDelete={confirmPermanentDelete}
                handleMoveUp={handleMoveUp}
                handleMoveDown={handleMoveDown}
                isFirst={localImages.indexOf(image) === 0}
                isLast={localImages.indexOf(image) === localImages.length - 1}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EmptyState activeTab={activeTab} />
        </div>
      )}
    </div>
  );
};

export default GalleryGrid;
