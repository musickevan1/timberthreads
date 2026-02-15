# Phase 2: Gallery Migration - Research

**Researched:** 2026-02-14
**Domain:** Cloudinary Gallery Integration with next-cloudinary
**Confidence:** HIGH

## Summary

Phase 2 migrates the existing gallery from local file storage (`public/assets/gallery/`) and file-based JSON database (`db.json`) to Cloudinary CDN with Vercel KV metadata storage. The core challenge is updating all image references while maintaining admin functionality (upload, reorder, edit captions, soft-delete, restore). The migration solves the critical production bug where all gallery changes are lost on Vercel redeployment due to read-only filesystem.

**Primary recommendation:** Use `CldImage` from next-cloudinary (not direct `next/image` with Cloudinary URLs) for automatic optimization. Replace file writes with Cloudinary SDK for images and Vercel KV for metadata. Implement signed uploads via `/api/cloudinary-signature` endpoint to prevent unauthorized access.

**Critical success factor:** Phase 1 must complete first (Cloudinary account + Vercel KV configured). This research assumes Phase 1 delivered working infrastructure with environment variables set and KV client initialized.

## Standard Stack

### Core (Already Installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| cloudinary | 2.5.1 (installed) | Node.js SDK for Cloudinary API | Official SDK for server-side operations (upload, delete, admin API). Handles authentication, transformations, and cloud storage operations. |
| next-cloudinary | 6.16.0 (installed) | Next.js components for Cloudinary | Provides `CldImage` and `CldUploadWidget` with automatic optimization (WebP/AVIF), responsive sizing, and lazy loading. Medium Source Reputation (79.6 benchmark), 380 code snippets in Context7. |
| sharp | 0.33.5 (installed) | Image processing for Node.js | Already used in current implementation for local optimization. Will be replaced by Cloudinary's cloud-based optimization but kept for backward compatibility. |
| @vercel/kv | Latest | Redis-based key-value store | Persistent metadata storage replacing db.json. Integrated with Vercel, free tier: 256MB storage, 100K reads/month. |

### Supporting (Phase 1 Deliverable)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lib/cloudinary.ts | Custom | Centralized Cloudinary config | Phase 1 delivered this - contains SDK initialization, upload helpers, transformation presets |
| lib/kv.ts | Custom | Vercel KV client wrapper | Phase 1 delivered this - provides `getGalleryData()` and `saveGalleryData()` functions |

### Installation (If Phase 1 Incomplete)

Already installed (verified in package.json). If Phase 1 infrastructure is incomplete, install Vercel KV:

```bash
npm install @vercel/kv
```

Configuration in Vercel dashboard: Add "Vercel KV" storage addon (auto-configures environment variables).

## Architecture Patterns

### Recommended Data Model Changes

**Current `ImageAsset` interface:**
```typescript
// src/app/api/gallery/types.ts
export interface ImageAsset {
  src: string; // Currently: '/assets/gallery/filename.webp'
  alt: string;
  caption: string;
  section: 'Facility' | 'Quilting';
  order: number;
  metadata?: {
    uploadedAt: string;
    dimensions?: { width: number; height: number; }
  };
  isDeleted?: boolean;
  deletedAt?: string;
}
```

**Updated for Cloudinary:**
```typescript
export interface ImageAsset {
  src: string; // NEW: Cloudinary public_id (e.g., 'timber-threads/facility/bedroom-1')
  cloudinaryUrl?: string; // OPTIONAL: Full Cloudinary URL for reference
  alt: string;
  caption: string;
  section: 'Facility' | 'Quilting';
  order: number;
  metadata?: {
    uploadedAt: string;
    dimensions?: { width: number; height: number; };
    cloudinaryAssetId?: string; // Cloudinary's internal asset ID
    format?: string; // Original format (jpg, png, etc.)
  };
  isDeleted?: boolean;
  deletedAt?: string;
}
```

**Rationale:**
- `src` stores Cloudinary `public_id` (not full URL) for flexibility in transformations
- `CldImage` component accepts `public_id` via `src` prop
- `cloudinaryUrl` optional field for debugging/reference
- `cloudinaryAssetId` enables Cloudinary Admin API operations (analytics, deletion)
- Maintains backward compatibility with existing `order`, `section`, caption fields

### Pattern 1: Gallery Display with CldImage

**What:** Replace `next/image` with `CldImage` from next-cloudinary for automatic format optimization and responsive sizing.

