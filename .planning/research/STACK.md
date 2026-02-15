# Stack Research

**Domain:** Self-hosted video + Cloudinary gallery integration for Next.js retreat center website
**Researched:** 2026-02-14
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Next.js** | 14.2.24 (current) → 15.1.11+ (upgrade path) | React framework with App Router | Already in use. App Router provides server components for bundle size reduction, automatic code-splitting, and Cache Components for static shell + dynamic updates. Next.js 14 is stable; v15 adds Cache Components feature for performance. |
| **next-cloudinary** | 6.17.5+ | Unified image/video optimization | Community-maintained library with 380 code snippets, Medium Source Reputation (79.6 benchmark). Provides `CldImage` and `CldVideoPlayer` components with automatic format optimization (WebP, AVIF), adaptive streaming (HLS/DASH), and transformation API. Drop-in replacement for `next/image` with Cloudinary transformations. |
| **Cloudinary** | 2.5.1+ (SDK) | Cloud-based media hosting & CDN | Already in dependencies but commented out. Free tier: 25 GB storage + 25 GB bandwidth. High Source Reputation, 80K+ code snippets. Handles gallery persistence (no local JSON needed), automatic format/quality optimization, responsive images via srcset, and video adaptive bitrate streaming. Cost-effective for budget projects vs self-hosting + CDN. |
| **sharp** | 0.33.5+ | Production image optimization | Already installed. **Strongly recommended** by Next.js for production. 20-60% faster than alternatives (Squoosh). Used by `next/image` for server-side optimization when available. Required for optimal Vercel deployments. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@next/bundle-analyzer** | Latest (matches Next.js major version) | Bundle size analysis and optimization | **Use during performance optimization phase**. Generates visual reports (client.html, edge.html, nodejs.html) to identify bloated dependencies. Works with both Webpack and Turbopack (experimental). Install as dev dependency. |
| **@vercel/blob** | 2.2.0+ | Alternative video storage (if not using Cloudinary) | **Only if budget requires self-hosting video**. Pricing: $0.023/GB-month storage + $0.05/GB transfer. Transparent pricing but lacks transformation features. Good for raw video storage, poor for optimization. |
| **react-intersection-observer** | 9.13.0+ | Advanced lazy loading control | **Optional** - only if default Next.js lazy loading insufficient. For custom animations/logging on scroll. Native lazy loading via `next/image` handles 95% of cases. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Lighthouse CI** | Performance monitoring in CI/CD | Add to GitHub Actions to prevent regressions. Track Core Web Vitals per route. Log-normal scoring: 96→100 requires same effort as 90→94. |
| **Vercel Analytics** | Real User Monitoring (RUM) | Free on Vercel. Tracks actual user Core Web Vitals vs synthetic Lighthouse scores. Critical for video-heavy sites. |
| **Cloudinary Media Library Widget** | Visual asset management | UI for non-technical users to upload/organize gallery images without code deploys. Solves read-only filesystem issue. |

## Installation

