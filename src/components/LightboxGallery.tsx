import React, { useEffect, useState, useCallback } from 'react';
import { ImageAsset } from '@/app/api/gallery/types';
import ZoomableImage from './ZoomableImage';

interface LightboxGalleryProps {
  images: ImageAsset[];
  initialIndex: number;
  onClose: () => void;
}

const LightboxGallery: React.FC<LightboxGalleryProps> = ({
  images,
  initialIndex,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isLoading, setIsLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const currentImage = images[currentIndex];
  const hasNext = currentIndex < images.length - 1;
  const hasPrevious = currentIndex > 0;

  // Navigation functions
  const goToNext = useCallback(() => {
    if (hasNext) {
      setIsLoading(true);
      setCurrentIndex(prev => prev + 1);
    }
  }, [hasNext]);

  const goToPrevious = useCallback(() => {
    if (hasPrevious) {
      setIsLoading(true);
      setCurrentIndex(prev => prev - 1);
    }
  }, [hasPrevious]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrevious();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, goToNext, goToPrevious]);

  // Handle touch navigation
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    // Only handle single touch swipes for navigation
    if (e.touches.length === 1) {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    // Only handle single touch swipes for navigation
    if (e.touches.length === 1) {
      setTouchEnd(e.targetTouches[0].clientX);
    }
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && hasNext) {
      goToNext();
    } else if (isRightSwipe && hasPrevious) {
      goToPrevious();
    }
  };

  // Prevent background scrolling while lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Background overlay - clicking this closes the lightbox */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Close button - moved down and increased z-index */}
      <button
        className="absolute top-16 right-4 z-[10000] bg-black/50 text-white hover:text-white p-3 rounded-full hover:bg-black/70 transition-colors group"
        onClick={onClose}
        title="Close (Esc)"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 opacity-75 group-hover:opacity-100 transition-opacity" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M6 18L18 6M6 6l12 12" 
          />
        </svg>
      </button>

      {/* Navigation arrows */}
      <div className="absolute inset-0 flex items-center justify-between z-[9999] pointer-events-none">
        {/* Left arrow */}
        <button
          className={`pointer-events-auto p-3 ml-4 text-white bg-black/50 rounded-full hover:bg-black/70 transition-all transform ${
            !hasPrevious ? 'opacity-0 cursor-default translate-x-[-100%]' : 'opacity-100 hover:scale-110'
          }`}
          onClick={goToPrevious}
          disabled={!hasPrevious}
          title="Previous (←)"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M15 19l-7-7 7-7" 
            />
          </svg>
        </button>

        {/* Right arrow */}
        <button
          className={`pointer-events-auto p-3 mr-4 text-white bg-black/50 rounded-full hover:bg-black/70 transition-all transform ${
            !hasNext ? 'opacity-0 cursor-default translate-x-[100%]' : 'opacity-100 hover:scale-110'
          }`}
          onClick={goToNext}
          disabled={!hasNext}
          title="Next (→)"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M9 5l7 7-7 7" 
            />
          </svg>
        </button>
      </div>

      {/* Image container */}
      <div 
        className="absolute inset-0 flex items-center justify-center p-4 z-[9998]"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="relative w-full h-full max-w-6xl max-h-[90vh] mx-auto">
          <ZoomableImage
            src={currentImage.src}
            alt={currentImage.alt}
            onLoadingComplete={() => setIsLoading(false)}
          />
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white/70"></div>
          </div>
        )}
      </div>

      {/* Caption */}
      <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-[9999]">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-white/90 text-lg px-12">
            {currentImage.caption}
          </p>
          <p className="text-white/60 text-sm mt-1">
            {currentIndex + 1} of {images.length}
          </p>
        </div>
      </div>

      {/* Mobile instructions */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-sm md:hidden z-[9999]">
        Swipe to navigate • Pinch to zoom • Double tap to zoom • Tap outside to close
      </div>
    </div>
  );
};

export default LightboxGallery;
