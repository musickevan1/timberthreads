#!/usr/bin/env node
/**
 * Post-migration verification script: Verify all gallery images are on Cloudinary
 * and accessible, with metadata intact.
 */

require('dotenv').config({ path: '.env.local' });

import { Redis } from '@upstash/redis';
import * as https from 'https';

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

interface VerificationResult {
  totalImages: number;
  accessibleImages: number;
  localPathsFound: number;
  metadataIssues: string[];
  orderIssues: string[];
  accessibilityIssues: string[];
  passed: boolean;
}

// Check if URL is accessible via HEAD request
async function checkImageAccessibility(cloudName: string, publicId: string): Promise<boolean> {
  return new Promise((resolve) => {
    const url = `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`;

    https.request(url, { method: 'HEAD' }, (res) => {
      resolve(res.statusCode === 200);
    })
      .on('error', () => resolve(false))
      .end();
  });
}

async function main() {
  console.log('=== Gallery Migration Verification ===\n');

  const result: VerificationResult = {
    totalImages: 0,
    accessibleImages: 0,
    localPathsFound: 0,
    metadataIssues: [],
    orderIssues: [],
    accessibilityIssues: [],
    passed: false,
  };

  try {
    // Fetch gallery data from Redis
    console.log('Fetching gallery data from Redis...');
    const galleryData = await redis.get<GalleryState>('gallery');

    if (!galleryData || !galleryData.images || galleryData.images.length === 0) {
      console.log('✓ No gallery data in Redis (empty gallery).');
      console.log('  Migration verification: PASSED (nothing to verify)\n');
      result.passed = true;
      process.exit(0);
    }

    result.totalImages = galleryData.images.length;
    console.log(`Found ${galleryData.images.length} images in Redis.\n`);

    // Get Cloudinary cloud name
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName) {
      console.error('✗ NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME not set in environment.');
      process.exit(1);
    }

    // Check 1: No local paths
    console.log('Check 1: Verifying no local paths remain...');
    const localPaths = galleryData.images.filter(img => img.src.startsWith('/'));
    result.localPathsFound = localPaths.length;

    if (localPaths.length > 0) {
      console.error(`✗ Found ${localPaths.length} images with local paths:`);
      localPaths.forEach(img => {
        console.error(`  - ${img.src} (${img.section})`);
      });
      console.log('');
    } else {
      console.log('✓ No local paths found. All images use Cloudinary public_ids.\n');
    }

    // Check 2: Accessibility
    console.log('Check 2: Verifying image accessibility on Cloudinary...');
    for (const image of galleryData.images) {
      const accessible = await checkImageAccessibility(cloudName, image.src);

      if (accessible) {
        result.accessibleImages++;
      } else {
        result.accessibilityIssues.push(`${image.src} (${image.section}) - not accessible at Cloudinary URL`);
      }
    }

    if (result.accessibilityIssues.length > 0) {
      console.error(`✗ ${result.accessibilityIssues.length} images are not accessible:`);
      result.accessibilityIssues.forEach(issue => console.error(`  - ${issue}`));
      console.log('');
    } else {
      console.log(`✓ All ${result.totalImages} images are accessible on Cloudinary.\n`);
    }

    // Check 3: Metadata integrity
    console.log('Check 3: Verifying metadata integrity...');
    for (const image of galleryData.images) {
      if (!image.alt || image.alt.trim() === '') {
        result.metadataIssues.push(`${image.src} - missing alt text`);
      }
      if (!image.caption || image.caption.trim() === '') {
        result.metadataIssues.push(`${image.src} - missing caption`);
      }
      if (!image.section || !['Facility', 'Quilting'].includes(image.section)) {
        result.metadataIssues.push(`${image.src} - invalid section: ${image.section}`);
      }
      if (typeof image.order !== 'number') {
        result.metadataIssues.push(`${image.src} - order is not a number: ${image.order}`);
      }
    }

    if (result.metadataIssues.length > 0) {
      console.error(`✗ Found ${result.metadataIssues.length} metadata issues:`);
      result.metadataIssues.forEach(issue => console.error(`  - ${issue}`));
      console.log('');
    } else {
      console.log('✓ All images have complete metadata (alt, caption, section, order).\n');
    }

    // Check 4: Order consistency per section
    console.log('Check 4: Verifying order consistency per section...');
    const sections = ['Facility', 'Quilting'] as const;

    for (const section of sections) {
      const sectionImages = galleryData.images.filter(img => img.section === section);
      const orders = sectionImages.map(img => img.order).sort((a, b) => a - b);

      // Check for duplicates
      const duplicates = orders.filter((order, index) => orders.indexOf(order) !== index);
      if (duplicates.length > 0) {
        result.orderIssues.push(`${section} section has duplicate order values: ${[...new Set(duplicates)].join(', ')}`);
      }

      // Check for gaps (not necessarily sequential, but should be consistent)
      // Note: Order values don't need to be sequential (1,2,3...), just unique and consistent
      // So we'll just warn if there are large gaps that might indicate issues
      for (let i = 1; i < orders.length; i++) {
        if (orders[i] - orders[i - 1] > 10) {
          result.orderIssues.push(`${section} section has large gap in order values: ${orders[i - 1]} → ${orders[i]}`);
        }
      }
    }

    if (result.orderIssues.length > 0) {
      console.error(`⚠ Found ${result.orderIssues.length} order issues:`);
      result.orderIssues.forEach(issue => console.error(`  - ${issue}`));
      console.log('');
    } else {
      console.log('✓ Order values are consistent within each section.\n');
    }

    // Final result
    console.log('=== Verification Summary ===');
    console.log(`Total images: ${result.totalImages}`);
    console.log(`Accessible on Cloudinary: ${result.accessibleImages}/${result.totalImages}`);
    console.log(`Local paths remaining: ${result.localPathsFound}`);
    console.log(`Metadata issues: ${result.metadataIssues.length}`);
    console.log(`Order issues: ${result.orderIssues.length}`);
    console.log(`Accessibility issues: ${result.accessibilityIssues.length}`);

    // Determine pass/fail
    result.passed =
      result.localPathsFound === 0 &&
      result.accessibilityIssues.length === 0 &&
      result.metadataIssues.length === 0;

    if (result.passed) {
      console.log('\n✓ VERIFICATION PASSED - All checks passed!');
      process.exit(0);
    } else {
      console.error('\n✗ VERIFICATION FAILED - Please review issues above.');
      process.exit(1);
    }

  } catch (error: any) {
    console.error('\n✗ Verification failed with error:', error?.message || String(error));
    process.exit(1);
  }
}

main();