**Current implementation (`src/components/Gallery.tsx`):**
```typescript
// Lines 109-117 (current)
<Image
  src={image.src}  // '/assets/gallery/filename.webp'
  alt={image.alt}
  fill
  className="object-cover transition-transform duration-300 group-hover:scale-105"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  quality={85}
  priority
/>
```

**Updated with Cloudinary:**
```typescript
// src/components/Gallery.tsx
import { CldImage } from 'next-cloudinary';

// Inside map (lines 98-123)
<CldImage
  src={image.src}  // Cloudinary public_id: 'timber-threads/facility/bedroom-1'
  alt={image.alt}
  width={800}
  height={450}
  crop="fill"
  gravity="auto"
  loading={index < 6 ? 'eager' : 'lazy'}  // First 6 eager, rest lazy (GALL-06)
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="object-cover transition-transform duration-300 group-hover:scale-105"
/>
```

**Key changes:**
- Replace `fill` prop with explicit `width` and `height` (required for CldImage)
- Add `crop="fill"` and `gravity="auto"` for smart cropping
- Add `loading` prop based on index (first 6 eager for above-fold, rest lazy)
- Remove `quality` and `priority` props (CldImage handles automatically with `f_auto`, `q_auto`)

**Why this works:**
- `CldImage` automatically applies Cloudinary transformations: `f_auto` (WebP/AVIF), `q_auto` (quality optimization), `dpr_auto` (device pixel ratio)
- `crop="fill"` maintains aspect ratio while filling container
- `gravity="auto"` uses AI-based smart cropping to focus on important content
- Lazy loading saves bandwidth for images below the fold (GALL-06 requirement)

### Pattern 2: Admin Upload with CldUploadWidget

**What:** Replace current file upload + Sharp processing with Cloudinary's direct upload widget.

**Current implementation (`src/app/admin/gallery/page.tsx`):**
```typescript
// Lines 73-143 (current upload handler)
const handleImageUpload = async (fileInput: React.ChangeEvent<HTMLInputElement> | File) => {
  // File validation, FormData creation, fetch to /api/gallery POST
  const response = await fetch('/api/gallery', {
    method: 'POST',
    body: formData,
  });
  // ...
};
```

**Updated with Cloudinary:**
```typescript
// src/app/admin/gallery/components/UploadSection.tsx
import { CldUploadWidget } from 'next-cloudinary';

export default function UploadSection({ activeTab, onUploadSuccess }) {
  return (
    <CldUploadWidget
      uploadPreset="timber-threads-unsigned"  // Or use signed uploads (recommended)
      signatureEndpoint="/api/cloudinary-signature"  // For signed uploads
      folder={`timber-threads/${activeTab.toLowerCase()}`}  // Organize by section
      onSuccess={(result) => {
        if (result.event === 'success' && result.info) {
          const uploadedImage = {
            src: result.info.public_id,  // Cloudinary public_id
            alt: result.info.original_filename,
            caption: result.info.original_filename.replace(/[-_]/g, ' '),
            section: activeTab === 'Facility' ? 'Facility' : 'Quilting',
            metadata: {
              uploadedAt: new Date().toISOString(),
              dimensions: {
                width: result.info.width,
                height: result.info.height,
              },
              cloudinaryAssetId: result.info.asset_id,
              format: result.info.format,
            },
          };
          onUploadSuccess(uploadedImage);  // Save to Vercel KV
        }
      }}
      onError={(error) => {
        console.error('Upload error:', error);
      }}
    >
      {({ open }) => (
        <button
          onClick={() => open()}
          className="px-4 py-2 bg-teal-600 text-white rounded-md"
        >
          Upload Image
        </button>
      )}
    </CldUploadWidget>
  );
}
```

**Alternative: Manual Upload via API (more control):**
```typescript
// src/app/api/gallery/route.ts POST handler
import { v2 as cloudinary } from 'cloudinary';

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const section = formData.get('section') as string;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Upload to Cloudinary
  const uploadResult = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `timber-threads/${section.toLowerCase()}`,
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' },
          { quality: 'auto:good', fetch_format: 'auto' }
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });

  // Save metadata to Vercel KV
  const kv = await getGalleryData();
  kv.images.push({
    src: uploadResult.public_id,
    alt: file.name,
    caption: formData.get('caption'),
    section,
    order: kv.images.filter(img => img.section === section).length + 1,
    metadata: {
      uploadedAt: new Date().toISOString(),
      dimensions: { width: uploadResult.width, height: uploadResult.height },
      cloudinaryAssetId: uploadResult.asset_id,
    },
  });
  await saveGalleryData(kv);

  return NextResponse.json({ success: true, image: uploadResult });
}
```

