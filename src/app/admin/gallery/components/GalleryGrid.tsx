import React from 'react';
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
};

export default GalleryGrid;
