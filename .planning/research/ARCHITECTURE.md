# Architecture Research

**Domain:** Next.js 14 retreat center website with video + Cloudinary gallery
**Researched:** 2026-02-14
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   Frontend Layer (Client)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │
│  │  Hero    │  │  About   │  │  Gallery │  │  Other   │    │
│  │  (Video) │  │          │  │ (Cloudinary)│  │ Sections │    │
│  └────┬─────┘  └──────────┘  └────┬─────┘  └──────────┘    │
│       │                            │                         │
│       │ static files               │ API calls               │
│       ↓                            ↓                         │
├───────┴────────────────────────────┴─────────────────────────┤
│                   API Routes Layer                           │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐    │
│  │  /api/gallery                                       │    │
│  │    - GET (fetch images)                            │    │
│  │    - POST (upload to Cloudinary)                   │    │
│  │    - PATCH (update metadata)                       │    │
│  │    - DELETE (remove from Cloudinary)               │    │
│  └────────────────────┬────────────────────────────────┘    │
│                       │                                      │
│                       ↓                                      │
├───────────────────────┴──────────────────────────────────────┤
│                   Storage Layer                              │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Vercel Static│  │  Cloudinary  │  │  Vercel KV   │      │
│  │    Assets    │  │     CDN      │  │  (metadata)  │      │
│  │   (videos)   │  │   (images)   │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Hero Component** | Display hero section with background video | `<video>` tag with static MP4 from `/public/assets/videos/`, autoplay, loop, muted |
| **Gallery Component** | Display Cloudinary-hosted images in grid | `CldImage` from next-cloudinary with lazy loading, fetch from `/api/gallery` |
| **Video Section** | Dedicated promo video section | `<video>` tag with controls, preload="none", from `/public/assets/videos/` |
| **Admin Upload** | Upload interface for Cloudinary | `CldUploadWidget` with signed uploads, server-side signature endpoint |
| **API Gallery Route** | CRUD operations for gallery images | Next.js API route with Cloudinary SDK, Vercel KV for metadata |
| **Vercel KV Store** | Persistent metadata storage | Image order, captions, sections, timestamps |

## Recommended Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Main single-page layout
│   ├── layout.tsx                  # Root layout with metadata
│   ├── api/
│   │   ├── gallery/
│   │   │   ├── route.ts           # Gallery CRUD endpoints
│   │   │   └── types.ts           # Gallery TypeScript types
│   │   ├── cloudinary-signature/
│   │   │   └── route.ts           # Signed upload endpoint
│   │   └── contact/
│   │       └── route.ts           # Contact form endpoint
│   └── admin/
│       ├── page.tsx               # Admin authentication
│       ├── layout.tsx             # Admin layout
│       └── gallery/
│           ├── page.tsx           # Gallery management UI
│           └── components/        # Admin components
├── components/
│   ├── Hero.tsx                   # Hero with video background
│   ├── VideoSection.tsx           # NEW: Dedicated promo video
│   ├── Gallery.tsx                # Gallery display (Cloudinary)
│   ├── LightboxGallery.tsx        # Full-screen image viewer
│   └── [other sections]           # About, Contact, etc.
├── lib/
│   ├── cloudinary.ts              # NEW: Cloudinary config & helpers
│   └── kv.ts                      # NEW: Vercel KV client config
└── types/
    └── gallery.ts                 # Shared gallery types

public/
└── assets/
    └── videos/
        ├── hero-background.mp4    # NEW: Hero background video
        └── promo.mp4              # NEW: Main promotional video
```

### Structure Rationale

- **`/public/assets/videos/`**: Static video files served directly from Vercel's CDN. Videos under 50MB can be deployed with the app. Larger videos should use Vercel Blob Storage.
- **`/lib/cloudinary.ts`**: Centralized Cloudinary configuration with upload helpers, transformation presets, and SDK initialization.
- **`/lib/kv.ts`**: Vercel KV client for persistent metadata (replaces broken file-based JSON database).
- **API routes separation**: Gallery operations in `/api/gallery/`, upload signing in `/api/cloudinary-signature/` for security.
- **Admin components isolation**: Admin-specific UI in `/app/admin/gallery/components/` to keep clear separation from public components.

## Architectural Patterns

### Pattern 1: Self-Hosted Video Delivery

**What:** Serve video files directly from Vercel's static asset hosting using the HTML5 `<video>` element.

**When to use:** For videos under 50MB that don't require adaptive streaming or advanced player features.

**Trade-offs:**
- ✅ Simple, no external dependencies or API costs
- ✅ Fast delivery via Vercel's Edge Network
- ✅ Works perfectly for background videos and simple playback
- ❌ 50MB size limit per file (100MB total function deployment size)
- ❌ No adaptive bitrate streaming
- ❌ Browser must support the video codec

**Example:**
```typescript
// Hero.tsx - Background video
export default function Hero() {
  return (
    <section className="relative h-screen">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster="/assets/videos/hero-poster.jpg"
      >
        <source src="/assets/videos/hero-background.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      {/* Hero content overlay */}
    </section>
  );
}

