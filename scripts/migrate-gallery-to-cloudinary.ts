#!/usr/bin/env node
/**
 * One-time migration script: Upload all local gallery images to Cloudinary
 * and update Redis metadata with Cloudinary public_ids.
 */

require('dotenv').config({ path: '.env.local' });

import { v2 as cloudinary } from 'cloudinary';
import { Redis } from '@upstash/redis';
import * as fs from 'fs/promises';
import * as path from 'path';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Redis
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

interface ImageAsset {
  src: string;
  alt: string;
  caption: string;
  section: 'Facility' | 'Quilting';
  order: number;
  metadata?: {
    uploadedAt: string;
    dimensions?: {
      width: number;
      height: number;
    };
  };
  isDeleted?: boolean;
  deletedAt?: string;
}

interface GalleryState {
  images: ImageAsset[];
  deletedImages: ImageAsset[];
}

interface MigrationResult {
  filename: string;
  localPath: string;
  success: boolean;
  publicId?: string;
  error?: string;
  attempts: number;
}

interface MigrationLog {
  timestamp: string;
  totalImages: number;
  localImages: number;
  succeeded: number;
  failed: number;
  skipped: number;
  results: MigrationResult[];
}

// Sleep helper for retry backoff
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Upload single image with retry logic
async function uploadImageWithRetry(
  localPath: string,
  filename: string,
  section: string,
  maxAttempts = 3
): Promise<{ success: boolean; publicId?: string; error?: string; attempts: number }> {
  const baseDelay = 1000; // 1 second

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`[Attempt ${attempt}/${maxAttempts}] Uploading ${filename}...`);

      // Extract filename without extension for public_id
      const publicIdBase = path.parse(filename).name;

      const result = await cloudinary.uploader.upload(localPath, {
        folder: 'timber-threads/gallery',
        public_id: publicIdBase,
        tags: [section.toLowerCase(), 'gallery', 'migrated'],
        overwrite: true, // If re-running migration, overwrite previous uploads
      });

      console.log(`✓ Successfully uploaded ${filename} → ${result.public_id}`);
      return { success: true, publicId: result.public_id, attempts: attempt };

    } catch (error: any) {
      const errorMsg = error?.message || String(error);
      console.error(`✗ Attempt ${attempt} failed for ${filename}: ${errorMsg}`);

      if (attempt < maxAttempts) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff: 1s, 2s, 4s
        console.log(`  Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        return { success: false, error: errorMsg, attempts: attempt };
      }
    }
  }

  return { success: false, error: 'Max attempts reached', attempts: maxAttempts };
}

async function main() {
  console.log('=== Cloudinary Gallery Migration ===\n');

  const migrationLog: MigrationLog = {
    timestamp: new Date().toISOString(),
    totalImages: 0,
    localImages: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0,
    results: [],
  };

  try {
    // Fetch current gallery data from Redis
    console.log('Fetching gallery data from Redis...');
    const galleryData = await redis.get<GalleryState>('gallery');

    if (!galleryData || !galleryData.images || galleryData.images.length === 0) {
      console.log('No gallery data found in Redis. Nothing to migrate.');
      migrationLog.totalImages = 0;
      migrationLog.localImages = 0;

      // Write log
      await fs.writeFile(
        path.join(process.cwd(), 'migration-log.json'),
        JSON.stringify(migrationLog, null, 2)
      );

      console.log('\n✓ Migration complete (no images to migrate)');
      return;
    }

    migrationLog.totalImages = galleryData.images.length;
    console.log(`Found ${galleryData.images.length} images in Redis.\n`);

    // Filter for local images (src starts with '/')
    const localImages = galleryData.images.filter(img => img.src.startsWith('/'));
    migrationLog.localImages = localImages.length;

    console.log(`${localImages.length} images are local paths, ${galleryData.images.length - localImages.length} already use Cloudinary.\n`);

    if (localImages.length === 0) {
      console.log('No local images to migrate. All images already on Cloudinary.');
      migrationLog.skipped = galleryData.images.length;

      // Write log
      await fs.writeFile(
        path.join(process.cwd(), 'migration-log.json'),
        JSON.stringify(migrationLog, null, 2)
      );

      console.log('\n✓ Migration complete (all images already migrated)');
      return;
    }

    // Process each local image
    const updatedImages = [...galleryData.images];

    for (const image of localImages) {
      const filename = path.basename(image.src);
      const localPath = path.join(process.cwd(), 'public', image.src);

      console.log(`Processing: ${filename} (${image.section})`);

      // Check if file exists
      try {
        await fs.access(localPath);
      } catch (error) {
        console.error(`✗ File not found: ${localPath}`);
        migrationLog.failed++;
        migrationLog.results.push({
          filename,
          localPath,
          success: false,
          error: 'File not found',
          attempts: 0,
        });
        continue;
      }

      // Upload with retry
      const uploadResult = await uploadImageWithRetry(
        localPath,
        filename,
        image.section
      );

      if (uploadResult.success && uploadResult.publicId) {
        migrationLog.succeeded++;

        // Update image in array
        const index = updatedImages.findIndex(img => img.src === image.src);
        if (index !== -1) {
          updatedImages[index] = {
            ...updatedImages[index],
            src: uploadResult.publicId, // Replace local path with Cloudinary public_id
          };
        }

        migrationLog.results.push({
          filename,
          localPath,
          success: true,
          publicId: uploadResult.publicId,
          attempts: uploadResult.attempts,
        });
      } else {
        migrationLog.failed++;
        migrationLog.results.push({
          filename,
          localPath,
          success: false,
          error: uploadResult.error,
          attempts: uploadResult.attempts,
        });
      }

      console.log(''); // Blank line between images
    }

    // Update Redis with new data (only if at least one image succeeded)
    if (migrationLog.succeeded > 0) {
      console.log('\nUpdating Redis with new image metadata...');
      const updatedGalleryData: GalleryState = {
        images: updatedImages,
        deletedImages: galleryData.deletedImages || [],
      };

      await redis.set('gallery', updatedGalleryData);
      console.log('✓ Redis updated successfully.');
    } else {
      console.log('\n⚠ No images were successfully migrated. Redis not updated.');
    }

    // Write migration log
    await fs.writeFile(
      path.join(process.cwd(), 'migration-log.json'),
      JSON.stringify(migrationLog, null, 2)
    );

    console.log('\n=== Migration Summary ===');
    console.log(`Total images in Redis: ${migrationLog.totalImages}`);
    console.log(`Local images found: ${migrationLog.localImages}`);
    console.log(`Successfully migrated: ${migrationLog.succeeded}`);
    console.log(`Failed: ${migrationLog.failed}`);
    console.log(`Already on Cloudinary (skipped): ${migrationLog.totalImages - migrationLog.localImages}`);
    console.log(`\nMigration log written to: migration-log.json`);

    if (migrationLog.failed > 0) {
      console.error('\n⚠ Some images failed to migrate. Check migration-log.json for details.');
      process.exit(1);
    } else {
      console.log('\n✓ Migration complete! All images successfully uploaded to Cloudinary.');
      process.exit(0);
    }

  } catch (error: any) {
    console.error('\n✗ Migration failed with error:', error?.message || String(error));

    // Write error log
    migrationLog.results.push({
      filename: 'CRITICAL_ERROR',
      localPath: '',
      success: false,
      error: error?.message || String(error),
      attempts: 0,
    });

    await fs.writeFile(
      path.join(process.cwd(), 'migration-log.json'),
      JSON.stringify(migrationLog, null, 2)
    ).catch(err => console.error('Failed to write error log:', err));

    process.exit(1);
  }
}

main();