```bash
# Already installed (verify versions)
npm install next@latest sharp@latest

# Update Cloudinary integration
npm install next-cloudinary@latest cloudinary@latest

# Performance tooling (dev dependencies)
npm install -D @next/bundle-analyzer

# Optional: Alternative video storage (NOT recommended if using Cloudinary)
# npm install @vercel/blob
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Cloudinary (video)** | Mux | If video streaming is primary feature (not just promo videos). Mux specializes in video-only, higher quality ABR, but costs more. Overkill for 2-3 promo videos. |
| **Cloudinary (video)** | Vercel Blob + custom optimization | If absolutely minimizing costs ($0.023/GB vs Cloudinary credits). Requires manual video encoding, no transformations, no adaptive streaming. Worse UX, more dev time. |
| **Cloudinary (images)** | Vercel Image Optimization | Already using Cloudinary SDK. Vercel Image Optimization is serverless function-based, limited transformations, costs scale with usage. Cloudinary has generous free tier + better DX. |
| **next-cloudinary** | Direct Cloudinary SDK | If needing Node.js SDK features not in React components (admin API, batch uploads). `next-cloudinary` wraps SDK and is simpler for frontend use. |
| **@next/bundle-analyzer** | webpack-bundle-analyzer directly | If using custom webpack config. `@next/bundle-analyzer` is official Next.js wrapper with simpler setup. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Local JSON files for gallery data** | Vercel's filesystem is read-only at runtime. Causes deployment failures. Current issue in codebase. | **Cloudinary Media Library API** - Fetch gallery images at build time (Static Generation) or runtime (Server Components). Store metadata in Cloudinary tags/context, not local files. |
| **images.unoptimized: true** (current config) | Disables Next.js Image Optimization entirely. Serves uncompressed images, no responsive srcset, no format negotiation. Kills performance. | **Remove this line**. Let `next/image` + `sharp` handle optimization. Cloudinary integration doesn't require disabling optimization. |
| **External font CDNs** | Google Fonts external links add DNS lookup + connection time. | **next/font** - Self-host fonts with automatic subset optimization. Already using Tailwind, add font optimization. |
| **Client Components for video** | Entire video player bundle sent to client. Increases TTI (Time to Interactive). | **Server Components with CldVideoPlayer** - Render video HTML on server, only hydrate controls. Keep Client Components at leaf nodes. |
| **GIFs for background video** | 10-50x larger than H.264 video. Poor compression, no streaming. | **Background variant video** via Cloudinary - Auto-optimized, adaptive quality, proper compression. |
| **Image imports in components** | Next.js bundles imported images in client bundle for static imports. | **Cloudinary URLs** - Serve from CDN, not bundled. Or use `next/image` with public folder for small assets. |
| **Heavy icon libraries without optimization** | lucide-react, @heroicons load entire library by default. Adds 500KB+ to bundle. | **optimizePackageImports** in next.config.js - Automatically tree-shake icon imports. 15-70% dev time improvement. |

## Stack Patterns by Use Case

### Pattern 1: Self-Hosted Promo Video (4K Source)

**Scenario:** Drone footage promo video, 4K source, ~100MB raw file

**Stack:**
1. Upload raw video to **Cloudinary** (one-time)
2. Use **CldVideoPlayer** with `transformation.streaming_profile: 'hd'` and `sourceTypes: ['hls']`
3. Cloudinary automatically creates adaptive bitrate ladder (1080p, 720p, 480p, 360p)
4. Player detects user bandwidth and serves optimal quality
5. Enable `autoPlay: false` for promo videos (Core Web Vitals impact)

**Why:** Cloudinary free tier handles video transformations. Self-hosting 4K requires manual encoding to multiple formats, costs more bandwidth, worse UX. Cloudinary handles this automatically.

```jsx
// Recommended approach
import { CldVideoPlayer } from 'next-cloudinary';

<CldVideoPlayer
  width={1920}
  height={1080}
  src="promo-video-drone-footage"
  transformation={{
    streaming_profile: 'hd',
    quality: 'auto',
    format: 'auto'
  }}
  sourceTypes={['hls', 'dash', 'mp4']}
/>
```

### Pattern 2: Background Hero Video

**Scenario:** Short looping background clip, muted, autoplay

**Stack:**
1. Upload short clip (10-30s) to **Cloudinary**
2. Use `variant="background"` in **CldVideoPlayer**
3. Component automatically applies:
   - Lower quality settings (saves bandwidth)
   - Removes controls
   - Enables autoplay + muted
   - Disables seeking

**Why:** Background videos should be < 5MB. Cloudinary's "background" variant auto-optimizes for this use case. Prevents Core Web Vitals degradation.

```jsx
// Background video pattern
<CldVideoPlayer
  width={1920}
  height={1080}
  src="hero-background-loop"
  variant="background"
  transformation={{
    quality: 'auto:low',
    format: 'auto'
  }}
