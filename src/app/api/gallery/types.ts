export interface ImageAsset {
  src: string;
  alt: string;
  caption: string;
  section: 'projects' | 'facility' | 'seasonal';
  order?: number; // Added for image ordering
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface GalleryState {
  images: ImageAsset[];
  deletedImages: ImageAsset[];
}
