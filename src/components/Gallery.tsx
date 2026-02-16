'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ImageAsset } from '@/app/api/gallery/types';
import LightboxGallery from './LightboxGallery';

// Function to sort images by order
const sortByOrder = (a: ImageAsset, b: ImageAsset): number => {
  return a.order - b.order;
};

export default function Gallery() {
  const [galleryImages, setGalleryImages] = useState<ImageAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [currentSection, setCurrentSection] = useState<'Facility' | 'Quilting' | null>(null);

  useEffect(() => {
    const fetchGalleryData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/gallery');
        
        if (!response.ok) {
          throw new Error('Failed to fetch gallery data');
        }
        
        const data = await response.json();
        
        // Sort images by order property
        const sortedImages = [...data.images].sort((a, b) => {
          return (a.order || 999) - (b.order || 999);
        });
        
        setGalleryImages(sortedImages);
      } catch (err) {
        console.error('Error fetching gallery data:', err);
        setError('Failed to load gallery images. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGalleryData();
  }, []);

  // Group images by section
  const facilityImages = galleryImages
    .filter(img => img.section === 'Facility')
    .sort(sortByOrder);
  const quiltingImages = galleryImages
    .filter(img => img.section === 'Quilting')
    .sort(sortByOrder);

  if (isLoading) {
    return (
      <section id="gallery" className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif text-stone-800 mb-4">Gallery</h2>
            <div className="w-24 h-1 bg-teal-600 mx-auto mb-8"></div>
          </div>
          <p>Loading gallery images...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="gallery" className="py-24 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-serif text-stone-800 mb-4">Gallery</h2>
            <div className="w-24 h-1 bg-teal-600 mx-auto mb-8"></div>
          </div>
          <p className="text-red-500">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="gallery" className="py-24 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-serif text-stone-800 mb-4">Gallery</h2>
          <div className="w-24 h-1 bg-teal-600 mx-auto mb-8"></div>
        </div>
        
        {/* Facility Images */}
        {facilityImages.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-6">Our Facility</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {facilityImages.map((image) => (
                <div 
                  key={image.src} 
                  className="relative group cursor-pointer"
                  onClick={() => {
                    setSelectedImageIndex(facilityImages.indexOf(image));
                    setCurrentSection('Facility');
                  }}
                >
                  <div className="aspect-video relative overflow-hidden rounded-lg shadow-md">
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 z-10"></div>
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      quality={80}
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm text-gray-600">{image.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quilting Gallery */}
        {quiltingImages.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-6">Quilting Gallery</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quiltingImages.map((image) => (
                <div 
                  key={image.src} 
                  className="relative group cursor-pointer"
                  onClick={() => {
                    setSelectedImageIndex(quiltingImages.indexOf(image));
                    setCurrentSection('Quilting');
                  }}
                >
                  <div className="aspect-video relative overflow-hidden rounded-lg shadow-md">
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 z-10"></div>
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      quality={80}
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-sm text-gray-600">{image.caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {facilityImages.length === 0 && quiltingImages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No images available at the moment.</p>
          </div>
        )}

        {/* Guest Experience Note */}
        {(facilityImages.length > 0 || quiltingImages.length > 0) && (
          <div className="mt-12 text-center">
            <p className="text-gray-600">
              Experience the tranquility and creative inspiration at Timber & Threads Retreat.
              <br />
              Join us for your next crafting getaway!
            </p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImageIndex !== null && currentSection && (
        <LightboxGallery
          images={currentSection === 'Facility' ? facilityImages : quiltingImages}
          initialIndex={selectedImageIndex}
          onClose={() => {
            setSelectedImageIndex(null);
            setCurrentSection(null);
          }}
        />
      )}
    </section>
  );
}
