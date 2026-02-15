# Phase 1: Infrastructure - Research

**Researched:** 2026-02-14
**Domain:** Cloud infrastructure migration (Cloudinary + Redis/KV for persistent storage)
**Confidence:** HIGH

## Summary

Phase 1 addresses the critical production bug where gallery data persistence fails due to Vercel's read-only filesystem. The current implementation uses local file-based storage (`src/app/api/gallery/db.json`) which works in development but loses all data on Vercel deployments. This phase establishes cloud infrastructure by migrating to Cloudinary for image storage and a Redis-compatible database for metadata persistence.

The technical challenge is replacing two broken storage layers: file-based JSON database and local filesystem image storage. Both fail in Vercel's serverless environment. The solution pairs Cloudinary (image CDN + storage) with Upstash Redis (metadata persistence) to create a production-ready architecture. This migration also enables Next.js Image optimization, which is currently disabled (`images.unoptimized: true`).

**Primary recommendation:** Use Cloudinary for images with signed uploads, and Upstash Redis via Vercel Marketplace for metadata. This combination provides free tier hosting for low-traffic sites, automatic environment variable injection, and proven Next.js integration patterns.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **next-cloudinary** | 6.16.0+ (installed) | Unified image/video optimization library | Community-maintained with 380+ code snippets in Context7. Provides CldImage and CldUploadWidget components with automatic format optimization, signed uploads, and transformation API. Already in package.json. |
| **cloudinary** | 2.5.1+ (installed) | Cloud-based media hosting SDK | Already in package.json but commented out in code. Required for server-side operations (upload signature generation, admin API). Free tier: 25GB storage + 25GB bandwidth/month. |
| **@upstash/redis** | Latest | Serverless Redis client | Vercel Marketplace recommended provider. Replaces deprecated Vercel KV. Free tier: 500K commands/month, 250MB storage, 200GB bandwidth/month. REST API compatible with Edge Runtime. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **sharp** | 0.33.5 (installed) | Production image optimization | Already installed. Keep for local image processing before Cloudinary upload (resizing user uploads client-side). Required by Next.js Image component for optimal performance. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| **Upstash Redis** | Neon Postgres | Postgres requires schema migrations and is overkill for simple key-value metadata. Redis is faster for read-heavy gallery operations. |
| **Upstash Redis** | MongoDB Atlas | NoSQL flexibility not needed. Redis is simpler and faster for flat metadata structure. MongoDB adds deployment complexity. |
| **Cloudinary** | Vercel Blob | Vercel Blob lacks image transformations, format optimization, and responsive sizing. Would require manual Sharp processing. Cloudinary free tier more generous (25GB vs paid-only for Blob). |

**Installation:**
```bash
# Cloudinary packages already installed
# npm install cloudinary@^2.5.1 next-cloudinary@^6.16.0

# Add Upstash Redis (via Vercel Marketplace integration or manual)
npm install @upstash/redis
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── lib/
│   ├── cloudinary.ts          # NEW: Cloudinary config & helpers
│   └── redis.ts                # NEW: Upstash Redis client
├── app/api/
│   ├── cloudinary-signature/
│   │   └── route.ts           # NEW: Signed upload endpoint
│   └── gallery/
│       ├── route.ts           # MODIFY: Replace fs operations with Redis + Cloudinary
│       └── types.ts           # KEEP: Existing types
```

### Pattern 1: Upstash Redis for Metadata Persistence

**What:** Use Upstash Redis as persistent key-value store for gallery metadata, replacing file-based db.json.

**When to use:** Always, for any metadata that must persist across deployments in serverless environments.

**Example:**
```typescript
// lib/redis.ts - Configuration
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export interface GalleryMetadata {
  images: ImageAsset[];
  deletedImages: ImageAsset[];
}

export async function getGalleryData(): Promise<GalleryMetadata> {
  const data = await redis.get<GalleryMetadata>('gallery');
  return data || { images: [], deletedImages: [] };
}

export async function saveGalleryData(data: GalleryMetadata): Promise<void> {
  await redis.set('gallery', data);
}

// app/api/gallery/route.ts - Updated GET handler
import { getGalleryData } from '@/lib/redis';

export async function GET() {
  try {
    const data = await getGalleryData();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get gallery data' },
      { status: 500 }
    );
  }
}
```

