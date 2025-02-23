'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function GalleryAdmin() {
  const router = useRouter();
  const [images, setImages] = useState([
    { src: '/assets/hero-front-view.jpeg', alt: 'Front view', caption: 'Welcome to our retreat center' },
    { src: '/assets/quilting-workspace.jpeg', alt: 'Workspace', caption: 'Spacious crafting area' },
    // Add other existing images
  ]);

  useEffect(() => {
    // Check authentication
    const isAuthenticated = sessionStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
      router.push('/admin');
    }
  }, [router]);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const file = files[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('caption', file.name.split('.')[0]); // Use filename as initial caption

    setIsUploading(true);
    setUploadError('');

    try {
      const response = await fetch('/api/gallery', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      
      setImages(prev => [...prev, {
        src: `/assets/${data.filename}`,
        alt: data.filename,
        caption: data.caption
      }]);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
      e.target.value = ''; // Reset file input
    }
  };

  const handleRemoveImage = async (index: number) => {
    const image = images[index];
    const filename = image.src.split('/').pop();

    try {
      const response = await fetch(`/api/gallery?filename=${filename}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      setImages(prev => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete image. Please try again.');
    }
  };

  const handleUpdateCaption = (index: number, newCaption: string) => {
    setImages(prev => prev.map((img, i) => 
      i === index ? { ...img, caption: newCaption } : img
    ));
  };

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

        {/* Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h2 className="text-xl font-semibold mb-4">Upload New Image</h2>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-teal-50 file:text-teal-700
              hover:file:bg-teal-100"
          />
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow-sm">
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
                onChange={(e) => handleUpdateCaption(index, e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm mb-2"
                placeholder="Image caption"
              />
              <button
                onClick={() => handleRemoveImage(index)}
                className="w-full px-4 py-2 bg-red-50 text-red-700 rounded-md text-sm font-medium hover:bg-red-100"
              >
                Remove Image
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
