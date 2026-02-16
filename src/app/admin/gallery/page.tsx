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

// Force dynamic rendering (admin page requires authentication + Cloudinary)
export const dynamic = 'force-dynamic';

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
          actionInProgress={actionInProgress}
          section={getImageSection(activeTab)}
          onUploadSuccess={() => fetchGalleryData()}
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