**Why this pattern:**
- Upstash Redis uses HTTP REST API, compatible with Vercel Edge Runtime (no TCP connections)
- Data persists across all deployments and regions
- Simple key-value operations match current db.json structure
- Free tier sufficient for low-traffic retreat center (500K commands/month)

### Pattern 2: Cloudinary Signed Uploads for Security

**What:** Generate server-side signatures for Cloudinary uploads to prevent unauthorized access and quota theft.

**When to use:** Always, for admin-initiated uploads. Never expose CLOUDINARY_API_SECRET to client.

**Example:**
```typescript
// app/api/cloudinary-signature/route.ts
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: Request) {
  const body = await request.json();
  const { paramsToSign } = body;

  // Server-side signature generation using API secret
  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return Response.json({ signature });
}

// Admin upload component (client-side)
import { CldUploadWidget } from 'next-cloudinary';

<CldUploadWidget
  signatureEndpoint="/api/cloudinary-signature"
  uploadPreset="timber-threads-gallery"
  onSuccess={(result) => {
    // Update metadata in Redis via /api/gallery
    console.log('Upload successful:', result.info);
  }}
>
  {({ open }) => (
    <button onClick={() => open()}>Upload Image</button>
  )}
</CldUploadWidget>
```

**Security considerations:**
- API secret never exposed to client (no NEXT_PUBLIC_ prefix)
- Signature endpoint should add rate limiting (future enhancement)
- Upload preset can restrict file types and transformations server-side

### Pattern 3: Migrating from File-Based to Cloud Storage

**What:** Replace all file system operations (fs/promises) with cloud storage operations.

**Migration checklist:**
1. Remove all `readFile`, `writeFile`, `mkdir` imports from gallery route
2. Replace `getDB()` function with `getGalleryData()` from Redis client
3. Replace `saveDB()` function with `saveGalleryData()` from Redis client
4. Update POST handler to upload to Cloudinary instead of local filesystem
5. Remove local file path generation (`/assets/gallery/filename`)
6. Use Cloudinary public_id as image `src` value
7. Update DELETE handler to call Cloudinary API for permanent deletion

**Example migration (POST handler):**
```typescript
// OLD: Local filesystem upload
const publicPath = `/assets/gallery/${filename}`;
const publicDir = path.join(process.cwd(), 'public', 'assets', 'gallery');
await mkdir(publicDir, { recursive: true });
await fsWriteFile(path.join(publicDir, filename), optimizedImageBuffer);

// NEW: Cloudinary upload
import { v2 as cloudinary } from 'cloudinary';

const uploadResult = await cloudinary.uploader.upload(
  `data:image/webp;base64,${buffer.toString('base64')}`,
  {
    folder: 'timber-threads/gallery',
    public_id: `${Date.now()}-${file.name.split('.')[0]}`,
    transformation: [
      { width: 1920, height: 1080, crop: 'limit' },
      { quality: 'auto:good', fetch_format: 'auto' }
    ]
  }
);

const newImage: ImageAsset = {
  src: uploadResult.public_id, // Cloudinary public_id, not file path
  // ... rest of metadata
};
```

### Pattern 4: Next.js Image Optimization with Cloudinary

**What:** Enable Next.js Image component optimization and configure remotePatterns for Cloudinary CDN.

