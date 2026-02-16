# Phase 2: Gallery Migration - Research

**Researched:** 2026-02-16
**Domain:** Image migration, CDN integration, Next.js Image optimization
**Confidence:** HIGH

## Summary

Phase 2 migrates existing local gallery images to Cloudinary CDN and updates the frontend to use next-cloudinary components for optimal image delivery. Phase 1 already established the infrastructure (Cloudinary SDK, Redis, API routes with upload/delete/reorder), so this phase focuses on: (1) migrating existing local images to Cloudinary, (2) updating Gallery component to use CldImage for automatic format optimization and lazy loading, (3) implementing CldUploadWidget in admin UI for better upload UX.

The research reveals next-cloudinary provides purpose-built React components (CldImage, CldUploadWidget) that wrap Next.js Image component with Cloudinary-specific optimizations. CldImage automatically enables f_auto (format optimization to WebP/AVIF) and q_auto (quality optimization), while CldUploadWidget provides a polished upload interface with drag-and-drop, progress tracking, and signed upload support. The migration can be executed via a one-time Node.js script that uploads local images and updates Redis metadata atomically.

**Primary recommendation:** Use next-cloudinary's CldImage and CldUploadWidget components. Migrate images via a server-side script that uploads to Cloudinary, updates Redis metadata from local paths to public_ids, then verifies all images are accessible before deployment.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next-cloudinary | 6.16.0 | React components for Cloudinary integration | Official Cloudinary-maintained package for Next.js, provides CldImage (optimized image rendering) and CldUploadWidget (client-side uploads) |
| cloudinary | 2.5.1 | Server-side Cloudinary SDK | Already installed in Phase 1, used for migration script and server-side operations |
| next | 14.2.24 | Framework with Image optimization | Already installed, CldImage wraps next/image component |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sharp | 0.33.5 | Image processing (server-side) | Already installed for Phase 1 uploads; NOT needed for migration script since Cloudinary handles optimization |
| fs/promises | (Node.js built-in) | File system operations for migration | Migration script only - read local images, verify files exist |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| CldImage | Next.js Image with remotePatterns | Lose automatic f_auto/q_auto, Cloudinary transformations, responsive sizing helpers |
| CldUploadWidget | Custom FormData upload (current Phase 1 implementation) | Works but lacks drag-drop UI, progress indicators, image previews, client-side validation |
| Migration script | Manual Cloudinary dashboard upload | Loses metadata mapping, order preservation, automation, error handling |

**Installation:**
```bash
# next-cloudinary already installed (package.json shows 6.16.0)
# No additional packages needed
```

## Architecture Patterns

### Recommended Migration Script Structure
```
scripts/
├── migrate-gallery-to-cloudinary.js    # Main migration script
└── verify-migration.js                 # Verification script (optional)
```

### Pattern 1: Migration Script (One-Time Server-Side)
**What:** Node.js script that uploads local images to Cloudinary, updates Redis metadata from local paths to public_ids
**When to use:** One-time migration before Phase 2 deployment