**Recommendation:** Use CldUploadWidget for simplicity, or manual API upload for fine-grained control. Manual upload allows custom validation, caption processing, and error handling.

### Pattern 3: Metadata Storage with Vercel KV

**What:** Replace `db.json` file reads/writes with Vercel KV operations.

**Current implementation (`src/app/api/gallery/route.ts`):**
```typescript
// Lines 11-17 (current getDB)
async function getDB(): Promise<GalleryState> {
  try {
    const data = await readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return { images: [], deletedImages: [] };
  }
}

// Lines 20-42 (current saveDB)
async function saveDB(data: GalleryState) {
  // Checks isProduction, logs warning, doesn't persist in Vercel
  await fsWriteFile(DB_PATH, JSON.stringify(data, null, 2));
}
```

**Updated with Vercel KV (delivered by Phase 1):**
```typescript
// src/lib/kv.ts (Phase 1 deliverable)
import { kv } from '@vercel/kv';
import { GalleryState } from '@/app/api/gallery/types';

export async function getGalleryData(): Promise<GalleryState> {
  const data = await kv.get<GalleryState>('gallery');
  return data || { images: [], deletedImages: [] };
}

export async function saveGalleryData(data: GalleryState): Promise<void> {
  await kv.set('gallery', data);
}

// src/app/api/gallery/route.ts - Updated to use KV
import { getGalleryData, saveGalleryData } from '@/lib/kv';

export async function GET() {
  const data = await getGalleryData();
  return NextResponse.json(data);
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const body = await request.json();

  const db = await getGalleryData();

  // ... existing action handlers (softDelete, restore, updateCaption, etc.)

  await saveGalleryData(db);
  return NextResponse.json({ message: 'Success', data: db });
}
```

**Key changes:**
- Remove all `readFile` and `writeFile` operations
- Replace `getDB()` with `getGalleryData()` (from lib/kv.ts)
- Replace `saveDB()` with `saveGalleryData()` (from lib/kv.ts)
- Remove production environment checks (Vercel KV works in all environments)
- No changes needed to action handlers (softDelete, restore, updateCaption, updateOrder) - data structure unchanged

### Pattern 4: Signed Uploads for Security

**What:** Generate server-side signatures for Cloudinary uploads to prevent unauthorized access.

**Implementation:**
```typescript
// src/app/api/cloudinary-signature/route.ts (NEW FILE)
import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { paramsToSign } = body;

  // Generate signature using API secret (server-side only)
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json({ signature });
}
```

**Usage with CldUploadWidget:**
```typescript
<CldUploadWidget
  signatureEndpoint="/api/cloudinary-signature"
  folder="timber-threads/facility"
  // ... other props
/>
```

**Why signed uploads:**
- Prevents unauthorized users from uploading to your Cloudinary account
- API secret never exposed to client-side code
- Can set upload restrictions (file types, size limits) server-side
- Recommended for production environments

**Alternative: Unsigned uploads (simpler, less secure):**
- Create unsigned upload preset in Cloudinary dashboard
- Use `uploadPreset="timber-threads-unsigned"` in CldUploadWidget
- Suitable for development/testing only

### Pattern 5: Image Deletion from Cloudinary

**What:** Delete images from Cloudinary storage when permanently deleted.

**Current implementation (commented out):**
```typescript
// src/app/api/gallery/route.ts DELETE (lines 389-425)
export async function DELETE(request: NextRequest) {
  // ... get src from query params
  // Lines 407-408: commented out cloudinary deletion
  console.log('Would delete from storage:', src);
}
```

**Updated with Cloudinary:**
```typescript
// src/app/api/gallery/route.ts DELETE
import { v2 as cloudinary } from 'cloudinary';
import { getGalleryData, saveGalleryData } from '@/lib/kv';

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get('src');  // Cloudinary public_id

  if (!src) {
    return NextResponse.json({ error: 'No src provided' }, { status: 400 });
  }

  const db = await getGalleryData();
  const imageToDelete = db.deletedImages.find(img => img.src === src);

  if (!imageToDelete) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }

  // Delete from Cloudinary
  try {
    await cloudinary.uploader.destroy(src);  // src is public_id
    console.log('Deleted from Cloudinary:', src);
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
    // Continue with metadata deletion even if Cloudinary fails
  }

  // Remove from metadata
  db.deletedImages = db.deletedImages.filter(img => img.src !== src);
  await saveGalleryData(db);

  return NextResponse.json({ message: 'Image permanently deleted', data: db });
}
```