// VideoSection.tsx - Dedicated promo video
export default function VideoSection() {
  return (
    <section id="video" className="py-24">
      <video
        controls
        preload="none"
        className="w-full max-w-4xl mx-auto"
        poster="/assets/videos/promo-poster.jpg"
      >
        <source src="/assets/videos/promo.mp4" type="video/mp4" />
      </video>
    </section>
  );
}
```

### Pattern 2: Cloudinary for Image Gallery

**What:** Use Cloudinary as a CDN and image optimization service with next-cloudinary for seamless integration.

**When to use:** For user-uploaded images that need optimization, transformations, and responsive delivery.

**Trade-offs:**
- ✅ Automatic image optimization (format, quality, sizing)
- ✅ Persistent cloud storage (eliminates Vercel read-only filesystem issue)
- ✅ Built-in transformations (crop, resize, effects)
- ✅ Free tier: 25GB storage, 25GB bandwidth/month
- ❌ External dependency (requires account and API keys)
- ❌ Vendor lock-in (migration requires moving all assets)
- ❌ Additional API calls (increases complexity)

**Example:**
```typescript
// lib/cloudinary.ts - Configuration
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (file: Buffer, options: any) => {
  return cloudinary.uploader.upload(file, {
    folder: 'timber-threads',
    transformation: [
      { width: 1920, height: 1080, crop: 'limit' },
      { quality: 'auto:good', fetch_format: 'auto' }
    ],
    ...options
  });
};

// Gallery.tsx - Display images
import { CldImage } from 'next-cloudinary';

export default function Gallery({ images }: { images: ImageAsset[] }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {images.map((image) => (
        <CldImage
          key={image.src}
          src={image.src} // Cloudinary public_id
          alt={image.alt}
          width={600}
          height={400}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          crop="fill"
          gravity="auto"
          loading="lazy"
        />
      ))}
    </div>
  );
}
```

### Pattern 3: Vercel KV for Metadata Storage

**What:** Use Vercel KV (Redis) to store gallery metadata instead of file-based JSON database.

**When to use:** When you need persistent storage for metadata in a serverless environment.

**Trade-offs:**
- ✅ Persistent across deployments (solves current production issue)
- ✅ Fast read/write operations
- ✅ Integrated with Vercel (simple setup)
- ✅ Free tier: 256MB storage, 100K reads, 20K writes per month
- ❌ Requires Vercel KV addon (additional service)
- ❌ Redis data structure (different from JSON)
- ❌ Migration effort from current db.json

**Example:**
```typescript
// lib/kv.ts - Vercel KV client
import { kv } from '@vercel/kv';

export interface GalleryMetadata {
  images: ImageAsset[];
  deletedImages: ImageAsset[];
}

export async function getGalleryData(): Promise<GalleryMetadata> {
  const data = await kv.get<GalleryMetadata>('gallery') || {
    images: [],
    deletedImages: []
  };
  return data;
}

export async function saveGalleryData(data: GalleryMetadata): Promise<void> {
  await kv.set('gallery', data);
}

// api/gallery/route.ts - Updated to use KV
import { getGalleryData, saveGalleryData } from '@/lib/kv';

export async function GET() {
  const data = await getGalleryData();
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;

  // Upload to Cloudinary
  const uploadResult = await uploadImage(file);

  // Update metadata in KV
  const data = await getGalleryData();
  data.images.push({
    src: uploadResult.public_id,
    alt: file.name,
    caption: formData.get('caption') as string,
    section: formData.get('section') as 'Facility' | 'Quilting',
    order: data.images.length + 1,
    metadata: {
      uploadedAt: new Date().toISOString(),
      dimensions: {
        width: uploadResult.width,
        height: uploadResult.height
      }
    }
  });
  await saveGalleryData(data);

  return NextResponse.json({ success: true });
}
```

### Pattern 4: Signed Uploads for Security

**What:** Generate server-side signatures for Cloudinary uploads to prevent unauthorized access.

**When to use:** Always, for admin uploads. Prevents API key exposure and unauthorized uploads.

**Trade-offs:**
- ✅ Secure (API secret never exposed to client)
- ✅ Control over upload parameters (folder, transformations)
- ✅ Prevents abuse of upload quota
- ❌ Requires additional API endpoint
- ❌ Slightly more complex than unsigned uploads

**Example:**
```typescript
// app/api/cloudinary-signature/route.ts
import { v2 as cloudinary } from 'cloudinary';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { paramsToSign } = body;

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    process.env.CLOUDINARY_API_SECRET!
  );

  return NextResponse.json({ signature });
}