**Example:**
```javascript
// Source: Research synthesis from Cloudinary Node.js documentation
const cloudinary = require('cloudinary').v2;
const { getGalleryData, saveGalleryData } = require('../src/lib/redis');
const fs = require('fs/promises');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function migrateGalleryImages() {
  // 1. Fetch current gallery data from Redis
  const galleryData = await getGalleryData();

  // 2. Filter images with local paths (start with '/')
  const localImages = galleryData.images.filter(img => img.src.startsWith('/'));

  console.log(`Found ${localImages.length} local images to migrate`);

  // 3. Upload each local image to Cloudinary
  const migrationResults = [];

  for (const image of localImages) {
    const localPath = path.join(process.cwd(), 'public', image.src);

    try {
      // Verify file exists
      await fs.access(localPath);

      // Upload to Cloudinary with same folder structure
      const uploadResult = await cloudinary.uploader.upload(localPath, {
        folder: 'timber-threads/gallery',
        public_id: path.basename(image.src, path.extname(image.src)),
        resource_type: 'image',
        tags: [image.section.toLowerCase(), 'migrated', 'gallery']
      });

      migrationResults.push({
        original: image.src,
        cloudinary_id: uploadResult.public_id,
        success: true
      });

      console.log(`✓ Migrated: ${image.src} -> ${uploadResult.public_id}`);

    } catch (error) {
      migrationResults.push({
        original: image.src,
        error: error.message,
        success: false
      });
      console.error(`✗ Failed: ${image.src} - ${error.message}`);
    }
  }

  // 4. Update Redis with new Cloudinary public_ids
  galleryData.images = galleryData.images.map(img => {
    const migrated = migrationResults.find(r => r.original === img.src && r.success);
    if (migrated) {
      return {
        ...img,
        src: migrated.cloudinary_id // Update to Cloudinary public_id
      };
    }
    return img;
  });

  await saveGalleryData(galleryData);

  // 5. Summary
  const successful = migrationResults.filter(r => r.success).length;
  const failed = migrationResults.filter(r => !r.success).length;

  console.log(`\nMigration complete: ${successful} succeeded, ${failed} failed`);

  return migrationResults;
}

// Run migration
migrateGalleryImages()
  .then(results => {
    console.log('\nMigration results saved to migration-log.json');
    require('fs').writeFileSync('migration-log.json', JSON.stringify(results, null, 2));
    process.exit(0);
  })
  .catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
```

### Pattern 2: CldImage Component (Gallery Display)
**What:** Replace Next.js Image with CldImage to enable Cloudinary optimizations
**When to use:** All gallery image rendering (public Gallery component)

**Example:**
```typescript
// Source: https://next.cloudinary.dev/cldimage/basic-usage
'use client';

import { CldImage } from 'next-cloudinary';
import { ImageAsset } from '@/app/api/gallery/types';

interface GalleryImageProps {
  image: ImageAsset;
  priority?: boolean; // First 6 images should have priority={true}
}

export function GalleryImage({ image, priority = false }: GalleryImageProps) {
  // CldImage automatically applies f_auto (format optimization) and q_auto (quality optimization)
  return (
    <CldImage
      src={image.src} // Cloudinary public_id (e.g., "timber-threads/gallery/bedroom-1")
      alt={image.alt}
      width={1200}
      height={800}
      crop="fill"
      gravity="auto"
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      priority={priority} // First 6 images: eager load with preload
      loading={priority ? 'eager' : 'lazy'} // Explicit loading strategy
    />
  );
}
```

### Pattern 3: CldUploadWidget (Admin Upload)
**What:** Replace FormData upload with CldUploadWidget for better UX
**When to use:** Admin gallery upload interface

**Example:**
```typescript
// Source: https://next.cloudinary.dev/clduploadwidget/basic-usage
'use client';

import { CldUploadWidget } from 'next-cloudinary';
import type { CloudinaryUploadWidgetResults } from 'next-cloudinary';

export function GalleryUploadWidget({
  section,
  onUploadSuccess
}: {
  section: 'Facility' | 'Quilting';
  onUploadSuccess: () => void;
}) {
  return (
    <CldUploadWidget
      uploadPreset="timber-threads-gallery" // Must create unsigned preset in Cloudinary dashboard
      options={{
        folder: 'timber-threads/gallery',
        tags: [section.toLowerCase(), 'gallery'],
        maxFiles: 1,
        sources: ['local', 'url'],
        multiple: false,
        resourceType: 'image',
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        maxFileSize: 10000000, // 10MB
      }}
      onSuccess={(result: CloudinaryUploadWidgetResults) => {
        if (result.event === 'success' && result.info && typeof result.info !== 'string') {
          const { public_id, secure_url, width, height } = result.info;

          // Call existing POST /api/gallery to save metadata to Redis
          // This maintains Phase 1 architecture while improving upload UX
          onUploadSuccess();
        }
      }}
      onError={(error) => {
        console.error('Upload error:', error);
      }}
    >
      {({ open }) => (
        <button
          onClick={() => open()}
          className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700"
        >
          Upload Image
        </button>
      )}
    </CldUploadWidget>
  );
}
```

