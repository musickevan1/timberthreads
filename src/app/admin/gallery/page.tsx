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
  const [isLoading, setIsLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState(false);
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

  const tabClasses = (tab: Tab) => 
    `px-6 py-3 text-sm font-medium ${
      activeTab === tab
        ? 'bg-teal-600 text-white shadow-sm'
        : 'bg-white text-stone-600 hover:bg-stone-50 hover:text-stone-900'
    } rounded-t-lg transition-colors`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-stone-200">
          <h2 className="text-2xl font-serif text-stone-800">Gallery Management</h2>
          <p className="text-stone-600 mt-1">
            Manage images displayed on your website
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-stone-200">
          <button 
            onClick={() => setActiveTab('projects')} 
            className={tabClasses('projects')}
            disabled={actionInProgress}
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Guest Projects
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('facility')} 
            className={tabClasses('facility')}
            disabled={actionInProgress}
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Facility
            </div>
          </button>
          <button 
            onClick={() => setActiveTab('deleted')} 
            className={tabClasses('deleted')}
            disabled={actionInProgress}
          >
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Deleted Items
              {galleryData.deletedImages.length > 0 && (
                <span className="ml-2 bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {galleryData.deletedImages.length}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Upload Section - Hidden for deleted items tab */}
        {activeTab !== 'deleted' && (
          <div className="p-6 border-b border-stone-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-stone-800">Upload New Image</h3>
              <div className="text-sm text-stone-500">
                {filteredImages.length} images in this section
              </div>
            </div>
            
            <div className="bg-stone-50 p-6 rounded-lg border border-stone-200">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-grow">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading || actionInProgress}
                    className="block w-full text-sm text-stone-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-teal-50 file:text-teal-700
                      hover:file:bg-teal-100
                      disabled:opacity-50"
                  />
                </div>
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || actionInProgress}
                  className="flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:bg-teal-300 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Upload Image
                    </>
                  )}
                </button>
              </div>
              
              {isUploading && (
                <div className="mt-4">
                  <div className="w-full bg-stone-200 rounded-full h-2.5">
                    <div 
                      className="bg-teal-600 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-sm text-stone-600 mt-1">Uploading: {uploadProgress}%</p>
                </div>
              )}
              
              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                  {uploadError}
                </div>
              )}
            </div>
            
            {activeTab !== 'deleted' as Tab && filteredImages.length > 0 && (
              <div className="mt-4 p-4 bg-blue-50 rounded-md flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Tip:</span> You can drag and drop images to reorder them. The order will be reflected on the website.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="flex flex-col items-center">
              <svg className="animate-spin h-10 w-10 text-teal-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-stone-600">Loading gallery images...</p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            {/* Gallery Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredImages.map((image) => (
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
              ))}
              
              {filteredImages.length === 0 && (
                <div className="col-span-3 bg-stone-50 p-8 rounded-lg border border-stone-200 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-stone-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-stone-600 mb-4">
                    {activeTab === 'deleted'