**Error handling considerations:**
- If Cloudinary deletion fails but metadata deletion succeeds, image becomes orphaned in Cloudinary (wastes quota)
- If metadata deletion fails but Cloudinary deletion succeeds, image reference remains but file is gone (broken links)
- **Recommendation:** Log failures and implement cleanup script to reconcile orphaned images

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image optimization (WebP, AVIF, quality) | Custom Sharp pipelines with format detection | Cloudinary automatic format (`f_auto`, `q_auto`) via CldImage | Cloudinary handles browser capability detection, 20+ optimization parameters, and CDN delivery. Custom solution requires maintaining browser support matrix and transformation logic. |
| Responsive image sizes | Manual srcset generation with multiple Sharp transforms | Cloudinary responsive breakpoints (`w_auto`, `dpr_auto`) | Cloudinary auto-generates srcset based on `sizes` prop. Custom solution requires defining breakpoints, generating multiple sizes, and updating when design changes. |
| Direct upload to cloud storage | Custom multipart upload with presigned URLs | CldUploadWidget or Cloudinary upload API | Widget handles progress tracking, error recovery, drag-and-drop, multiple files, and client-side validation. Custom solution requires implementing upload resumption and chunk handling. |
| Image metadata extraction | Sharp metadata + custom exif parsing | Cloudinary upload response with auto-populated metadata | Cloudinary extracts dimensions, format, color profile, GPS data, and more during upload. Custom solution requires handling multiple image formats and metadata standards. |
| CDN delivery and caching | Custom Vercel Edge Middleware for cache headers | Cloudinary's global CDN with automatic cache management | Cloudinary has 300+ edge locations with intelligent caching, auto-invalidation, and version management. Custom solution requires managing cache keys and invalidation logic. |

**Key insight:** Cloudinary is a complete image pipeline (upload, storage, transformation, optimization, delivery). Hand-rolling even one piece (e.g., "just use Cloudinary for storage but optimize locally") loses 80% of the value and adds complexity.

## Common Pitfalls

### Pitfall 1: Using next/image Instead of CldImage

**What goes wrong:** Developers use `next/image` with Cloudinary URLs instead of `CldImage` component, losing automatic optimization.

```typescript
// WRONG: Loses Cloudinary optimizations
<Image
  src={`https://res.cloudinary.com/demo/image/upload/${publicId}`}
  alt={alt}
  width={800}
  height={600}
/>

// RIGHT: Automatic f_auto, q_auto, dpr_auto
import { CldImage } from 'next-cloudinary';
<CldImage
  src={publicId}  // Just the public_id, not full URL
  alt={alt}
  width={800}
  height={600}
/>
```

**Why it happens:** Developers familiar with next/image assume it's the same. They manually construct Cloudinary URLs.

**How to avoid:**
- Always import `CldImage` from 'next-cloudinary', never use `next/image` for Cloudinary images
- Store only `public_id` in database, not full URLs
- Let CldImage construct URLs with transformations automatically

**Warning signs:**
- Seeing `res.cloudinary.com` in src props
- Manual URL construction with template literals
- No automatic format optimization (all images served as JPG/PNG)

### Pitfall 2: Forgetting to Update next.config.js

**What goes wrong:** After migration, images fail to load with 400 errors or show as broken. Next.js blocks Cloudinary domain.

**Why it happens:** next.config.js requires explicit `remotePatterns` for external image domains. Current config has `hostname: '**'` (allows all) but this is bad practice and may be tightened.

**Current config (`next.config.js`):**
```javascript
// Line 4: images.unoptimized: true (disables all optimization)
// Line 8: hostname: '**' (allows all domains - security risk)
images: {
  unoptimized: true,
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**',
    },
  ],
},
```

**Fixed config for Cloudinary:**
```javascript
images: {
  unoptimized: false,  // Re-enable optimization
  remotePatterns: [
    {
      protocol: 'https',
      hostname: 'res.cloudinary.com',  // Specific Cloudinary CDN domain
      pathname: '/YOUR_CLOUD_NAME/**',  // Restrict to your cloud
    },
  ],
},
```

**How to avoid:**
- Update next.config.js BEFORE testing gallery display
- Use specific hostname (`res.cloudinary.com`) not wildcard
- Set `unoptimized: false` to re-enable Next.js image optimization (works with Cloudinary)
- Test in development first, then preview deployment before production

**Warning signs:**
- Console errors: "Invalid src prop on `next/image`"
- 400 Bad Request errors for image URLs
- Images work locally but fail in Vercel deployment

### Pitfall 3: Not Migrating Existing Images to Cloudinary

**What goes wrong:** New uploads go to Cloudinary, but existing images remain in `public/assets/gallery/`. Gallery displays mix of local and Cloudinary images, causing inconsistent optimization and broken references after deployment.

**Why it happens:** Developers focus on new upload flow, forget to migrate existing images. db.json contains old paths (`/assets/gallery/`), new images have Cloudinary public_ids.

**How to avoid:**
1. **Before changing code:** Create migration script to upload existing images to Cloudinary
2. **During migration:** Update metadata in Vercel KV with new Cloudinary public_ids
3. **After migration:** Keep old images as backup, but don't reference them

**Migration script (run once):**
```typescript
// scripts/migrate-gallery-to-cloudinary.ts
import { v2 as cloudinary } from 'cloudinary';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