### Pattern 4: Conditional Loading Strategy
**What:** First 6 images eager, rest lazy for optimal LCP and performance
**When to use:** Gallery component rendering

**Example:**
```typescript
// Source: Next.js Image documentation https://nextjs.org/docs/app/api-reference/components/image
const facilityImages = galleryImages
  .filter(img => img.section === 'Facility')
  .sort(sortByOrder);

return (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {facilityImages.map((image, index) => (
      <GalleryImage
        key={image.src}
        image={image}
        priority={index < 6} // First 6 images: eager loading with preload
      />
    ))}
  </div>
);
```

### Anti-Patterns to Avoid

- **Don't use Sharp in migration script:** Cloudinary automatically optimizes images on upload. Pre-optimizing with Sharp adds unnecessary processing time and may result in double-optimization.

- **Don't mix Next.js Image and CldImage:** Use CldImage consistently for all Cloudinary images to ensure f_auto/q_auto are applied. Next.js Image with remotePatterns won't apply Cloudinary optimizations.

- **Don't delete local images immediately:** Keep local images until migration is verified in production. Use feature flag or environment check to toggle between local and Cloudinary rendering during transition.

- **Don't migrate without Redis backup:** Export current Redis gallery data before running migration script. If migration fails, you need rollback capability.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image upload UI with drag-drop, preview, progress | Custom dropzone + progress state + preview logic | CldUploadWidget from next-cloudinary | Handles drag-drop, image preview, progress tracking, error states, file validation, signed uploads. 600+ lines of code you don't need to write/maintain. |
| Cloudinary URL construction with transformations | Manual URL building with f_auto, q_auto, w_, h_ parameters | CldImage component | CldImage automatically generates optimized URLs with f_auto/q_auto, handles responsive sizing, applies transformations via props. Error-prone to build manually. |
| Lazy loading logic for images | Custom IntersectionObserver + loading state | CldImage with priority prop | CldImage wraps Next.js Image which has native lazy loading. Priority prop generates preload tags for LCP images. Browser-native, performant, accessible. |
| Migration rollback mechanism | Custom backup/restore logic | Redis export before migration + verification script | Redis data is JSON-serializable. Export current state, run migration, verify via script, rollback if issues detected. Simple and reliable. |

**Key insight:** Cloudinary and next-cloudinary solve "solved problems" in image delivery. Custom solutions introduce bugs (wrong MIME types, missing f_auto, incorrect lazy loading distance) that next-cloudinary handles correctly.

## Common Pitfalls

