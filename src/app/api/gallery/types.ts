export interface ImageAsset {
  src: string;
  alt: string;
  caption: string;
  section: 'projects' | 'facility' | 'seasonal';
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface GalleryState {
  images: ImageAsset[];
  deletedImages: ImageAsset[];
}