async function migrateGallery() {
  // Read existing db.json
  const dbPath = path.join(process.cwd(), 'src/app/api/gallery/db.json');
  const db = JSON.parse(await readFile(dbPath, 'utf-8'));

  for (const image of db.images) {
    if (image.src.startsWith('/assets/gallery/')) {
      // Local image - upload to Cloudinary
      const localPath = path.join(process.cwd(), 'public', image.src);

      const uploadResult = await cloudinary.uploader.upload(localPath, {
        folder: `timber-threads/${image.section.toLowerCase()}`,
        public_id: path.basename(image.src, path.extname(image.src)),
      });

      // Update image.src to Cloudinary public_id
      image.src = uploadResult.public_id;
      image.metadata.cloudinaryAssetId = uploadResult.asset_id;

      console.log(`Migrated: ${localPath} -> ${uploadResult.public_id}`);
    }
  }

  // Save updated db.json (will be copied to Vercel KV in next step)
  await writeFile(dbPath, JSON.stringify(db, null, 2));
  console.log('Migration complete. Now upload this data to Vercel KV.');
}

migrateGallery();
```

**Run migration:**
```bash
npx tsx scripts/migrate-gallery-to-cloudinary.ts
```

**Then manually copy to Vercel KV or use init script:**
```typescript
// scripts/init-vercel-kv.ts
import { kv } from '@vercel/kv';
import { readFile } from 'fs/promises';

async function initKV() {
  const dbPath = path.join(process.cwd(), 'src/app/api/gallery/db.json');
  const db = JSON.parse(await readFile(dbPath, 'utf-8'));
  await kv.set('gallery', db);
  console.log('Vercel KV initialized with migrated data');
}
```

**Warning signs:**
- Some images load fast (Cloudinary CDN), others slow (Vercel static assets)
- Mix of `/assets/gallery/` and Cloudinary public_ids in gallery
- Broken images after Vercel deployment (local files not deployed)

### Pitfall 4: Exceeding Cloudinary Free Tier Bandwidth

**What goes wrong:** Site gets moderate traffic, Cloudinary bandwidth limit (25GB/month free tier) is exhausted. Images stop loading, site appears broken.

**Why it happens:**
- Serving full-resolution images (1920x1080) to mobile devices
- Not using lazy loading (all images load on page load)
- High-traffic spike (viral post, featured on retreat directory)

**Cloudinary free tier limits:**
- 25 GB storage
- 25 GB bandwidth per month
- 25,000 transformations per month

**Bandwidth calculation example:**
- Average image: 200 KB (optimized WebP)
- 1,000 page views/month × 12 images/page = 12,000 image loads
- 12,000 × 200 KB = 2.4 GB bandwidth (within limit)
- BUT: If images are 500 KB each → 6 GB bandwidth
- OR: 5,000 page views → 12 GB bandwidth (getting close to limit)

**How to avoid:**
1. **Implement lazy loading:** Only load images when scrolled into view (first 6 eager, rest lazy - GALL-06)
2. **Responsive sizing:** Serve smaller images to mobile devices via `sizes` prop
3. **Aggressive optimization:** Use `q_auto:eco` or `q_auto:low` for thumbnails
4. **Monitor usage:** Check Cloudinary dashboard weekly during first month
5. **Set up alerts:** Configure Cloudinary email alerts at 80% bandwidth usage

**Responsive sizing example:**
```typescript
<CldImage
  src={publicId}
  width={800}
  height={600}
  sizes="(max-width: 640px) 400px, (max-width: 1024px) 600px, 800px"
  // Mobile: 400px wide, Tablet: 600px, Desktop: 800px
