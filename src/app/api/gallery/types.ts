export interface ImageAsset {
  src: string; // Will now store local path like '/assets/gallery/filename.jpg'
  alt: string;
  caption: string;
  section: 'Facility' | 'Quilting';
  order: number; // Make order required
  metadata?: {
    uploadedAt: string;
    dimensions?: {
      width: number;
      height: number;
    }
  };
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface GalleryState {
  images: ImageAsset[];
  deletedImages: ImageAsset[];
}
