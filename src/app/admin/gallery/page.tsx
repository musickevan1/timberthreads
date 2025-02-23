'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ImageAsset, GalleryState } from '@/app/api/gallery/types';

type Tab = 'projects' | 'facility' | 'seasonal' | 'deleted';

export default function GalleryAdmin() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('projects');
  const [galleryData, setGalleryData] = useState<GalleryState>({ images: [], deletedImages: [] });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedImage, setSelectedImage] = useState<ImageAsset | null>(null);
  const [dialogConfig, setDialogConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '',
    type: 'info' as 'info' | 'warning' | 'danger',
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
      const response = await fetch('/api/gallery');
      if (!response.ok) throw new Error('Failed to fetch gallery data');
      const data = await response.json();
      setGalleryData(data);
    } catch (error) {
      console.error('Error fetching gallery data:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', file.name.split('.')[0]);
    formData.append('section', activeTab === 'deleted' ? 'projects' : activeTab);

    setIsUploading(true);
    setUploadError('');

    try {
      const response = await fetch('/api/gallery', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload image');
      
      await fetchGalleryData();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleSoftDelete = async (image: ImageAsset) => {
    try {
      await fetch(`/api/gallery?action=softDelete`, {
        method: 'PATCH',
        body: JSON.stringify({ src: image.src }),
      });
      await fetchGalleryData();
    } catch (error) {
      console.error('Error soft deleting image:', error);
    }
  };

  const handleRestore = async (image: ImageAsset) => {
    try {
      await fetch(`/api/gallery?action=restore`, {
        method: 'PATCH',
        body: JSON.stringify({ src: image.src }),
      });
      await fetchGalleryData();
    } catch (error) {
      console.error('Error restoring image:', error);
    }
  };

  const handleUpdateCaption = async (image: ImageAsset, newCaption: string) => {
    try {
      await fetch(`/api/gallery?action=updateCaption`, {
        method: 'PATCH',
        body: JSON.stringify({ src: image.src, caption: newCaption }),
      });
      await fetchGalleryData();
    } catch (error) {
      console.error('Error updating caption:', error);
    }
  };

  const handlePermanentDelete = async (image: ImageAsset) => {
    try {
      await fetch(`/api/gallery?src=${encodeURIComponent(image.src)}`, {
        method: 'DELETE',
      });
      await fetchGalleryData();
    } catch (error) {
      console.error('Error permanently deleting image:', error);
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

  const filteredImages = activeTab === 'deleted' 
    ? galleryData.deletedImages 
    : galleryData.images.filter(img => img.section === activeTab);

  const tabClasses = (tab: Tab) => 
    `px-4 py-2 text-sm font-medium rounded-md ${
      activeTab === tab
        ? 'bg-teal-100 text-teal-700'
        : 'text-gray-500 hover:text-gray-700'
    }`;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gallery Management</h1>
          <button
            onClick={() => {
              sessionStorage.removeItem('isAuthenticated');
              router.push('/admin');
            }}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Logout
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-8">
          <div className="flex space-x-4">
            <button onClick={() => setActiveTab('projects')} className={tabClasses('projects')}>
              Guest Projects
            </button>
            <button onClick={() => setActiveTab('facility')} className={tabClasses('facility')}>
              Facility
            </button>
            <button onClick={() => setActiveTab('seasonal')} className={tabClasses('seasonal')}>
              Seasonal
            </button>
            <button onClick={() => setActiveTab('deleted')} className={tabClasses('deleted')}>
              Deleted Items
            </button>
          </div>
        </div>

        {/* Upload Section - Hidden for deleted items tab */}
        {activeTab !== 'deleted' && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <h2 className="text-xl font-semibold mb-4">Upload New Image</h2>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-teal-50 file:text-teal-700
                hover:file:bg-teal-100
                disabled:opacity-50"
            />
            {uploadError && (
              <p className="mt-2 text-sm text-red-600">{uploadError}</p>
            )}
          </div>
        )}

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((image) => (
            <div key={image.src} className="bg-white p-4 rounded-lg shadow-sm">
              <div className="relative aspect-square mb-4">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover rounded-md"
                />
              </div>
              <input
                type="text"
                value={image.caption}
                onChange={(e) => handleUpdateCaption(image, e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm mb-2"
                placeholder="Image caption"
                disabled={activeTab === 'deleted'}
              />
              {activeTab === 'deleted' ? (
                <div className="flex space-x-2">
                  <button
                    onClick={() => confirmRestore(image)}
                    className="flex-1 px-4 py-2 bg-teal-50 text-teal-700 rounded-md text-sm font-medium hover:bg-teal-100"
                  >
                    Restore
                  </button>
                  <button
                    onClick={() => confirmPermanentDelete(image)}
                    className="flex-1 px-4 py-2 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100"
                  >
                    Delete Forever
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => confirmSoftDelete(image)}
                  className="w-full px-4 py-2 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>

        <ConfirmDialog
          isOpen={dialogConfig.isOpen}
          onClose={() => setDialogConfig(prev => ({ ...prev, isOpen: false }))}
          title={dialogConfig.title}
          message={dialogConfig.message}
          confirmText={dialogConfig.confirmText}
          type={dialogConfig.type}
          onConfirm={dialogConfig.onConfirm}
        />
      </div>
    </div>
  );
}