/>
```

**Warning signs:**
- Images load for first few weeks, then stop loading mid-month
- Cloudinary dashboard shows bandwidth near limit
- Email alert from Cloudinary about quota

### Pitfall 5: Broken Reorder Functionality After Migration

**What goes wrong:** Admin can drag-and-drop images to reorder, but changes don't persist. Order resets on page reload.

**Why it happens:** Reorder handler (`updateOrder` action) still references old image paths. Vercel KV data structure uses Cloudinary public_ids, but reorder logic matches on old `/assets/gallery/` paths.

**Current reorder implementation (`src/app/api/gallery/route.ts`, lines 285-359):**
```typescript
// Line 307-308: Filters images by section
const sectionImages = db.images.filter(img => img.section === section);

// Line 318-320: Checks if ordered images exist in section
const missingImages = orderedImages.filter(src =>
  !sectionImages.some(img => img.src === src)
);

// Line 352-357: Updates order by matching src
orderedImages.forEach((src: string, index: number) => {
  const image = db.images.find(img => img.src === src && img.section === section);
  if (image) {
    image.order = index + 1;
  }
});
```

**This code will continue to work IF:**
- `orderedImages` array contains Cloudinary public_ids (not old paths)
- Frontend `GalleryGrid` component sends Cloudinary public_ids in reorder request

**Potential break point:**
- If frontend sends old paths but KV has new public_ids → `missingImages` error
- If frontend sends public_ids but matching logic is case-sensitive → no match found

**How to avoid:**
1. **Update frontend to send correct public_ids:** Verify `GalleryGrid` drag-and-drop handler sends `image.src` (should be Cloudinary public_id after migration)
2. **Test reorder after migration:** Manually test drag-and-drop in admin UI with migrated data
3. **Add logging:** Log `orderedImages` array in API to verify correct public_ids received

**Frontend check (`src/app/admin/gallery/components/GalleryGrid.tsx`):**
```typescript
// Verify onDragEnd handler sends image.src (Cloudinary public_id)
const handleDragEnd = (result) => {
  // ... drag logic
  const orderedImages = reorderedItems.map(item => item.src);  // Must be Cloudinary public_ids

  fetch(`/api/gallery?action=updateOrder`, {
    method: 'PATCH',
    body: JSON.stringify({ section: activeTab, orderedImages }),
  });
};
```

**Warning signs:**
- Drag-and-drop UI works (images move visually)
- Order resets on page reload
- API returns "Some images in orderedImages do not exist in this section" error

## Migration Checklist

### Pre-Migration (Before Touching Code)

- [ ] Phase 1 complete: Cloudinary account configured, environment variables set
- [ ] Phase 1 complete: Vercel KV addon added to Vercel project
- [ ] Phase 1 complete: `lib/cloudinary.ts` exists with SDK initialization
- [ ] Phase 1 complete: `lib/kv.ts` exists with `getGalleryData()` and `saveGalleryData()`
- [ ] Backup existing `db.json` file (copy to `.planning/backups/`)
- [ ] Backup existing images in `public/assets/gallery/` (tar archive or copy to separate folder)
- [ ] Document current image count and sections (Facility: X images, Quilting: Y images)

### Migration Execution

- [ ] Run migration script to upload existing images to Cloudinary
- [ ] Verify all images uploaded successfully (check Cloudinary Media Library)
- [ ] Update `db.json` with new Cloudinary public_ids (migration script output)
- [ ] Copy migrated data to Vercel KV (run init script or manual API call)
- [ ] Update `next.config.js`: set `unoptimized: false`, add Cloudinary remotePattern
- [ ] Update Content Security Policy to allow Cloudinary domain

### Code Updates

- [ ] Update `src/components/Gallery.tsx`: Replace `Image` with `CldImage`
- [ ] Update `src/components/Gallery.tsx`: Add lazy loading (first 6 eager, rest lazy)
- [ ] Update `src/app/api/gallery/route.ts`: Replace `getDB()`/`saveDB()` with KV functions
- [ ] Update `src/app/api/gallery/route.ts`: POST handler to upload to Cloudinary
- [ ] Update `src/app/api/gallery/route.ts`: DELETE handler to delete from Cloudinary
- [ ] Create `src/app/api/cloudinary-signature/route.ts` for signed uploads
- [ ] Update admin upload UI: Use CldUploadWidget or update manual upload to Cloudinary API
- [ ] Update `ImageAsset` type: Add `cloudinaryAssetId`, `format` to metadata

### Testing

- [ ] Test gallery display on homepage: All images load from Cloudinary
- [ ] Test lazy loading: First 6 images eager, rest lazy (check Network tab)
- [ ] Test admin upload: New image uploads to Cloudinary and appears in gallery
- [ ] Test admin reorder: Drag-and-drop updates order, persists after reload
- [ ] Test admin caption edit: Caption updates persist in Vercel KV
- [ ] Test admin soft-delete: Image moves to deleted tab, removed from homepage
- [ ] Test admin restore: Deleted image returns to active gallery
- [ ] Test admin permanent delete: Image removed from Cloudinary and Vercel KV
- [ ] Test in Vercel preview deployment: All operations work in production environment

### Post-Migration

- [ ] Monitor Cloudinary bandwidth usage (dashboard) for first week
- [ ] Set up Cloudinary usage alerts at 80% of free tier limits
- [ ] Archive old images in `public/assets/gallery/` (don't delete yet, keep as backup)
- [ ] Document new admin workflow for future reference
- [ ] Update `.env.example` with Cloudinary and Vercel KV variables

## Code Examples

### Example 1: Updated Gallery Component

```typescript
// src/components/Gallery.tsx
'use client';

