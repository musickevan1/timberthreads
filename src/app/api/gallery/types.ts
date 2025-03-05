export interface ImageAsset {
  src: string;
  alt: string;
  caption: string;
  section: 'quilts' | 'workshops' | 'accommodations';
  order?: number;
  isDeleted?: boolean;
  deletedAt?: string;
}

export interface GalleryState {
  images: ImageAsset[];
  deletedImages: ImageAsset[];
}
