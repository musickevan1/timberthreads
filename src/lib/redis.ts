import { Redis } from '@upstash/redis';
import { GalleryState } from '@/app/api/gallery/types';

// Initialize Upstash Redis client with REST API
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Type alias for clarity
export type GalleryMetadata = GalleryState;

/**
 * Fetch gallery data from Redis
 * Returns empty structure if key doesn't exist (first-time setup)
 */
export async function getGalleryData(): Promise<GalleryMetadata> {
  const data = await redis.get<GalleryMetadata>('gallery');
  return data || { images: [], deletedImages: [] };
}

/**
 * Save gallery data to Redis
 * Overwrites entire gallery key with new state
 */
export async function saveGalleryData(data: GalleryMetadata): Promise<void> {
  await redis.set('gallery', data);
}