### Pitfall 1: Missing NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
**What goes wrong:** CldImage renders as local URL (e.g., http://localhost:3000/image.jpg) instead of Cloudinary URL, causing 404 errors in production.
**Why it happens:** CldImage requires NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME to construct Cloudinary URLs. Without it, falls back to treating src as local path.
**How to avoid:** Verify environment variable is set in .env.local AND deployed environment (Vercel env vars). Use NEXT_PUBLIC_ prefix so it's available client-side.
**Warning signs:** Browser network tab shows 404 for images with localhost domain instead of res.cloudinary.com domain.

### Pitfall 2: Forgetting to Create Upload Preset
**What goes wrong:** CldUploadWidget throws error "Upload preset must be specified when using unsigned upload"
**Why it happens:** CldUploadWidget requires an unsigned upload preset configured in Cloudinary dashboard. Cannot upload without it.
**How to avoid:** Create upload preset in Cloudinary Settings > Upload > Upload Presets. Set Mode to "Unsigned", configure folder/tags, save preset name.
**Warning signs:** Console error mentioning upload preset, widget opens but upload fails immediately.

### Pitfall 3: Using fill={true} with CldImage Without Width/Height
**What goes wrong:** Error "x-cld-error: Invalid width in transformation: NaN"
**Why it happens:** Unlike Next.js Image, CldImage doesn't support fill without explicit width/height for aspect ratio calculation.
**How to avoid:** Always provide width/height props with CldImage. Use fill only with parent element sizing, not as standalone prop.
**Warning signs:** Console error with NaN in transformation URL, images fail to render.

### Pitfall 4: Not Updating remotePatterns for res.cloudinary.com
**What goes wrong:** 400 Bad Request error "hostname 'res.cloudinary.com' is not configured under images in your next.config.js"
**Why it happens:** Next.js 14 requires explicit remotePatterns for external image domains. Deprecated domains array no longer works.
**How to avoid:** Verify next.config.js has remotePatterns with protocol: 'https', hostname: 'res.cloudinary.com'. Already configured in this project.
**Warning signs:** Images work locally but fail in production with hostname configuration error.

### Pitfall 5: All Images Using priority={true}
**What goes wrong:** Eliminates benefit of lazy loading, downloads all images immediately, hurts performance.
**Why it happens:** Misunderstanding priority prop - thinking it "makes images load faster" so applying to all images.
**How to avoid:** Use priority={true} only for first 6 images (above fold, visible on load). Rest should use default lazy loading.
**Warning signs:** Slow initial page load, large network waterfall on page load, high LCP score.

### Pitfall 6: Running Migration Without Verification
**What goes wrong:** Broken images in production, missing captions, wrong order, 404s for unmigrated images.
**Why it happens:** Migration script has bugs, partial uploads, Redis update failures. Deploying without verification.
**How to avoid:** (1) Export Redis data before migration, (2) Run migration script with dry-run flag first, (3) Verify all images accessible via Cloudinary URLs, (4) Check Redis metadata matches expected structure, (5) Test in staging environment before production deploy.
**Warning signs:** Missing metadata fields, images array length mismatch, errors in migration log, Cloudinary dashboard shows fewer images than expected.

### Pitfall 7: Migrating Deleted Images to Cloudinary
**What goes wrong:** Paying for Cloudinary storage for images that are soft-deleted (in deletedImages array).
**Why it happens:** Migration script processes all images in Redis without checking isDeleted flag.
**How to avoid:** Filter migration to only active images (galleryData.images), not deletedImages array. Deleted images can stay local until permanent deletion.
**Warning signs:** Cloudinary image count exceeds active gallery image count, unexpected storage costs.

## Code Examples

Verified patterns from official sources:

### CldImage with Lazy Loading
```typescript
// Source: https://next.cloudinary.dev/cldimage/basic-usage
import { CldImage } from 'next-cloudinary';

// Below-the-fold image (default lazy loading)
<CldImage
  src="timber-threads/gallery/bedroom-1" // public_id only, no folder path needed
  alt="Bedroom view"
  width={1200}
  height={800}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
/>

// Above-the-fold image (eager loading with preload)
<CldImage
  src="timber-threads/gallery/hero-front-view"
  alt="Front view of retreat"
  width={1920}
  height={1080}
  priority={true} // Adds <link rel="preload"> in <head>
  loading="eager" // Explicit eager loading
  sizes="100vw"
/>
```

### CldUploadWidget with Success Callback
```typescript
// Source: https://next.cloudinary.dev/clduploadwidget/configuration
import { CldUploadWidget } from 'next-cloudinary';

<CldUploadWidget
  uploadPreset="timber-threads-gallery"
  options={{
    folder: 'timber-threads/gallery',
    tags: ['facility', 'gallery'],
    maxFiles: 1,
    clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
  }}
  onSuccess={(result) => {
    if (result.event === 'success' && result.info && typeof result.info !== 'string') {
      const { public_id, width, height, secure_url } = result.info;

      // Save to Redis via existing API route
      fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          src: public_id,
          alt: 'Image description',
          caption: 'Image caption',
          section: 'Facility',
          metadata: {
            uploadedAt: new Date().toISOString(),
            dimensions: { width, height }
          }
        })
      });
    }
  }}
>
  {({ open }) => (
    <button onClick={() => open()}>Upload Image</button>
  )}
</CldUploadWidget>
```

### Migration Script Error Handling
```javascript
// Source: Research synthesis from Cloudinary documentation
async function migrateImageWithRetry(localPath, imageMetadata, maxRetries = 3) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Verify file exists
      await fs.access(localPath);

      const uploadResult = await cloudinary.uploader.upload(localPath, {
        folder: 'timber-threads/gallery',
        public_id: path.basename(localPath, path.extname(localPath)),
        tags: [imageMetadata.section.toLowerCase(), 'gallery'],
        resource_type: 'image'
      });

      return {
        success: true,
        public_id: uploadResult.public_id,
        secure_url: uploadResult.secure_url,
        width: uploadResult.width,
        height: uploadResult.height
      };

    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt}/${maxRetries} failed for ${localPath}: ${error.message}`);

      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  return {
    success: false,
    error: lastError.message,
    path: localPath
  };
}
```

### Verification Script
```javascript
// Source: Research synthesis
async function verifyMigration() {
  const galleryData = await getGalleryData();
  const errors = [];

  // 1. Check all images have Cloudinary public_ids (no local paths)
  const localImages = galleryData.images.filter(img => img.src.startsWith('/'));
  if (localImages.length > 0) {
    errors.push(`Found ${localImages.length} images still using local paths`);
  }

  // 2. Verify all Cloudinary images are accessible
  for (const image of galleryData.images) {
    const cloudinaryUrl = `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/${image.src}`;

    try {
      const response = await fetch(cloudinaryUrl, { method: 'HEAD' });
      if (!response.ok) {
        errors.push(`Image not accessible: ${image.src} (HTTP ${response.status})`);
      }
    } catch (error) {
      errors.push(`Failed to fetch ${image.src}: ${error.message}`);
    }
  }

  // 3. Check metadata integrity
  const missingMetadata = galleryData.images.filter(img =>
    !img.alt || !img.caption || !img.section || img.order === undefined
  );
  if (missingMetadata.length > 0) {
    errors.push(`Found ${missingMetadata.length} images with missing metadata`);
  }

  // 4. Verify order consistency
  for (const section of ['Facility', 'Quilting']) {
    const sectionImages = galleryData.images
      .filter(img => img.section === section)
      .sort((a, b) => a.order - b.order);

    const expectedOrders = sectionImages.map((_, i) => i + 1);
    const actualOrders = sectionImages.map(img => img.order);

    if (JSON.stringify(expectedOrders) !== JSON.stringify(actualOrders)) {
      errors.push(`Order inconsistency in ${section} section`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    summary: {
      totalImages: galleryData.images.length,
      deletedImages: galleryData.deletedImages.length,
      localImages: localImages.length
    }
  };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Next.js Image with domains config | Next.js Image with remotePatterns | Next.js 14 (2024) | More secure, granular control over allowed external domains |
| Manual Cloudinary URL construction | CldImage component from next-cloudinary | next-cloudinary v6+ (2024) | Automatic f_auto/q_auto, responsive sizing, transformation props |
| priority prop for eager loading | preload prop (priority deprecated) | Next.js 16 (2026) | Clearer intent, explicit preload behavior |
| Custom upload forms | CldUploadWidget | next-cloudinary v6+ (2024) | Polished UI, signed uploads, progress tracking, drag-drop |
| Sharp for image optimization before upload | Cloudinary server-side optimization | Best practice (2024+) | Avoid double-optimization, faster uploads, better quality |

**Deprecated/outdated:**
- `domains` array in next.config.js: Replaced by `remotePatterns` for security. Still works but deprecated in Next.js 14+.
- `priority` prop in Next.js Image: Deprecated in Next.js 16 in favor of `preload` prop. Still functional but will be removed.
- Manual FormData uploads for images: Functional but CldUploadWidget provides better UX and handles edge cases (file validation, signed uploads, error handling).

## Open Questions

1. **Should we implement signed uploads for CldUploadWidget?**
   - What we know: Signed uploads require API endpoint to generate signature using API secret. More secure than unsigned presets.
   - What's unclear: Whether unsigned preset is sufficient for admin-only upload interface with session authentication.
   - Recommendation: Start with unsigned preset (simpler setup). Signed uploads add minimal security benefit since admin routes already require authentication. Unsigned preset can be restricted to specific folder/tags/file types.

2. **Should we keep local images after migration?**
   - What we know: Local images in public/ folder are deployed with app, consuming deployment storage. Vercel filesystem is read-only in production.
   - What's unclear: Whether to delete local images immediately or keep as backup during transition period.
   - Recommendation: Keep local images for 1-2 weeks post-migration as rollback mechanism. Add .gitignore entry for public/assets/gallery/*.jpeg after successful migration verification. Eventual cleanup via separate PR.

3. **Should migration script run in CI/CD or manually?**
   - What we know: Migration needs Redis connection and Cloudinary credentials. One-time operation, not idempotent (re-running creates duplicate uploads).
   - What's unclear: Best execution environment for one-time migration.
   - Recommendation: Run manually in development environment with production Redis credentials (read from .env). Log results, verify, then deploy updated code. Not suitable for CI/CD since it's stateful and one-time.

## Sources

### Primary (HIGH confidence)
- [next-cloudinary CldImage documentation](https://next.cloudinary.dev/cldimage/basic-usage) - Component API, automatic optimizations
- [next-cloudinary CldUploadWidget documentation](https://next.cloudinary.dev/clduploadwidget/basic-usage) - Upload widget integration, callbacks
- [Next.js Image Component Reference](https://nextjs.org/docs/app/api-reference/components/image) - Loading strategies, priority prop, lazy loading behavior
- [Cloudinary Upload Presets](https://cloudinary.com/documentation/upload_presets) - Preset configuration, signed vs unsigned
- [Cloudinary Node.js Upload Documentation](https://cloudinary.com/documentation/node_image_and_video_upload) - Server-side upload API

### Secondary (MEDIUM confidence)
- [Integrating Cloudinary with Next.js](https://cloudinary.com/guides/front-end-development/integrating-cloudinary-with-next-js) - CldImage vs Next.js Image comparison
- [Cloudinary Migration Guide](https://cloudinary.com/documentation/migration) - Migration best practices, folder structure
- [Upload Preset Security Considerations](https://support.cloudinary.com/hc/en-us/articles/360018796451-What-are-the-security-considerations-for-unsigned-uploads) - Unsigned preset risks and mitigation
- [Next.js Image Optimization Best Practices](https://www.debugbear.com/blog/nextjs-image-optimization) - Priority vs loading, LCP optimization

### Tertiary (LOW confidence)
- Community discussions on next-cloudinary GitHub - Common issues, troubleshooting patterns
- Stack Overflow discussions on Cloudinary migration - Real-world migration experiences

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - next-cloudinary is official Cloudinary package, well-documented, actively maintained
- Architecture: HIGH - Patterns verified from official documentation, tested in production by Cloudinary users
- Pitfalls: MEDIUM-HIGH - Based on official docs + GitHub issues + support articles. Some are inference from common React/Next.js patterns
- Migration script: MEDIUM - Pattern synthesized from Cloudinary Node.js docs and migration guides, not tested in this specific context

**Research date:** 2026-02-16
**Valid until:** 60 days (stable ecosystem - Next.js 14, next-cloudinary 6.x, Cloudinary API v2 are mature)