/>
```

### Pattern 3: Cloudinary Gallery Integration (No Local JSON)

**Scenario:** Image gallery that persists across deployments without local files

**Stack:**
1. Upload images to **Cloudinary folder** (e.g., `retreat-gallery/`)
2. Use **Cloudinary Admin API** or **Upload Widget** for client uploads
3. Fetch gallery images via **Server Component** at build time or request time
4. Render with **CldImage** for responsive optimization

**Why:** Solves read-only filesystem issue. Cloudinary becomes source of truth. Non-technical users can manage gallery via Cloudinary Media Library UI.

```tsx
// Server Component - fetch at runtime
import { v2 as cloudinary } from 'cloudinary';
import { CldImage } from 'next-cloudinary';

export default async function GalleryPage() {
  // Fetch from Cloudinary API (server-side only)
  const { resources } = await cloudinary.api.resources({
    type: 'upload',
    prefix: 'retreat-gallery/',
    max_results: 100
  });

  return (
    <div className="gallery-grid">
      {resources.map((image) => (
        <CldImage
          key={image.public_id}
          src={image.public_id}
          width={800}
          height={600}
          alt={image.context?.alt || 'Gallery image'}
          crop="fill"
          gravity="auto"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      ))}
    </div>
  );
}
```

### Pattern 4: Performance Optimization

**When:** After MVP, before launch, or when Lighthouse < 90

**Stack:**
1. Run **@next/bundle-analyzer** - identify top 2 bloat sources
2. Add **optimizePackageImports** to next.config.js for icon libraries
3. Convert page components to **Server Components** (default in App Router)
4. Use **next/font** instead of Google Fonts CDN
5. Remove `images.unoptimized: true` from next.config.js
6. Add **Lighthouse CI** to prevent regressions

**Tools:**
```bash
# Analyze bundle
ANALYZE=true npm run build

# Check bundle reports
open .next/analyze/client.html
open .next/analyze/nodejs.html
```

**Config changes:**
```js
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // Remove this line! It disables optimization
  // images: { unoptimized: true },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },

  // Optimize icon/UI library imports
  optimizePackageImports: [
    'lucide-react',
    '@heroicons/react',
    'react-icons',
  ],

  // Optional: Enable Cache Components (Next.js 15+)
  experimental: {
    cacheComponents: true, // Static shell + dynamic content
  },
});
```

## Version Compatibility

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| next-cloudinary@6.17.5+ | Next.js 14.x, 15.x | React 18.2+ | Peer dependency on `next` and `react`. Works with both App Router and Pages Router. |
| @next/bundle-analyzer | Matches Next.js major version | Next.js 14.x: use 14.x, Next.js 15.x: use 15.x | Must match Next.js version for webpack/turbopack compatibility. |
| sharp@0.33.5+ | Node.js 18.17+ | Next.js 14.x, 15.x | Native module. Vercel auto-installs correct version. Locally: may require rebuild on Node version change. |
| cloudinary@2.5.1+ | Node.js 14+ | All Next.js versions | SDK for Admin API. Not needed if only using `next-cloudinary` components. |
| @vercel/blob@2.2.0+ | Next.js 13.4+ | Vercel deployment only | Vercel-specific. Doesn't work on other hosts. |

**Breaking changes to watch:**
- **Next.js 14 → 15:** App Router stable, Cache Components added. No breaking changes for this stack.
- **next-cloudinary 6.x → 7.x:** Version 7.0.0-beta.1 exists. Wait for stable release. Stick with 6.17.5+.
- **Cloudinary SDK 1.x → 2.x:** Already on 2.x. No further action needed.

## Configuration Checklist

### Environment Variables (.env.local)

```bash
# Required for Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

