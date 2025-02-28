'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ImageAsset, GalleryState } from '@/app/api/gallery/types';
import { Tab, DialogConfig } from './components/types';

// Import components
import GalleryHeader from './components/GalleryHeader';
import GalleryTabs from './components/GalleryTabs';
import UploadSection from './components/UploadSection';
import LoadingState from './components/LoadingState';
import GalleryGrid from './components/GalleryGrid';

export default function GalleryAdmin() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('projects');
  const [galleryData, setGalleryData] = useState<GalleryState>({ images: [], deletedImages: [] });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageAsset | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedImage, setDraggedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<DialogConfig>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    type: 'info',
    onConfirm: () => {}
  });

  useEffect(() => {
    // Check authentication
    const isAuthenticated = sessionStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      router.push('/admin');
      return;
    }

    // Load gallery data
    fetchGalleryData();
  }, [router]);

  const fetchGalleryData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/gallery');
      if (!response.ok) throw new Error('Failed to fetch gallery data');
      const data = await response.json();
      setGalleryData(data);
    } catch (error) {
      console.error('Error fetching gallery data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', file.name.split('.')[0].replace(/-/g, ' '));
    formData.append('section', activeTab === 'deleted' ? 'projects' : activeTab);

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 200);

      const response = await fetch('/api/gallery', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) throw new Error('Failed to upload image');
      
      await fetchGalleryData();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleSoftDelete = async (image: ImageAsset) => {
    try {
      setActionInProgress(true);
      const response = await fetch(`/api/gallery?action=softDelete`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ src: image.src }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove image');
      }
      
      await fetchGalleryData();
    } catch (error) {
      console.error('Error soft deleting image:', error);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRestore = async (image: ImageAsset) => {
    try {
      setActionInProgress(true);
      const response = await fetch(`/api/gallery?action=restore`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ src: image.src }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to restore image');
      }
      
      await fetchGalleryData();
    } catch (error) {
      console.error('Error restoring image:', error);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleUpdateCaption = async (image: ImageAsset, newCaption: string) => {
    try {
      const response = await fetch(`/api/gallery?action=updateCaption`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ src: image.src, caption: newCaption }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update caption');
      }
      
      await fetchGalleryData();
    } catch (error) {
      console.error('Error updating caption:', error);
    }
  };

  const handlePermanentDelete = async (image: ImageAsset) => {
    try {
      setActionInProgress(true);
      const response = await fetch(`/api/gallery?src=${encodeURIComponent(image.src)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to permanently delete image');
      }
      
      await fetchGalleryData();
    } catch (error) {
      console.error('Error permanently deleting image:', error);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, imageSrc: string) => {
    setIsDragging(true);
    setDraggedImage(imageSrc);
    e.dataTransfer.setData('text/plain', imageSrc);
    
    // Create a transparent 1x1 pixel for drag ghost
    const img = document.createElement('img');
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetImageSrc: string) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (!draggedImage || draggedImage === targetImageSrc) return;
    
    // Get all images in the current section
    const sectionImages = [...galleryData.images]
      .filter(img => img.section === activeTab)
      .sort((a, b) => (a.order || 999) - (b.order || 999));
    
    // Find the indices of the dragged and target images
    const draggedIndex = sectionImages.findIndex(img => img.src === draggedImage);
    const targetIndex = sectionImages.findIndex(img => img.src === targetImageSrc);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Reorder the images
    const newOrder = [...sectionImages];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, removed);
    
    // Update the order property of each image
    const orderedImageSrcs = newOrder.map(img => img.src);
    
    try {
      setActionInProgress(true);
      const response = await fetch(`/api/gallery?action=updateOrder`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section: activeTab,
          orderedImages: orderedImageSrcs
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update image order');
      }
      
      await fetchGalleryData();
    } catch (error) {
      console.error('Error updating image order:', error);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedImage(null);
  };

  const confirmSoftDelete = (image: ImageAsset) => {
    setSelectedImage(image);
    setDialogConfig({
      isOpen: true,
      title: 'Remove Image',
      message: 'Are you sure you want to remove this image? It will be moved to the deleted items.',
      confirmText: 'Remove',
      type: 'warning',
      onConfirm: () => handleSoftDelete(image)
    });
  };

  const confirmRestore = (image: ImageAsset) => {
    setSelectedImage(image);
    setDialogConfig({
      isOpen: true,
      title: 'Restore Image',
      message: 'Do you want to restore this image?',
      confirmText: 'Restore',
      type: 'info',
      onConfirm: () => handleRestore(image)
    });
  };

  const confirmPermanentDelete = (image: ImageAsset) => {
    setSelectedImage(image);
    setDialogConfig({
      isOpen: true,
      title: 'Permanently Delete Image',
      message: 'This action cannot be undone. Are you sure you want to permanently delete this image?',
      confirmText: 'Delete Forever',
      type: 'danger',
      onConfirm: () => handlePermanentDelete(image)
    });
  };

  // Get filtered and sorted images for the current tab
  const filteredImages = activeTab === 'deleted' 
    ? galleryData.deletedImages 
    : [...galleryData.images]
        .filter(img => img.section === activeTab)
        .sort((a, b) => (a.order || 999) - (b.order || 999));

  const handleCloseDialog = () => {
    setDialogConfig(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <GalleryHeader />
        
        <GalleryTabs 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          deletedItemsCount={galleryData.deletedImages.length}
          actionInProgress={actionInProgress}
        />

        <UploadSection 
          activeTab={activeTab}
          filteredImages={filteredImages}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          uploadError={uploadError}
          actionInProgress={actionInProgress}
          handleImageUpload={handleImageUpload}
        />

        {isLoading ? (
          <LoadingState />
        ) : (
          <GalleryGrid 
            filteredImages={filteredImages}
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
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={dialogConfig.isOpen}
        title={dialogConfig.title}
        message={dialogConfig.message}
        confirmText={dialogConfig.confirmText}
        type={dialogConfig.type}
        onConfirm={() => {
          dialogConfig.onConfirm();
          handleCloseDialog();
        }}
        onClose={handleCloseDialog}
      />
    </div>
  );
}
