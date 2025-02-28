'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ImageAsset } from '@/app/api/gallery/types';

// Map API sections to display categories
const sectionToCategory = {
  'facility': ['exterior', 'interior'],
  'projects': ['projects']
};

// Function to determine category based on section and image properties
const determineCategory = (image: ImageAsset): string => {
  if (image.section === 'facility') {
    // Determine if it's exterior or interior based on the image path or caption
    if (image.src.includes('front') || 
        image.src.includes('entrance') || 
        image.src.includes('driveway') ||
        image.caption.toLowerCase().includes('entrance') ||
        image.caption.toLowerCase().includes('welcome')) {
      return 'exterior';
    }
    return 'interior';
  }
  return image.section;
};

export default function Gallery() {
  const [galleryImages, setGalleryImages] = useState<ImageAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  // Group images by category
  const exteriorImages = galleryImages.filter(img => determineCategory(img) === 'exterior');
  const interiorImages = galleryImages.filter(img => determineCategory(img) === 'interior');
  const projectImages = galleryImages.filter(img => determineCategory(img) === 'projects');

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
        
        {/* Exterior Views */}
        {exteriorImages.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-6">Retreat Center & Surroundings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exteriorImages.map((image, index) => (
                <div key={image.src} className="relative group">
                  <div className="aspect-video relative overflow-hidden rounded-lg shadow-md">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority
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

        {/* Interior Spaces */}
        {interiorImages.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-6">Creative Spaces</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {interiorImages.map((image, index) => (
                <div key={image.src} className="relative group">
                  <div className="aspect-video relative overflow-hidden rounded-lg shadow-md">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 50vw"
                      priority
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

        {/* Guest Projects */}
        {projectImages.length > 0 && (
          <div className="mb-12">
            <h3 className="text-2xl font-semibold mb-6">Guest Creations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {projectImages.map((image, index) => (
                <div key={image.src} className="relative group">
                  <div className="aspect-square relative overflow-hidden rounded-lg shadow-md">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
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


        {/* Guest Experience Note */}
        <div className="mt-12 text-center">
          <p className="text-gray-600">
            Experience the tranquility and creative inspiration at Timber & Threads Retreat.
            <br />
            Join us for your next crafting getaway!
          </p>
        </div>
      </div>
    </section>
  );
}
