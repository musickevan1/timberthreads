import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { CldImage } from 'next-cloudinary';

interface ZoomableImageProps {
  src: string;
  alt: string;
  onLoadingComplete: () => void;
}

const ZoomableImage: React.FC<ZoomableImageProps> = ({ src, alt, onLoadingComplete }) => {
  const [scale, setScale] = useState(1);
  const [translateX, setTranslateX] = useState(0);
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTouchRef = useRef({ x: 0, y: 0 });
  const initialTouchesDistanceRef = useRef<number | null>(null);
  const isLocal = src.startsWith('/');

  // Reset transform when image changes
  useEffect(() => {
    setScale(1);
    setTranslateX(0);
    setTranslateY(0);
  }, [src]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // Store initial distance between touches for pinch-to-zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialTouchesDistanceRef.current = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
    } else if (e.touches.length === 1) {
      // Store initial position for drag
      lastTouchRef.current = {
        x: e.touches[0].clientX - translateX,
        y: e.touches[0].clientY - translateY,
      };
      setIsDragging(true);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault(); // Prevent scrolling while interacting with image

    if (e.touches.length === 2) {
      // Handle pinch-to-zoom
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (initialTouchesDistanceRef.current) {
        const scaleDiff = (currentDistance - initialTouchesDistanceRef.current) * 0.01;
        const newScale = Math.min(Math.max(1, scale + scaleDiff), 4);
        setScale(newScale);
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      // Handle drag when zoomed
      const dx = e.touches[0].clientX - lastTouchRef.current.x;
      const dy = e.touches[0].clientY - lastTouchRef.current.y;

      // Calculate bounds based on zoom level
      const maxTranslate = (scale - 1) * 150; // Adjust this value based on your needs
      const boundedX = Math.min(Math.max(dx, -maxTranslate), maxTranslate);
      const boundedY = Math.min(Math.max(dy, -maxTranslate), maxTranslate);

      setTranslateX(boundedX);
      setTranslateY(boundedY);
    }
  };

  const handleTouchEnd = () => {
    initialTouchesDistanceRef.current = null;
    setIsDragging(false);

    // Reset position if scale is back to 1
    if (scale <= 1) {
      setTranslateX(0);
      setTranslateY(0);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (scale > 1) {
      // Reset zoom
      setScale(1);
      setTranslateX(0);
      setTranslateY(0);
    } else {
      // Zoom in
      setScale(2);
    }
  };

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full cursor-grab active:cursor-grabbing"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onDoubleClick={handleDoubleClick}
    >
      <div
        style={{
          transform: `scale(${scale}) translate(${translateX}px, ${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
        }}
        className="w-full h-full"
      >
        {isLocal ? (
          <Image
            src={src}
            alt={alt}
            fill
            className="object-contain"
            sizes="100vw"
            onLoad={onLoadingComplete}
          />
        ) : (
          <CldImage
            src={src}
            alt={alt}
            fill
            className="object-contain"
            sizes="100vw"
            onLoad={onLoadingComplete}
          />
        )}
      </div>
    </div>
  );
};

export default ZoomableImage;
