import React, { useState, useEffect } from 'react';
import { ImageAsset } from '@/app/api/gallery/types';
import { Tab } from './types';
import GalleryItem from './GalleryItem';
import EmptyState from './EmptyState';

interface GalleryGridProps {
  filteredImages: ImageAsset[];
  activeTab: Tab;
  actionInProgress: boolean;
  handleUpdateCaption: (image: ImageAsset, newCaption: string) => void;
  confirmSoftDelete: (image: ImageAsset) => void;
  confirmRestore: (image: ImageAsset) => void;
  confirmPermanentDelete: (image: ImageAsset) => void;
  handleSectionChange?: (image: ImageAsset, newSection: ImageAsset['section']) => void;
}

const GalleryGrid: React.FC<GalleryGridProps> = ({
  filteredImages,
  activeTab,
  actionInProgress,
  handleUpdateCaption,
  confirmSoftDelete,
  confirmRestore,
  confirmPermanentDelete,
  handleSectionChange: externalHandleSectionChange
}) => {
  const [localImages, setLocalImages] = useState<ImageAsset[]>(filteredImages);
  const [isApplying, setIsApplying] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setLocalImages(filteredImages);
  }, [filteredImages]);

  // Handle moving an image up in order
  const handleMoveUp = async (image: ImageAsset) => {
    if (actionInProgress) return;
    
    const currentIndex = localImages.findIndex(img => img.src === image.src);
    if (currentIndex <= 0) return;
    
    const reorderedImages = [...localImages];
    const [removed] = reorderedImages.splice(currentIndex, 1);
    reorderedImages.splice(currentIndex - 1, 0, removed);
    
    setLocalImages(reorderedImages);
    setHasUnsavedChanges(true);
  };
  
  // Handle moving an image down in order
  const handleMoveDown = async (image: ImageAsset) => {
    if (actionInProgress) return;
    
    const currentIndex = localImages.findIndex(img => img.src === image.src);
    if (currentIndex === -1 || currentIndex >= localImages.length - 1) return;
    
    const reorderedImages = [...localImages];
    const [removed] = reorderedImages.splice(currentIndex, 1);
    reorderedImages.splice(currentIndex + 1, 0, removed);
    
    setLocalImages(reorderedImages);
    setHasUnsavedChanges(true);
  };

  // Handle section change
  const handleLocalSectionChange = async (image: ImageAsset, newSection: ImageAsset['section']) => {
    if (actionInProgress || !externalHandleSectionChange) return;

    try {
      // Remove the image from local state immediately for better UI response
      setLocalImages(prev => prev.filter(img => img.src !== image.src));
      // Call the external handler
      await externalHandleSectionChange(image, newSection);
    } catch (error) {
      console.error('Error changing section:', error);
      // Revert the local state if there's an error
      setLocalImages(prev => [...prev, image]);
      alert('Failed to change section. Please try again.');
    }
  };

  // Handle applying order changes
  const handleApplyChanges = async () => {
    if (actionInProgress || activeTab === 'deleted' || !hasUnsavedChanges) return;

    try {
      setIsApplying(true);
      const orderedImageSrcs = localImages.map(img => img.src);
      
      const response = await fetch(`/api/gallery?action=updateOrder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: localImages[0].section,
          orderedImages: orderedImageSrcs
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order');
      }

      setHasUnsavedChanges(false);
      alert('Changes applied successfully!');
    } catch (error) {
      console.error('Error applying changes:', error);
      alert('Failed to update order. Please try again.');
    } finally {
      setIsApplying(false);
    }
  };

  const isDeleted = activeTab === 'deleted';

  if (isDeleted) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.length > 0 ? (
            filteredImages.map((image) => (
              <GalleryItem
                key={image.src}
                image={image}
                activeTab={activeTab}
                actionInProgress={actionInProgress}
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

  return (
    <div className="p-6">
      {/* Instructions */}
      {localImages.length > 0 && (
        <div className="mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <h3 className="text-blue-800 font-medium mb-2">Image Management</h3>
            <p className="text-blue-700 text-sm mb-2">
              Use the <strong>up and down arrow buttons</strong> to reorder images within a section.
            </p>
            <p className="text-blue-700 text-sm">
              Use the <strong>section dropdown</strong> to move an image to a different section.
            </p>
          </div>

          {hasUnsavedChanges && (
            <div className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <p className="text-yellow-800">
                You have unsaved changes to the image order.
              </p>
              <button
                onClick={handleApplyChanges}
                disabled={isApplying || actionInProgress}
                className="ml-4 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:bg-yellow-300 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isApplying ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Applying...
                  </>
                ) : (
                  'Apply Changes'
                )}
              </button>
            </div>
          )}
        </div>
      )}
      
      {/* Gallery Grid */}
      {localImages.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {localImages.map((image, index) => (
            <div key={image.src} className="relative">
              <GalleryItem
                image={image}
                activeTab={activeTab}
                actionInProgress={actionInProgress}
                handleUpdateCaption={handleUpdateCaption}
                confirmSoftDelete={confirmSoftDelete}
                confirmRestore={confirmRestore}
                confirmPermanentDelete={confirmPermanentDelete}
                handleMoveUp={handleMoveUp}
                handleMoveDown={handleMoveDown}
                handleSectionChange={handleLocalSectionChange}
                isFirst={index === 0}
                isLast={index === localImages.length - 1}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState activeTab={activeTab} />
      )}
    </div>
  );
};

export default GalleryGrid;