# Optional: For Admin API (gallery fetching)
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Optional: For Vercel Blob (only if using alternative storage)
# BLOB_READ_WRITE_TOKEN=vercel_blob_token
```

### next.config.js Changes Required

**Current issues to fix:**
1. ❌ `images.unoptimized: true` - **Remove this**. It disables all Next.js image optimization.
2. ❌ `hostname: '**'` - **Too permissive**. Lock down to Cloudinary CDN.
3. ✅ CSP headers good, but add Cloudinary domains for video.

**Recommended config:**
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // REMOVED: unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com', // Cloudinary CDN
      },
      // Add other specific domains as needed
    ],
  },

  // Optimize icon library imports
  optimizePackageImports: ['react-icons', 'lucide-react'],

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // Add Cloudinary video domains
            value: "default-src 'self'; connect-src 'self' https://*.facebook.com https://www.google.com https://res.cloudinary.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.facebook.net https://*.facebook.com https://www.google.com https://unpkg.com; frame-src https://*.facebook.com https://calendar.google.com https://www.google.com/maps/embed; style-src 'self' 'unsafe-inline' https://*.facebook.com; font-src 'self' data: https://*.facebook.com; img-src 'self' https://*.facebook.com https://*.fbsbx.com https://www.google.com https://res.cloudinary.com data:; media-src 'self' https://res.cloudinary.com;"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
```

### Cloudinary Setup Steps

1. **Create free account:** cloudinary.com/users/register/free
2. **Get Cloud Name:** Dashboard → Account Details → Cloud Name
3. **Generate API credentials:** Dashboard → Settings → Security → Access Keys
4. **Organize assets:**
   - Create folder: `timber-threads/gallery/`
   - Create folder: `timber-threads/videos/`
   - Use tags for categorization (e.g., `quilting`, `retreat-space`, `workshops`)

## Cost Analysis (Budget-Conscious Project)

### Cloudinary Free Tier (Recommended)

| Resource | Free Tier | Estimated Usage | Overage Cost |
|----------|-----------|-----------------|--------------|
| Storage | 25 GB | ~5 GB (100 images + 3 videos) | $0.02/GB/month |
| Bandwidth | 25 GB/month | ~10 GB/month (low-traffic site) | $0.04/GB |
| Transformations | 25 credits (25K transforms) | ~5K/month | $0.60/1K transforms |

**Total monthly cost (within free tier):** $0
**If exceeding limits:** ~$5-10/month (still cheaper than alternatives)

**Value adds in free tier:**
- Automatic format optimization (WebP, AVIF)
- Responsive image generation (multiple sizes)
- Adaptive video streaming (HLS/DASH)
- CDN delivery (global)
- Media Library UI (non-technical user uploads)

### Vercel Blob Alternative (NOT Recommended)

| Resource | Cost | Estimated Usage | Monthly Cost |
|----------|------|-----------------|--------------|
| Storage | $0.023/GB-month | 5 GB | $0.12 |
| Bandwidth | $0.05/GB | 10 GB | $0.50 |
| **Missing features** | - | Manual video encoding, no transformations, no CDN edge locations | **+$20-50 dev time** |

**Total monthly cost:** $0.62 + significant dev time
**Verdict:** More expensive in total cost (time + money) vs Cloudinary free tier.

### Self-Hosting (Worst Option)

| Resource | Cost | Estimated Usage | Monthly Cost |
|----------|------|-----------------|--------------|
| S3 storage | $0.023/GB | 5 GB | $0.12 |
| CloudFront CDN | $0.085/GB (first 10TB) | 10 GB | $0.85 |
| Video encoding (MediaConvert) | $0.015/min output | 10 min total video | $0.15 one-time |
| **Dev time** | - | Setup + maintenance | **$200-500** |

**Total first month:** ~$200+ (mostly dev time)
**Total ongoing:** ~$1/month + maintenance burden
**Verdict:** Terrible ROI for budget project.

## Confidence Assessment