import { useState, useEffect } from 'react';
import { CldImage } from 'next-cloudinary';  // CHANGED: Import CldImage
import { ImageAsset } from '@/app/api/gallery/types';
import LightboxGallery from './LightboxGallery';

export default function Gallery() {
  const [galleryImages, setGalleryImages] = useState<ImageAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGalleryData = async () => {
      const response = await fetch('/api/gallery');
      const data = await response.json();
      setGalleryImages(data.images.sort((a, b) => a.order - b.order));
      setIsLoading(false);
    };
    fetchGalleryData();
  }, []);

  const facilityImages = galleryImages.filter(img => img.section === 'Facility');
  const quiltingImages = galleryImages.filter(img => img.section === 'Quilting');

  return (
    <section id="gallery" className="py-24 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-serif text-stone-800 mb-8">Gallery</h2>

        {/* Facility Images */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold mb-6">Our Facility</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facilityImages.map((image, index) => (
              <div key={image.src} className="relative group cursor-pointer">
                <div className="aspect-video relative overflow-hidden rounded-lg">
                  {/* CHANGED: Use CldImage instead of Image */}
                  <CldImage
                    src={image.src}  // Cloudinary public_id
                    alt={image.alt}
                    width={800}  // CHANGED: Explicit dimensions (required)
                    height={450}
                    crop="fill"  // CHANGED: Smart cropping
                    gravity="auto"  // CHANGED: AI-based focus
                    loading={index < 6 ? 'eager' : 'lazy'}  // CHANGED: Lazy loading
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">{image.caption}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quilting Images (same pattern) */}
        {/* ... */}
      </div>
    </section>
  );
}
```

### Example 2: Updated API Route with Vercel KV

```typescript
// src/app/api/gallery/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { getGalleryData, saveGalleryData } from '@/lib/kv';  // CHANGED: Use KV
import { ImageAsset } from './types';

// REMOVED: getDB() and saveDB() functions - replaced by KV

export async function GET() {
  const data = await getGalleryData();  // CHANGED: From Vercel KV
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const section = formData.get('section') as ImageAsset['section'];

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // CHANGED: Upload to Cloudinary instead of local filesystem
  const uploadResult = await new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: `timber-threads/${section.toLowerCase()}`,
        transformation: [
          { width: 1920, height: 1080, crop: 'limit' },
          { quality: 'auto:good', fetch_format: 'auto' }
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(buffer);
  });

  // CHANGED: Save to Vercel KV instead of db.json
  const db = await getGalleryData();
  const maxOrder = db.images
    .filter(img => img.section === section)
    .reduce((max, img) => Math.max(max, img.order || 0), 0);

  const newImage: ImageAsset = {
    src: uploadResult.public_id,  // CHANGED: Cloudinary public_id
    alt: file.name.split('.')[0],
    caption: formData.get('caption') as string,
    section,
    order: maxOrder + 1,
    metadata: {
      uploadedAt: new Date().toISOString(),
      dimensions: { width: uploadResult.width, height: uploadResult.height },
      cloudinaryAssetId: uploadResult.asset_id,  // CHANGED: Add Cloudinary ID
      format: uploadResult.format,
    }
  };

  db.images.push(newImage);
  await saveGalleryData(db);  // CHANGED: Persist to Vercel KV

  return NextResponse.json({ message: 'Upload successful', image: newImage });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const src = searchParams.get('src');  // Cloudinary public_id

  const db = await getGalleryData();

  // CHANGED: Delete from Cloudinary
  try {
    await cloudinary.uploader.destroy(src);
  } catch (error) {
    console.error('Cloudinary deletion error:', error);
  }

  // CHANGED: Remove from Vercel KV
  db.deletedImages = db.deletedImages.filter(img => img.src !== src);
  await saveGalleryData(db);

  return NextResponse.json({ message: 'Deleted successfully' });
}

