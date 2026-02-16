export interface ImageAsset {
  src: string; // Local path ('/assets/gallery/...') for existing images, Cloudinary public_id for new uploads
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