| Recommendation | Confidence | Source | Notes |
|----------------|------------|--------|-------|
| **next-cloudinary for video** | HIGH | Context7 (380 snippets) + Official docs | Proven integration. CldVideoPlayer handles all optimization automatically. |
| **Cloudinary over Vercel Blob** | HIGH | Vercel official docs + pricing comparison | Vercel docs recommend Cloudinary for media transformations. Blob is for raw storage only. |
| **Remove images.unoptimized** | HIGH | Next.js official docs + WebSearch (multiple sources) | Current config disables all optimization. Major performance issue. |
| **@next/bundle-analyzer** | HIGH | Next.js official docs + WebSearch (2026 best practices) | Standard tool for Next.js performance work. Official Vercel tool. |
| **optimizePackageImports** | HIGH | Next.js official docs + Vercel blog post | 15-70% dev time improvement. Official feature in Next.js. |
| **sharp for production** | HIGH | Next.js docs (strongly recommended) | Required for optimal Vercel performance. Already installed. |
| **Server Components default** | HIGH | Next.js App Router docs + WebSearch (2026 patterns) | App Router best practice. Already using App Router based on Next.js 14. |
| **Cloudinary free tier sufficient** | MEDIUM | Pricing pages + usage estimation | Based on "low-traffic retreat center" assumption. Monitor actual usage. |
| **Gallery via Cloudinary API** | MEDIUM | Context7 + community examples | Solves read-only filesystem issue. Requires server-side API calls (already using Server Components). |
| **Next.js 15 upgrade timing** | LOW | Release notes + WebSearch | Next.js 15 is stable, but 14.2.24 is working. Upgrade optional, not required for this stack. |

## Sources

### Context7 Documentation (HIGH confidence)
- **/cloudinary-community/next-cloudinary** - CldVideoPlayer, CldImage components, configuration, best practices
- **/vercel/next.js** - Image optimization, video handling, server components, performance

### Official Documentation (HIGH confidence)
- [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist) - Bundle analysis, performance
- [Next.js Videos Guide](https://nextjs.org/docs/app/building-your-application/optimizing/videos) - Video optimization strategies
- [Next.js Package Bundling](https://nextjs.org/docs/app/guides/package-bundling) - optimizePackageImports
- [Cloudinary Pricing](https://cloudinary.com/pricing) - Cost comparison, free tier limits
- [Vercel Blob Pricing](https://vercel.com/docs/vercel-blob/usage-and-pricing) - Storage costs

### Vercel Official Guides (HIGH confidence)
- [Best Practices for Hosting Videos on Vercel](https://vercel.com/guides/best-practices-for-hosting-videos-on-vercel-nextjs-mp4-gif) - Recommends Cloudinary for transformations
- [How We Optimized Package Imports in Next.js](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js) - optimizePackageImports feature

### Web Search - Multiple Sources (MEDIUM confidence)
- [Next.js Performance Optimization 2025 Playbook](https://medium.com/@buildweb.it/next-js-performance-optimization-a-2025-playbook-27db2772c1a7) - Server Components, bundle analysis
- [Lighthouse 100 with Next.js: Missing Performance Checklist](https://medium.com/better-dev-nextjs-react/lighthouse-100-with-next-js-the-missing-performance-checklist-e87ee487775f) - Bundle analyzer, font optimization
- [Next.js Performance Tuning: Practical Fixes for Better Lighthouse Scores](https://www.qed42.com/insights/next-js-performance-tuning-practical-fixes-for-better-lighthouse-scores) - Image optimization, lazy loading
- [App Router Pitfalls: Common Next.js Mistakes](https://imidef.com/en/2026-02-11-app-router-pitfalls) - Server Components patterns

### NPM Packages (verified via WebSearch, MEDIUM confidence)
- next-cloudinary@6.17.5 (latest as of Feb 2026)
- @vercel/blob@2.2.0 (latest as of Feb 2026)
- sharp (strongly recommended by Next.js)

---

*Stack research for: Timber & Threads Retreat Center - Video + Gallery Integration*
*Researched: 2026-02-14*
*Next step: Use this stack in roadmap creation for phased implementation*