// PATCH handler remains mostly unchanged (uses getGalleryData/saveGalleryData)
export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const body = await request.json();

  const db = await getGalleryData();  // CHANGED: From Vercel KV

  // Existing action handlers (softDelete, restore, updateCaption, updateOrder)
  // ... no changes needed, data structure unchanged

  await saveGalleryData(db);  // CHANGED: Persist to Vercel KV
  return NextResponse.json({ message: 'Success', data: db });
}
```

### Example 3: Cloudinary Signature Endpoint

```typescript
// src/app/api/cloudinary-signature/route.ts (NEW FILE)
import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { paramsToSign } = body;

  // Validate required parameters
  if (!paramsToSign) {
    return NextResponse.json(
      { error: 'Missing paramsToSign' },
      { status: 400 }
    );
  }

  // Generate signature using API secret (never exposed to client)
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json({ signature });
}
```

## Open Questions

1. **Cloudinary folder structure**
   - What we know: Can organize with `folder` parameter (`timber-threads/facility`, `timber-threads/quilting`)
   - What's unclear: Should sections be separate folders, or use tags for organization?
   - Recommendation: Use folders for section separation (easier to browse in Media Library), add tags for additional metadata (e.g., `retreat-2024`, `interior`, `exterior`)

2. **Image migration downtime**
   - What we know: Migration requires uploading existing images to Cloudinary and updating metadata
   - What's unclear: Can migration happen without site downtime?
   - Recommendation: Run migration script during off-hours (late night). Site remains functional with old images during migration. Update Vercel KV atomically after all uploads complete. Zero downtime achievable.

3. **Handling upload failures**
   - What we know: Cloudinary upload can fail (network errors, quota exceeded, invalid file)
   - What's unclear: Should we retry failed uploads? How many times?
   - Recommendation: Implement exponential backoff retry (3 attempts). If all fail, show error to user and log to monitoring service. Don't create metadata entry if upload fails.

4. **Cloudinary transformation presets**
   - What we know: Can create named transformation presets in Cloudinary dashboard
   - What's unclear: Is it worth creating presets, or use inline transformations?
   - Recommendation: Use inline transformations initially (`q_auto`, `f_auto`, `crop="fill"`). Create named presets later if reusing complex transformations across multiple components.

## Sources

### Primary (HIGH confidence)
- [next-cloudinary Documentation](https://next.cloudinary.dev/) - Official next-cloudinary integration guide, component API reference
- [Cloudinary Node.js SDK Documentation](https://cloudinary.com/documentation/node_integration) - Official SDK reference for upload, admin API, transformations
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv) - Official Vercel KV setup, usage patterns, API reference
- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images) - Official Next.js image optimization guide, remotePatterns configuration
- Current codebase analysis: `src/components/Gallery.tsx`, `src/app/admin/gallery/page.tsx`, `src/app/api/gallery/route.ts` - Understanding existing implementation

### Secondary (MEDIUM confidence)
- [Cloudinary Next.js Integration Guide](https://cloudinary.com/guides/front-end-development/integrating-cloudinary-with-next-js) - Cloudinary's official Next.js integration patterns
- [next-cloudinary CldImage Examples](https://next.cloudinary.dev/cldimage/examples) - Real-world usage examples for CldImage component
- [Vercel KV with Next.js](https://vercel.com/docs/storage/vercel-kv/quickstart) - Quickstart guide for Next.js + Vercel KV integration

## Metadata

**Confidence breakdown:**
- Migration approach: HIGH - Cloudinary SDK and next-cloudinary are well-documented with official guides
- Data structure changes: HIGH - Verified against existing codebase, minimal breaking changes
- Admin UI updates: MEDIUM - CldUploadWidget requires testing to verify behavior matches current manual upload
- Pitfalls: HIGH - Based on official Vercel/Cloudinary documentation about common issues (bandwidth limits, remotePatterns, signed uploads)

**Research date:** 2026-02-14
**Valid until:** 2026-03-14 (30 days - Cloudinary API is stable, next-cloudinary updates are incremental)

---

*Phase 2 research complete. Ready for planning.*
