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

// Map admin tabs to image sections
const getImageSection = (tab: Tab): ImageAsset['section'] => {
  switch (tab) {
    case 'Facility':
      return 'Facility';
    case 'Quilting':
      return 'Quilting';
    default:
      return 'Facility'; // Default for deleted tab
  }
};

export default function GalleryAdmin() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('Facility');
  const [galleryData, setGalleryData] = useState<GalleryState>({ images: [], deletedImages: [] });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageAsset | null>(null);
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

  const handleImageUpload = async (fileInput: React.ChangeEvent<HTMLInputElement> | File) => {
    let file: File;
    
    if (fileInput instanceof File) {
      file = fileInput;
    } else {
      const files = fileInput.target.files;
      if (!files || files.length === 0) return;
      file = files[0];
    }
    
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setUploadError(`File size exceeds 10MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)`);
      return;
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setUploadError('Only JPG, PNG, GIF, and WebP images are supported');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    let caption = file.name.split('.')[0]
      .replace(/-/g, ' ')
      .replace(/_/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    caption = caption.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
      
    formData.append('caption', caption);
    formData.append('section', getImageSection(activeTab));

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => prev < 90 ? prev + Math.floor(Math.random() * 5) + 1 : prev);
      }, 300);

      const response = await fetch('/api/gallery', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload image');
      }
      
      await fetchGalleryData();
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload image. Please try again.');
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

  const handleSectionChange = async (image: ImageAsset, newSection: ImageAsset['section']) => {
    try {
      setActionInProgress(true);
      const response = await fetch(`/api/gallery?action=updateSection`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          src: image.src,
          newSection
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update section');
      }
      
      await fetchGalleryData();
    } catch (error) {
      console.error('Error updating section:', error);
    } finally {
      setActionInProgress(false);
    }
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
        .filter(img => img.section === getImageSection(activeTab))
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
          handleImageUpload={(e: any) => handleImageUpload(e)}
        />

        {isLoading ? (
          <LoadingState />
        ) : (
          <GalleryGrid 
            filteredImages={filteredImages}
            activeTab={activeTab}
            actionInProgress={actionInProgress}
            handleUpdateCaption={handleUpdateCaption}
            confirmSoftDelete={confirmSoftDelete}
            confirmRestore={confirmRestore}
            confirmPermanentDelete={confirmPermanentDelete}
            handleSectionChange={handleSectionChange}
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