// Admin upload component
import { CldUploadWidget } from 'next-cloudinary';

export default function AdminUpload() {
  return (
    <CldUploadWidget
      uploadPreset="timber-threads-signed"
      signatureEndpoint="/api/cloudinary-signature"
      onSuccess={(result) => {
        console.log('Upload successful:', result.info);
        // Update gallery metadata
      }}
    >
      {({ open }) => (
        <button onClick={() => open()}>Upload Image</button>
      )}
    </CldUploadWidget>
  );
}
```

### Pattern 5: Progressive Enhancement for Performance

**What:** Implement lazy loading, skeleton states, and optimized delivery for images and videos.

**When to use:** Always, especially for content-heavy single-page applications.

**Trade-offs:**
- ✅ Faster initial page load
- ✅ Better Core Web Vitals (LCP, CLS, FID)
- ✅ Reduced bandwidth usage
- ❌ More complex loading states
- ❌ Requires careful UX design for placeholders

**Example:**
```typescript
// Gallery.tsx - Lazy loading with Intersection Observer
'use client';

import { CldImage } from 'next-cloudinary';
import { useEffect, useState } from 'react';

export default function Gallery() {
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/gallery')
      .then(res => res.json())
      .then(data => {
        setImages(data.images);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <GallerySkeleton />;
  }

  return (
    <section id="gallery">
      {images.map((image, index) => (
        <CldImage
          key={image.src}
          src={image.src}
          alt={image.alt}
          width={600}
          height={400}
          loading={index < 6 ? 'eager' : 'lazy'} // First 6 eager, rest lazy
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ))}
    </section>
  );
}

// VideoSection.tsx - Deferred loading
export default function VideoSection() {
  return (
    <video
      controls
      preload="none" // Only load when user initiates playback
      poster="/assets/videos/promo-poster.jpg" // Show poster until play
    >
      <source src="/assets/videos/promo.mp4" type="video/mp4" />
    </video>
  );
}
```

## Data Flow

### Request Flow

```
User visits page
    ↓
1. Server renders page shell (static HTML)
    ↓
2. Client hydrates React components
    ↓
3. Gallery component fetches metadata
    ↓
GET /api/gallery → Vercel KV → Returns { images: [], deletedImages: [] }
    ↓
4. CldImage components fetch images from Cloudinary CDN
    ↓
Images delivered via Cloudinary's global CDN (optimized format/size)
    ↓
5. Video elements load from Vercel static assets
    ↓
Videos served from Vercel Edge Network (closest region)
```

### Upload Flow (Admin)

```
Admin selects image in CldUploadWidget
    ↓
1. Widget requests upload signature
    ↓
POST /api/cloudinary-signature → Generate signature with API secret
    ↓
2. Widget uploads directly to Cloudinary (client-side)
    ↓
Cloudinary processes upload (optimization, transformations)
    ↓
3. Widget onSuccess callback fires with upload result
    ↓
4. Admin component calls API to save metadata
    ↓
PATCH /api/gallery → Vercel KV → Update metadata with new image
    ↓
5. Gallery component refetches data
    ↓
New image appears in gallery
```

### State Management

```
Gallery State (Client)
    ↓ (useState)
[images, setImages] ←→ useEffect → fetch('/api/gallery')
    ↓
API Route (Server)
    ↓
Vercel KV (Persistent Storage)
    ↓
{ images: ImageAsset[], deletedImages: ImageAsset[] }
```

### Key Data Flows

1. **Image Display Flow:** Client → API → Vercel KV → Returns metadata → Client fetches images from Cloudinary CDN
2. **Image Upload Flow:** Admin → CldUploadWidget → Cloudinary (direct upload) → API → Vercel KV (save metadata)
3. **Video Playback Flow:** Client → Static file from `/public/assets/videos/` → Vercel Edge Network → Browser
4. **Admin Actions Flow:** Admin UI → API (PATCH/DELETE) → Vercel KV + Cloudinary API → Updated state

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **0-10k visitors/month** | Current architecture is perfect. Vercel free tier (100GB bandwidth), Cloudinary free tier (25GB bandwidth), Vercel KV free tier. |
| **10k-100k visitors/month** | Consider Vercel Pro ($20/mo for 1TB bandwidth). Monitor Cloudinary bandwidth usage. Add Cloudinary responsive images to optimize delivery. |
| **100k+ visitors/month** | Move to Vercel Pro/Enterprise. Consider Cloudinary Advanced plan or migrate videos to specialized video CDN (Mux, Vimeo). Implement aggressive caching strategies. |

### Scaling Priorities

1. **First bottleneck:** Cloudinary bandwidth (25GB free tier). **Fix:** Optimize image sizes, implement blur placeholders, use responsive images correctly.
2. **Second bottleneck:** Vercel bandwidth (100GB free tier). **Fix:** Enable CDN caching headers, consider Vercel Pro tier.
3. **Third bottleneck:** Vercel KV read operations (100K free tier). **Fix:** Implement client-side caching with revalidation, reduce unnecessary API calls.

## Anti-Patterns

### Anti-Pattern 1: Storing Images in Vercel File System

**What people do:** Save uploaded images to `/public/assets/` directory via API routes in production.

**Why it's wrong:** Vercel's serverless functions have a read-only file system. Files written during runtime are lost between invocations. This is exactly what's happening in the current implementation (db.json broken in production).

**Do this instead:** Use Cloudinary for image storage (persistent CDN) and Vercel KV for metadata storage. Separate storage concerns from compute.

### Anti-Pattern 2: Large Video Files in Deployment

**What people do:** Include 100MB+ video files in `/public/` directory, exceeding deployment size limits.

**Why it's wrong:** Vercel has a 100MB total deployment size limit. Large videos cause deployment failures and slow build times.

**Do this instead:**
- Keep videos under 50MB (compress with HandBrake or similar)
- Use Vercel Blob Storage for videos >50MB
- For high-quality videos, use Mux or Cloudinary video hosting

### Anti-Pattern 3: Unsigned Cloudinary Uploads

**What people do:** Use unsigned upload presets with API keys exposed in client-side code.

**Why it's wrong:** Anyone can find the API key and upload unlimited content, draining your quota and potentially hosting malicious content.

**Do this instead:** Always use signed uploads with a server-side signature endpoint (`/api/cloudinary-signature`). Never expose your API secret to the client.

### Anti-Pattern 4: Loading All Images Eagerly

**What people do:** Set `loading="eager"` on all images or omit the `loading` prop, causing the browser to download all images immediately.

**Why it's wrong:** Delays First Contentful Paint (FCP) and Largest Contentful Paint (LCP), hurts Core Web Vitals, wastes bandwidth for images below the fold.

**Do this instead:**
- Use `loading="lazy"` for images below the fold
- Use `loading="eager"` only for above-the-fold images (first 3-6 images)
- Implement priority loading with Next.js Image `priority` prop for hero images

### Anti-Pattern 5: Using File-Based Database in Serverless

**What people do:** Read/write to JSON files for database operations in Vercel API routes.

**Why it's wrong:** Vercel serverless functions are stateless and read-only. File writes don't persist between invocations. This causes data loss in production.

**Do this instead:** Use Vercel KV (Redis), Vercel Postgres, or any external database service for persistent storage.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| **Cloudinary** | SDK via API routes + next-cloudinary components | Requires account, API keys in env vars. Use signed uploads for security. Free tier: 25GB storage, 25GB/month bandwidth. |
| **Vercel KV** | `@vercel/kv` SDK in API routes | Requires Vercel KV addon (free tier available). Replaces file-based db.json. |
| **Vercel Edge Network** | Automatic for static assets in `/public/` | No configuration needed. Serves videos and images from nearest edge location. |
| **Next.js Image Optimization** | Disabled (`unoptimized: true` in config) | Re-enable after Cloudinary migration to optimize Cloudinary images. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| **Client ↔ API Routes** | Fetch API with JSON | All gallery operations (GET, POST, PATCH, DELETE) via `/api/gallery` |
| **API Routes ↔ Cloudinary** | Cloudinary Node SDK | Server-side only, never expose API secret to client |
| **API Routes ↔ Vercel KV** | `@vercel/kv` SDK | Replace all file-based database operations |
| **Client ↔ Cloudinary CDN** | Direct image requests via CldImage | Optimized URLs generated by next-cloudinary, served via Cloudinary's CDN |
| **Client ↔ Vercel Static Assets** | Direct requests to `/assets/videos/` | No API needed, served from Edge Network |

## Build Order and Dependencies

### Phase 1: Foundation (No dependencies)
1. **Add Vercel KV integration** - Set up Vercel KV, migrate data from db.json
2. **Create Cloudinary config** - Set up account, add environment variables, create `lib/cloudinary.ts`

### Phase 2: Cloudinary Migration (Depends on Phase 1)
3. **Update API routes** - Replace file operations with Vercel KV, add Cloudinary upload logic
4. **Create signature endpoint** - `/api/cloudinary-signature` for signed uploads
5. **Update admin upload UI** - Replace current upload with CldUploadWidget
6. **Migrate existing images** - Upload current `/public/assets/gallery/` images to Cloudinary

### Phase 3: Gallery Display (Depends on Phase 2)
7. **Update Gallery component** - Replace Next.js Image with CldImage
8. **Update admin gallery UI** - Point to Cloudinary URLs instead of local paths
9. **Test metadata operations** - Verify caption updates, soft delete, restore all work with Cloudinary

### Phase 4: Video Integration (Independent from Phases 1-3)
10. **Add video files** - Place optimized videos in `/public/assets/videos/`
11. **Update Hero component** - Add background video with fallback poster image
12. **Create VideoSection component** - Add dedicated promo video section

### Phase 5: Performance Optimization (Depends on Phases 2-4)
13. **Implement lazy loading** - Update loading strategies for images and videos
14. **Add blur placeholders** - Generate and use blur placeholders for images
15. **Optimize video delivery** - Add poster images, proper preload attributes
16. **Enable Next.js image optimization** - Update `next.config.js` to re-enable optimization for Cloudinary

### Dependency Graph
```
Phase 1 (Foundation)
    ↓
Phase 2 (Cloudinary) ←┐
    ↓                  │
Phase 3 (Gallery)      │ (Independent)
                       │
Phase 4 (Video) ───────┘
    ↓
Phase 5 (Performance - requires all above)
```

### Critical Path
**Phase 1 → Phase 2 → Phase 3** is the critical path. Phase 4 (Video) can be developed in parallel.

### Build Order Rationale
1. **Foundation first** because file-based database is broken in production (critical bug)
2. **Cloudinary config** before migration because all subsequent work depends on it
3. **API routes before UI** because components need working endpoints to test against
4. **Migration before display updates** because we need images in Cloudinary before we can display them
5. **Video integration independent** because it uses completely separate architecture (static files)
6. **Performance optimization last** because it requires all components to be in place

## Environment Configuration

### Required Environment Variables

```bash
# Cloudinary (Required for Phase 2+)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloud-name"
NEXT_PUBLIC_CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"  # Server-side only, never expose

# Vercel KV (Required for Phase 1+)
# Auto-configured when Vercel KV is added to project
KV_URL="redis://..."
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
KV_REST_API_READ_ONLY_TOKEN="..."

# Email (Existing)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
RECIPIENT_EMAIL="recipient-email@example.com"
```

### Vercel Configuration

```javascript
// next.config.js updates
module.exports = {
  images: {
    unoptimized: false, // Re-enable after Cloudinary migration
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Add Cloudinary domain
      },
    ],
  },
  // ... existing config
};
```

## Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **LCP (Largest Contentful Paint)** | <2.5s | Hero image optimization, lazy loading, CDN delivery |
| **FID (First Input Delay)** | <100ms | Client-side rendering optimization, minimal JS in initial bundle |
| **CLS (Cumulative Layout Shift)** | <0.1 | Reserve space for images with width/height, skeleton loaders |
| **Time to Interactive** | <3.5s | Code splitting, defer non-critical JS, optimize image delivery |
| **Total Page Weight** | <2MB initial | Lazy load images, defer videos, optimize Cloudinary transformations |
| **Video Load Time** | <1s (poster) | Use poster images, preload="none" for videos, compress videos |

## Sources

- [Next.js Video Guide](https://nextjs.org/docs/app/guides/videos) - Official Next.js documentation for video integration
- [Best Practices for Hosting Videos on Vercel](https://vercel.com/guides/best-practices-for-hosting-videos-on-vercel-nextjs-mp4-gif) - Vercel's official video hosting guide
- [Vercel Serverless Functions Limits](https://vercel.com/docs/functions/limitations) - Understanding Vercel's file system and size limitations
- [Next Cloudinary Documentation](https://next.cloudinary.dev/) - Official next-cloudinary integration guide
- [Integrating Cloudinary with Next.js](https://cloudinary.com/guides/front-end-development/integrating-cloudinary-with-next-js) - Cloudinary's official Next.js guide
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv) - Vercel KV setup and usage
- [Next.js Image Optimization](https://nextjs.org/docs/app/getting-started/images) - Next.js image performance best practices

---
*Architecture research for: Timber & Threads Retreat Center website video + Cloudinary integration*
*Researched: 2026-02-14*
