'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import ConfirmDialog from '@/components/ConfirmDialog';
import { ImageAsset, GalleryState } from '@/app/api/gallery/types';

type Tab = 'projects' | 'facility' | 'deleted';

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
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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
      await fetch(`/api/gallery?action=updateOrder`, {
        method: 'PATCH',
        body: JSON.stringify({
          section: activeTab,
          orderedImages: orderedImageSrcs
        }),
      });
      
      await fetchGalleryData();
    } catch (error) {
      console.error('Error updating image order:', error);
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
              ref={fileInputRef}
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
            
            {isUploading && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-teal-600 h-2.5 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1">Uploading: {uploadProgress}%</p>
              </div>
            )}
            
            {uploadError && (
              <p className="mt-2 text-sm text-red-600">{uploadError}</p>
            )}
            
    {activeTab !== 'deleted' as Tab && filteredImages.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Tip:</span> You can drag and drop images to reorder them. The order will be reflected on the website.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredImages.map((image) => (
            <div 
              key={image.src} 
              className={`bg-white p-4 rounded-lg shadow-sm ${
                isDragging && draggedImage === image.src ? 'opacity-50' : ''
              } ${
                activeTab !== 'deleted' ? 'cursor-grab' : ''
              }`}
              draggable={activeTab !== 'deleted'}
              onDragStart={(e) => activeTab !== 'deleted' && handleDragStart(e, image.src)}
              onDragOver={handleDragOver}
              onDrop={(e) => activeTab !== 'deleted' && handleDrop(e, image.src)}
              onDragEnd={handleDragEnd}
            >
              <div className="relative aspect-square mb-4">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover rounded-md"
                />
                {activeTab !== 'deleted' && (
                  <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-md">
                    <span className="text-xs font-semibold text-gray-700">
                      {image.order || '?'}
                    </span>
                  </div>
                )}
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

        {filteredImages.length === 0 && (
          <div className="bg-white p-8 rounded-lg shadow-sm text-center">
            <p className="text-gray-500">
              {activeTab === 'deleted' 
                ? 'No deleted images found.' 
                : `No images in the ${activeTab} section. Upload some images to get started.`}
            </p>
          </div>
        )}

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
