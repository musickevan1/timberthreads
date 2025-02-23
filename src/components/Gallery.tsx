'use client';

import Image from 'next/image';

export default function Gallery() {
  const images = [
    {
      src: '/assets/hero-front-view.jpeg',
      alt: 'Front view of Timber & Threads Retreat',
      caption: 'Welcome to our retreat center',
      category: 'exterior'
    },
    {
      src: '/assets/hero-porch-view.jpeg',
      alt: 'View from the front porch',
      caption: 'Scenic lake views',
      category: 'exterior'
    },
    {
      src: '/assets/entrance-driveway.jpeg',
      alt: 'Entrance and driveway',
      caption: 'Easy access entrance',
      category: 'exterior'
    },
    {
      src: '/assets/quilting-workspace.jpeg',
      alt: 'Quilting workspace area',
      caption: 'Spacious crafting area',
      category: 'interior'
    },
    {
      src: '/assets/quilt-display-1.jpeg',
      alt: 'Guest quilt project',
      caption: 'Guest creations',
      category: 'projects'
    },
    {
      src: '/assets/quilt-display-2.jpeg',
      alt: 'Guest quilt project',
      caption: 'Beautiful quilting work',
      category: 'projects'
    },
    {
      src: '/assets/quilt-display-3.jpeg',
      alt: 'Guest quilt project',
      caption: 'Handcrafted with love',
      category: 'projects'
    }
  ];

  return (
    <section id="gallery" className="py-16 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-8">Gallery</h2>
        
        {/* Exterior Views */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold mb-6">Retreat Center & Surroundings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images
              .filter(img => img.category === 'exterior')
              .map((image, index) => (
                <div key={index} className="relative group">
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

        {/* Interior Spaces */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold mb-6">Creative Spaces</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {images
              .filter(img => img.category === 'interior')
              .map((image, index) => (
                <div key={index} className="relative group">
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

        {/* Guest Projects */}
        <div>
          <h3 className="text-2xl font-semibold mb-6">Guest Creations</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {images
              .filter(img => img.category === 'projects')
              .map((image, index) => (
                <div key={index} className="relative group">
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
