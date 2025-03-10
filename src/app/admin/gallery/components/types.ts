import { ImageAsset, GalleryState } from '@/app/api/gallery/types';

export type Tab = 'Facility' | 'Quilting' | 'deleted';

export type DialogConfig = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  type: 'info' | 'warning' | 'danger';
  onConfirm: () => void;
};