**Configuration changes:**
```javascript
// next.config.js - BEFORE
module.exports = {
  images: {
    unoptimized: true, // ❌ REMOVE THIS LINE
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // ❌ TOO PERMISSIVE
      },
    ],
  },
};

// next.config.js - AFTER
module.exports = {
  images: {
    // unoptimized: true, // REMOVED
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // ✅ SPECIFIC TO CLOUDINARY
        pathname: `/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/**`,
      },
    ],
  },
  // Add Cloudinary domains to CSP
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; img-src 'self' https://res.cloudinary.com data:; media-src 'self' https://res.cloudinary.com; ..."
          }
        ]
      }
    ];
  }
};
```

**Component usage:**
```typescript
// Use CldImage from next-cloudinary for automatic optimization
import { CldImage } from 'next-cloudinary';

<CldImage
  src={image.src} // Cloudinary public_id
  alt={image.alt}
  width={600}
  height={400}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  crop="fill"
  gravity="auto"
  loading="lazy"
/>
```

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| **Image transformations** | Custom Sharp pipelines for responsive images, format conversion, quality optimization | Cloudinary transformations API | Cloudinary handles 20+ formats, automatic quality detection, responsive breakpoints, face detection cropping. Building this manually requires 1000+ lines of code and CDN infrastructure. |
| **Signed upload security** | Custom HMAC signature generation and validation | Cloudinary SDK `api_sign_request()` | Cloudinary's signature scheme includes timestamp validation, parameter normalization, and protection against replay attacks. Custom implementations miss edge cases. |
| **Redis connection pooling** | Custom Redis client with connection management | @upstash/redis REST client | Upstash uses HTTP REST, no TCP connections needed. Works in Edge Runtime. Custom clients fail in serverless environments. |
| **Image CDN delivery** | Custom CDN setup with cache invalidation | Cloudinary CDN | Cloudinary has 300+ global edge locations, automatic cache purging, and WebP/AVIF serving. DIY CDN requires significant DevOps investment. |

**Key insight:** Cloud storage providers solve serverless environment constraints (read-only filesystem, ephemeral compute) that cannot be worked around with local code. The "free tier" approach is more cost-effective than building custom infrastructure for low-traffic sites.

## Common Pitfalls

### Pitfall 1: Exposing API Secrets to Client

**What goes wrong:** Developer adds `NEXT_PUBLIC_` prefix to `CLOUDINARY_API_SECRET` to "fix" environment variable not found errors in client components. Secret is exposed in browser bundle, allowing anyone to upload unlimited content to Cloudinary account.

**Why it happens:** Next.js only exposes env vars with `NEXT_PUBLIC_` prefix to client. Developers see "undefined" errors and add prefix without understanding security implications.

**How to avoid:**
- NEVER use `NEXT_PUBLIC_` for API secrets
- Keep signature generation in server-side API routes
- Use `CldUploadWidget` with `signatureEndpoint` prop pointing to server route
- Test that `process.env.CLOUDINARY_API_SECRET` is undefined in client components

**Warning signs:**
- Build warnings about public env vars containing "SECRET" or "KEY"
- Cloudinary usage spikes from unknown IPs
- Search "NEXT_PUBLIC_CLOUDINARY_API_SECRET" in codebase returns results

### Pitfall 2: Upstash Redis URL vs Token Confusion

**What goes wrong:** Using `UPSTASH_REDIS_REST_URL` in place of `UPSTASH_REDIS_REST_TOKEN` or vice versa. Redis client fails with cryptic authentication errors.

**Why it happens:** Upstash requires BOTH URL and TOKEN for REST API authentication. Vercel Marketplace integration creates both env vars, but names are similar and easy to swap.

**How to avoid:**
- Verify both env vars are set: `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- Use Vercel Marketplace integration (auto-injects correct values)
- Test Redis connection in development with `redis.ping()` before deployment
- Check Vercel dashboard Environment Variables tab for correct values

**Warning signs:**
- Error: "Authentication failed" from Upstash
- Error: "Invalid URL" when URL and token are swapped
- Redis commands work in development but fail in production

### Pitfall 3: Cloudinary Free Tier Bandwidth Exhaustion

**What goes wrong:** Gallery with 50+ full-resolution images (2-5MB each) exhausts 25GB monthly bandwidth within days. Cloudinary starts returning 429 errors, gallery breaks in production.

**Why it happens:** Developers upload original high-res images without optimization. Each page load fetches full-resolution images. No responsive sizing or format optimization.

**How to avoid:**
- Always use Cloudinary transformations: `{ quality: 'auto:good', fetch_format: 'auto' }`
- Implement responsive images with `sizes` attribute on CldImage
- Set max dimensions in upload transformation: `{ width: 1920, height: 1080, crop: 'limit' }`
- Monitor Cloudinary usage dashboard weekly during first month
- Use blur placeholders to reduce bandwidth for below-fold images

**Warning signs:**
- Cloudinary dashboard shows >80% bandwidth usage mid-month
- Gallery images take >2 seconds to load
- 429 errors in browser network tab from res.cloudinary.com

### Pitfall 4: next.config.js remotePatterns Lockout

**What goes wrong:** After migrating to Cloudinary, developer updates `remotePatterns` to only allow `res.cloudinary.com`. Forgets that homepage also loads Google Maps embed and Facebook social images. Those images break with 400 errors.

**Why it happens:** Changing from wildcard `hostname: '**'` to specific Cloudinary hostname blocks other external images that site depends on.

**How to avoid:**
- Audit all external image sources BEFORE changing remotePatterns
- Search codebase for `<img src="https://` and `<Image src="https://` to find external URLs
- Add ALL external domains to remotePatterns array, not just Cloudinary
- Test all pages after configuration change in Vercel preview deployment

**Warning signs:**
- Google Maps not loading on Contact section
- Facebook social share images return 400
- External avatars or logos broken

**Example fix:**
```javascript
remotePatterns: [
  {
    protocol: 'https',
    hostname: 'res.cloudinary.com', // Gallery images
  },
  {
    protocol: 'https',
    hostname: 'www.google.com', // Google Maps
  },
  {
    protocol: 'https',
    hostname: '*.facebook.com', // Facebook embeds
  },
  {
    protocol: 'https',
    hostname: '*.fbsbx.com', // Facebook CDN
  },
],
```

### Pitfall 5: Migration Path Data Loss

**What goes wrong:** Developer deploys Cloudinary migration without backing up existing `db.json` file. Old gallery metadata (captions, order, sections) is lost. Must manually re-enter all metadata.

**Why it happens:** Confidence that new system will work perfectly. No rollback plan. Data only exists in production environment.

**How to avoid:**
- Backup `db.json` before starting migration: `cp src/app/api/gallery/db.json db-backup-$(date +%F).json`
- Export production gallery data via API endpoint before deployment
- Create migration script that preserves all metadata fields
- Test migration on Vercel preview deployment before merging to main
- Keep file-based storage code temporarily for rollback capability

**Warning signs:**
- No backup file in git history
- Migration script doesn't map all ImageAsset fields
- Production deployment is first test of migration

**Migration script template:**
```typescript
// scripts/migrate-to-redis.ts
import { readFileSync } from 'fs';
import { redis } from '../src/lib/redis';

async function migrate() {
  // Read existing db.json
  const oldData = JSON.parse(readFileSync('src/app/api/gallery/db.json', 'utf-8'));

  // Verify all fields present
  console.log('Migrating images:', oldData.images.length);
  console.log('Migrating deleted:', oldData.deletedImages.length);

  // Save to Redis
  await redis.set('gallery', oldData);

  // Verify migration
  const newData = await redis.get('gallery');
  console.log('Verification - images:', newData.images.length);
  console.log('Verification - deleted:', newData.deletedImages.length);
}

migrate();
```

## Code Examples

Verified patterns from official sources:

### Cloudinary Configuration (Server-Side)

```typescript
// lib/cloudinary.ts
// Source: https://next.cloudinary.dev/clduploadwidget/signed-uploads
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET, // NEVER expose to client
});

export { cloudinary };
```

### Upstash Redis Client Setup

```typescript
// lib/redis.ts
// Source: https://upstash.com/docs/redis/howto/vercelintegration
import { Redis } from '@upstash/redis';

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Type-safe gallery operations
export interface GalleryMetadata {
  images: ImageAsset[];
  deletedImages: ImageAsset[];
}

export async function getGalleryData(): Promise<GalleryMetadata> {
  const data = await redis.get<GalleryMetadata>('gallery');
  return data || { images: [], deletedImages: [] };
}

export async function saveGalleryData(data: GalleryMetadata): Promise<void> {
  await redis.set('gallery', data);
}
```

### Gallery Upload with Cloudinary

```typescript
// app/api/gallery/route.ts - POST handler update
// Source: https://cloudinary.com/blog/cloudinary-image-uploads-using-nextjs-app-router
import { cloudinary } from '@/lib/cloudinary';
import { getGalleryData, saveGalleryData } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const caption = formData.get('caption') as string;
    const section = formData.get('section') as ImageAsset['section'];

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Convert file to base64 for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary with transformations
    const uploadResult = await cloudinary.uploader.upload(base64Image, {
      folder: 'timber-threads/gallery',
      public_id: `${Date.now()}-${file.name.split('.')[0].toLowerCase().replace(/\s+/g, '-')}`,
      transformation: [
        { width: 1920, height: 1080, crop: 'limit' },
        { quality: 'auto:good', fetch_format: 'auto' }
      ],
      tags: [section.toLowerCase(), 'gallery']
    });

    // Update metadata in Redis
    const db = await getGalleryData();

    const maxOrder = db.images
      .filter(img => img.section === section)
      .reduce((max, img) => Math.max(max, img.order || 0), 0);

    const newImage: ImageAsset = {
      src: uploadResult.public_id, // Cloudinary public_id
      alt: file.name.split('.')[0],
      caption,
      section,
      order: maxOrder + 1,
      metadata: {
        uploadedAt: new Date().toISOString(),
        dimensions: {
          width: uploadResult.width,
          height: uploadResult.height
        }
      }
    };

    db.images.push(newImage);
    await saveGalleryData(db);

    return NextResponse.json({
      message: 'File uploaded successfully',
      image: newImage
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: `Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| **Vercel KV** | **Upstash Redis via Marketplace** | Feb 2025 (sunset announced) | Vercel KV deprecated. Marketplace integrations (Upstash, Neon, etc.) are new standard. Upstash provides same Redis interface with better pricing (500K free commands vs 100K). |
| **images.domains** | **images.remotePatterns** | Next.js 14+ (2023) | Security improvement. Domains config deprecated. remotePatterns allows granular control (protocol, hostname, pathname, port). Current config uses old wildcard approach. |
| **Unsigned Cloudinary uploads** | **Signed uploads with server endpoint** | Always recommended | Security best practice. Prevents quota theft and unauthorized uploads. Requires API secret server-side, client uses signature endpoint. |

**Deprecated/outdated:**
- `images.domains` in next.config.js - Use `images.remotePatterns` instead
- `images.unoptimized: true` - Was workaround for Cloudinary setup, should be removed after migration
- Vercel KV (@vercel/kv package) - Sunset in 2025, migrate to Marketplace providers
- Local file storage in Vercel - Never worked in production, read-only filesystem

## Open Questions

1. **Cloudinary upload preset configuration**
   - What we know: Upload presets can restrict file types, transformations, and folder structure server-side
   - What's unclear: Whether to use signed preset (requires signature endpoint) or unsigned preset (easier but less secure)
   - Recommendation: Use signed uploads with preset for admin security. Create preset in Cloudinary dashboard with: allowed formats (jpg, png, webp), max file size (10MB), transformation chain (resize + quality), folder locked to 'timber-threads/gallery'

2. **Redis data migration timing**
   - What we know: Existing db.json has gallery metadata that must be preserved
   - What's unclear: Whether to migrate data before or after Cloudinary image upload migration
   - Recommendation: Migrate metadata to Redis FIRST, before touching image storage. This allows testing Redis operations independently. Then migrate images to Cloudinary and update image `src` paths in Redis.

3. **Environment variable setup order**
   - What we know: Need Cloudinary env vars (3) and Upstash env vars (2)
   - What's unclear: Whether Vercel Marketplace integration auto-creates all necessary env vars or if manual setup required
   - Recommendation: Use Vercel Marketplace integration for Upstash (auto-creates `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`). Manually add Cloudinary env vars in Vercel dashboard under Settings > Environment Variables.

## Sources

### Primary (HIGH confidence)
- [Vercel Storage overview](https://vercel.com/docs/storage) - Vercel KV sunset, Marketplace storage options
- [Next Cloudinary Signed Uploads](https://next.cloudinary.dev/clduploadwidget/signed-uploads) - Signature endpoint implementation
- [Upstash Redis Vercel Integration](https://upstash.com/docs/redis/howto/vercelintegration) - Setup guide and env var configuration
- [Upstash Pricing](https://upstash.com/pricing/redis) - Free tier details (500K commands, 250MB, 200GB bandwidth)
- [Next.js Image Component](https://nextjs.org/docs/app/api-reference/components/image) - remotePatterns configuration

### Secondary (MEDIUM confidence)
- [Cloudinary Server-Signed Uploads in Next.js](https://cloudinary.com/blog/guest_post/signed-uploads-in-cloudinary-with-next-js) - Security best practices
- [Cloudinary Signed URLs](https://cloudinary.com/blog/signed-urls-the-why-and-how) - Why signed uploads matter
- [Next.js 14: Migrate from images.domains to images.remotePatterns](https://www.w3tutorials.net/blog/the-images-domains-configuration-is-deprecated-please-use-images-remotepatterns-configuration-instead/) - Configuration migration guide
- [Cloudinary Image Uploads Using NextJS App Router](https://cloudinary.com/blog/cloudinary-image-uploads-using-nextjs-app-router) - App Router upload patterns

### Tertiary (LOW confidence - needs validation)
- None - All Phase 1 infrastructure is well-documented with official sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Vercel and Cloudinary documentation, existing package.json dependencies
- Architecture: HIGH - Proven patterns from Upstash and next-cloudinary official guides
- Pitfalls: MEDIUM - Based on common migration issues documented in community posts, needs validation with actual deployment

**Research date:** 2026-02-14
**Valid until:** 30 days (stable infrastructure, slow-moving APIs)

---

## Migration Checklist

Phase 1 implementation should follow this order to minimize risk:

### Step 1: Set Up Upstash Redis
- [ ] Add Upstash Redis integration via Vercel Marketplace
- [ ] Verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in Vercel dashboard
- [ ] Pull env vars locally: `vercel env pull .env.local`
- [ ] Create `src/lib/redis.ts` with client and helper functions
- [ ] Test connection with `redis.ping()` in development

### Step 2: Migrate Metadata to Redis
- [ ] Backup existing `src/app/api/gallery/db.json`
- [ ] Create migration script to copy db.json data to Redis
- [ ] Run migration script in development
- [ ] Update `getDB()` and `saveDB()` functions to use Redis instead of file operations
- [ ] Test all gallery operations (fetch, update caption, reorder, soft delete, restore)
- [ ] Deploy to Vercel preview environment and verify persistence across redeployments

### Step 3: Configure Cloudinary
- [ ] Verify Cloudinary account exists (credentials in package.json suggest it does)
- [ ] Add Cloudinary env vars to Vercel dashboard:
  - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET` (no NEXT_PUBLIC_ prefix!)
- [ ] Pull env vars locally: `vercel env pull .env.local`
- [ ] Create `src/lib/cloudinary.ts` with SDK configuration
- [ ] Create upload preset in Cloudinary dashboard (signed, folder: timber-threads/gallery)

### Step 4: Implement Signed Uploads
- [ ] Create `src/app/api/cloudinary-signature/route.ts`
- [ ] Uncomment Cloudinary imports in gallery route
- [ ] Update POST handler to upload to Cloudinary instead of local filesystem
- [ ] Remove all file system operations (fs/promises imports, mkdir, writeFile)
- [ ] Update admin upload UI to use `CldUploadWidget` with `signatureEndpoint`
- [ ] Test upload in development

### Step 5: Enable Next.js Image Optimization
- [ ] Update `next.config.js`:
  - Remove `images.unoptimized: true`
  - Update `remotePatterns` to allow `res.cloudinary.com`
  - Add Cloudinary to CSP headers
- [ ] Update Gallery component to use `CldImage` instead of Next.js Image
- [ ] Test image display in development
- [ ] Run Lighthouse audit to verify optimization working

### Step 6: Deploy and Verify
- [ ] Deploy to Vercel preview environment
- [ ] Test full upload workflow (upload → appears in gallery → persists after redeploy)
- [ ] Verify metadata operations work (reorder, caption edit, soft delete, restore)
- [ ] Monitor Cloudinary and Upstash dashboards for usage
- [ ] Merge to production

**Success criteria:** Admin can upload test image, it appears in gallery, metadata persists after Vercel redeploy, Next.js Image optimization enabled.
