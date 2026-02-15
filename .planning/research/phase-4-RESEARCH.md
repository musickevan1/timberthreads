# Phase 4: Performance Optimization - Research

**Researched:** 2026-02-14
**Domain:** Next.js 14 performance optimization for mobile-first rural audience
**Confidence:** HIGH

## Summary

Phase 4 focuses on optimizing the Timber & Threads Retreat website for rural Missouri audiences with limited internet connectivity. The critical performance requirement is sub-3-second page loads on Fast 3G connections with a Lighthouse mobile score of 80+. The current codebase has significant optimization gaps: `images.unoptimized: true` disables all Next.js image optimization, unused Cloudinary packages bloat the bundle, and no responsive image sizing exists for mobile delivery.

The optimization strategy centers on four core areas: fixing Next.js image configuration to enable optimization, implementing responsive image sizing via Cloudinary transforms, analyzing and eliminating bundle bloat (unused packages, icon libraries), and ensuring lazy loading for below-fold content. Rural connectivity research shows that while 5G/LTE is expanding, 3G networks remain critical for rural areas in 2026, making aggressive optimization mandatory for target audience success.

**Primary recommendation:** Enable Next.js image optimization first (remove `images.unoptimized: true`), then implement Cloudinary responsive sizing with proper `sizes` attributes, followed by bundle analysis to remove unused packages. This sequence ensures foundational optimization before fine-tuning bundle size.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @next/bundle-analyzer | 14.x (matches Next.js) | Bundle size visualization and analysis | Official Next.js tool for identifying bloated dependencies, generates visual reports for client/server bundles, works with both Webpack and Turbopack |
| sharp | 0.33.5+ (already installed) | Production image optimization | Strongly recommended by Next.js for production, 20-60% faster than alternatives, required for optimal Vercel performance |
| next-cloudinary | 6.16.0+ (already installed) | Cloudinary integration with responsive images | Provides CldImage component with automatic format optimization (WebP, AVIF), proper sizes attribute handling, and transformation API |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Lighthouse CI | Latest | Performance monitoring in CI/CD | Add to GitHub Actions to prevent performance regressions after optimizing |
| Chrome DevTools | Built-in | Network throttling and Core Web Vitals measurement | Use Fast 3G profile for rural connection simulation during development |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @next/bundle-analyzer | webpack-bundle-analyzer directly | Bundle analyzer is official Next.js wrapper with simpler setup; direct webpack version requires custom config |
| Lighthouse CI | Manual Lighthouse audits | Manual audits catch regressions post-deployment; CI prevents them pre-deployment |
| Chrome DevTools throttling | Real device testing | DevTools provides quick iteration; real devices validate final performance |

**Installation:**
```bash
# Bundle analysis (dev dependency)
npm install -D @next/bundle-analyzer

# Sharp and next-cloudinary already installed - verify versions
npm list sharp next-cloudinary
```

## Architecture Patterns

### Recommended Configuration Structure
```
next.config.js          # Enable optimization, configure bundle analyzer
.lighthouserc.json      # Lighthouse CI thresholds (optional)
src/components/
├── Gallery.tsx         # Update with proper sizes attributes
├── Hero.tsx           # Update with priority/eager loading
└── [others].tsx       # Audit for optimization opportunities
```

### Pattern 1: Next.js Image Optimization Configuration
**What:** Enable Next.js built-in image optimization and configure Cloudinary remote patterns
**When to use:** Immediately - foundational for all image performance gains
**Example:**
```javascript
// next.config.js - REMOVE images.unoptimized: true
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // REMOVED: unoptimized: true,  // This disables ALL optimization
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',  // Specific domain, not '**'
      },
    ],
  },

  // Add CSP for Cloudinary media
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; connect-src 'self' https://*.facebook.com https://www.google.com https://res.cloudinary.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.facebook.net https://*.facebook.com https://www.google.com; frame-src https://*.facebook.com https://calendar.google.com https://www.google.com/maps/embed; style-src 'self' 'unsafe-inline' https://*.facebook.com; font-src 'self' data: https://*.facebook.com; img-src 'self' https://*.facebook.com https://*.fbsbx.com https://www.google.com https://res.cloudinary.com data:; media-src 'self' https://res.cloudinary.com;"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
```

### Pattern 2: Responsive Image Sizing with Cloudinary
**What:** Use CldImage with proper `sizes` attribute for mobile-first responsive delivery
**When to use:** For all gallery images and content images (not logos/icons)
**Example:**
```typescript
// Gallery component - responsive sizing
import { CldImage } from 'next-cloudinary';

// Gallery grid (3 columns desktop, 2 tablet, 1 mobile)
<CldImage
  src="gallery/retreat-image"
  width={800}
  height={600}
  alt="Retreat facility"
  crop="fill"
  gravity="auto"
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  loading="lazy"  // Below-fold images
/>

// Hero background (full-width, above-fold)
<CldImage
  src="gallery/hero-front-view"
  fill
  priority  // Above-fold LCP candidate
  sizes="100vw"
  alt="Timber & Threads Retreat Center"
  className="object-cover"
/>
```

**sizes attribute breakdown:**
- `(max-width: 768px) 100vw` - Mobile: full viewport width
- `(max-width: 1200px) 50vw` - Tablet: half viewport (2 columns)
- `33vw` - Desktop: one-third viewport (3 columns)

### Pattern 3: Bundle Analysis Configuration
**What:** Configure @next/bundle-analyzer to identify bloated dependencies
**When to use:** Before removing unused packages, after adding new dependencies
**Example:**
```javascript
// next.config.js with bundle analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },

  // Optimize icon library imports (if using)
  optimizePackageImports: [
    'react-icons',
    'lucide-react',
    '@heroicons/react',
  ],
};

module.exports = withBundleAnalyzer(nextConfig);
```

**Usage:**
```bash
# Generate bundle analysis
ANALYZE=true npm run build

# View reports
open .next/analyze/client.html
open .next/analyze/nodejs.html
```

### Pattern 4: Lazy Loading Strategy
**What:** Implement proper loading strategies for Core Web Vitals
**When to use:** Differentiate above-fold (LCP candidates) from below-fold images
**Example:**
```typescript
// Hero component - LCP candidate (above-fold)
<Image
  src="/assets/gallery/hero-front-view.jpeg"
  alt="Timber & Threads Retreat Center"
  fill
  priority  // Preloads and uses eager loading
  sizes="100vw"
  className="object-cover"
/>

// Gallery component - below-fold images
{facilityImages.map((image, index) => (
  <Image
    key={image.src}
    src={image.src}
    alt={image.alt}
    width={800}
    height={600}
    loading={index < 6 ? "eager" : "lazy"}  // First 6 eager, rest lazy
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  />
))}
```

**Key rules:**
- Use `priority` only on single true LCP candidate (typically hero image)
- First 6 gallery images: `loading="eager"` (above fold on desktop)
- Remaining images: `loading="lazy"` (below fold, load on scroll)
- Never use `priority` on multiple images (wastes preload bandwidth)

### Anti-Patterns to Avoid
- **Using `images.unoptimized: true`:** Disables all Next.js image optimization, serves uncompressed images, no responsive srcset, no format negotiation. Current issue in codebase.
- **Incorrect sizes attribute:** Using `sizes="100vw"` on all images defeats responsive optimization. Each image needs accurate layout-based sizes.
- **Multiple priority images:** Using `priority={true}` on more than 1-2 images per page wastes preload bandwidth and slows FCP.
- **Lazy loading LCP image:** Loading="lazy" on hero/LCP images triggers Lighthouse warning and degrades LCP score significantly.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image responsive sizing | Manual srcset generation with multiple sizes | CldImage with `sizes` attribute | Cloudinary generates optimal srcset automatically, handles WebP/AVIF format negotiation, provides gravity="auto" for smart cropping |
| Bundle size analysis | Manual webpack stats analysis | @next/bundle-analyzer | Official Next.js tool with visual reports, Turbopack compatibility, identifies exact import paths causing bloat |
| Mobile performance testing | Building custom throttling scripts | Chrome DevTools Network throttling + Lighthouse CI | Industry-standard tools with Fast 3G profile, accurate Core Web Vitals measurement, CI/CD integration |
| Lazy loading implementation | Custom IntersectionObserver for images | Native loading="lazy" + Next.js priority | Browser-native lazy loading is more performant, better viewport detection, simpler API |

**Key insight:** Image optimization and bundle analysis have mature, well-tested solutions that handle edge cases (browser compatibility, format support, connection detection) better than custom implementations. In rural connectivity scenarios, these optimizations are critical for usability.

## Common Pitfalls

### Pitfall 1: Disabling Image Optimization
**What goes wrong:** Setting `images.unoptimized: true` in next.config.js disables all Next.js image optimization, serving uncompressed images without responsive srcset or format negotiation. This is currently active in the codebase.
**Why it happens:** Developers enable this during development to avoid Sharp installation issues or to quickly deploy without understanding the performance impact. It's left in production accidentally.
**How to avoid:** Remove `images.unoptimized: true` from next.config.js immediately. Ensure Sharp is properly installed (`npm install sharp`). Configure `remotePatterns` for Cloudinary instead of using wildcard hostname.
**Warning signs:**
- Large image file sizes in Network tab (no WebP/AVIF format conversion)
- Missing srcset attribute on image elements
- Single image size served to all devices
- Lighthouse "Serve images in next-gen formats" warning

### Pitfall 2: Incorrect sizes Attribute
**What goes wrong:** Using generic `sizes="100vw"` on all images or omitting the attribute causes browser to download oversized images for small containers. A 400px container receives a 2000px image, wasting 5x bandwidth.
**Why it happens:** Developers don't understand how the `sizes` attribute works with srcset. Copy-paste examples without adjusting for actual layout. Assume Next.js handles sizing automatically without configuration.
**How to avoid:** Calculate actual image display sizes for each breakpoint. For gallery grid:
- Mobile (≤768px): Full width = `100vw`
- Tablet (≤1200px): 2 columns = `50vw`
- Desktop (>1200px): 3 columns = `33vw`
Resulting: `sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"`
**Warning signs:**
- Network tab shows 1920px images downloading for 400px containers
- High data usage on mobile devices
- Lighthouse "Properly size images" warning
- Images appear crisp but load slowly on mobile

### Pitfall 3: Multiple priority Images
**What goes wrong:** Marking multiple images with `priority={true}` creates multiple preload requests, slowing First Contentful Paint and wasting bandwidth. Browser must download all priority images before rendering content.
**Why it happens:** Developers want important images to load quickly and add priority to hero, logo, first gallery image, and CTAs. Misunderstanding that priority inserts preload link in document head.
**How to avoid:** Use `priority` only on single true LCP candidate - typically the hero background image. Logo can use `priority` if it's small (<50KB). All other images use default loading or `loading="lazy"`.
**Warning signs:**
- Lighthouse "Avoid chaining critical requests" warning
- Slow FCP despite fast connection
- Network waterfall shows multiple large images loading before HTML parsing
- More than 2 `<link rel="preload" as="image">` tags in document head

### Pitfall 4: Unused Cloudinary Packages in Bundle
**What goes wrong:** Both `cloudinary` (2.5.1) and `next-cloudinary` (6.16.0) are installed, but integration is commented out and file-based storage is used instead. Packages remain in dependencies, bloating the bundle unnecessarily.
**Why it happens:** Partial implementation started but switched to simpler file-based approach. Developer intended to complete Cloudinary integration later but forgot to remove packages. Package.json cleanup overlooked.
**How to avoid:**
- Option 1: Complete Cloudinary integration (recommended per Phase 2 research) and actively use packages
- Option 2: Remove unused packages: `npm uninstall cloudinary next-cloudinary`
- Use bundle analyzer to verify removal: `ANALYZE=true npm run build`
**Warning signs:**
- Cloudinary imports commented out in code
- Bundle analyzer shows cloudinary package in bundle despite no usage
- Build warnings about unused dependencies
- Package.json shows Cloudinary packages but no Cloudinary code in components

### Pitfall 5: Lazy Loading Above-Fold Images
**What goes wrong:** Setting `loading="lazy"` on hero image or first gallery images causes Largest Contentful Paint to delay until viewport intersection, degrading LCP metric significantly (2-4 second penalty).
**Why it happens:** Developers apply lazy loading globally to all images without distinguishing above-fold from below-fold content. Automated tooling adds loading="lazy" to every image tag.
**How to avoid:**
- Hero/LCP images: `priority` (or `loading="eager"`)
- First 6 gallery images (above fold on desktop): `loading="eager"`
- Remaining gallery images (below fold): `loading="lazy"`
Test above-fold determination at multiple viewport sizes (mobile, tablet, desktop).
**Warning signs:**
- Lighthouse warning: "Largest Contentful Paint image was lazily loaded"
- LCP score >2.5 seconds despite fast connection
- Hero image "pops in" after page load instead of appearing immediately
- Network tab shows LCP image loading late in waterfall

### Pitfall 6: Fast 3G Testing Overlooked
**What goes wrong:** Site performs well on developer's WiFi/5G connection but becomes unusable on rural 3G connections. Users in target audience (rural Missouri) experience timeouts, partial loads, and abandonment.
**Why it happens:** Developers test on fast connections only. Lack of awareness about target audience connectivity. Vercel preview deployments tested on office WiFi, not throttled connections.
**How to avoid:**
- Use Chrome DevTools Network throttling: "Fast 3G" profile during development
- Run Lighthouse audits in mobile mode with throttling enabled
- Set performance budget: page load <3 seconds on Fast 3G
- Test on real device with cellular connection in rural area if possible
**Warning signs:**
- Lighthouse mobile score significantly lower than desktop
- Time to Interactive (TTI) >5 seconds on mobile
- Large images (>500KB) loading on initial page load
- Video autoplay on mobile without connection detection

## Code Examples

Verified patterns from official sources:

### Enable Next.js Image Optimization
```javascript
// next.config.js - Current (WRONG)
const nextConfig = {
  images: {
    unoptimized: true,  // ❌ Disables ALL optimization
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',  // ❌ Too permissive
      },
    ],
  },
};

// next.config.js - Optimized (CORRECT)
const nextConfig = {
  images: {
    // ✅ Removed unoptimized flag - enables Sharp processing
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',  // ✅ Specific to Cloudinary CDN
      },
    ],
  },
};
```
**Source:** [Next.js Image Component Documentation](https://nextjs.org/docs/app/api-reference/components/image)

### Responsive Gallery Images with Cloudinary
```typescript
// src/components/Gallery.tsx - Current (needs optimization)
<Image
  src={image.src}
  alt={image.alt}
  width={800}
  height={600}
  className="..."
  // ❌ Missing: sizes attribute
  // ❌ Missing: proper loading strategy
/>

// src/components/Gallery.tsx - Optimized
import { CldImage } from 'next-cloudinary';

{facilityImages.map((image, index) => (
  <CldImage
    key={image.src}
    src={image.publicId}  // Cloudinary public ID after Phase 2 migration
    width={800}
    height={600}
    alt={image.alt}
    crop="fill"
    gravity="auto"  // Smart cropping for different aspect ratios
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    loading={index < 6 ? "eager" : "lazy"}  // First 6 eager, rest lazy
    className="..."
  />
))}
```
**Source:** [Cloudinary Responsive Images Guide](https://cloudinary.com/blog/deep-dive-responsive-images-next-js)

### Hero Image with Priority Loading
```typescript
// src/components/Hero.tsx - Current (missing priority)
<Image
  src="/assets/gallery/hero-front-view.jpeg"
  alt="Timber & Threads Retreat Center"
  fill
  quality={100}  // ❌ Unnecessarily high quality
  loading="eager"
  sizes="100vw"
  className="object-cover"
/>

// src/components/Hero.tsx - Optimized
<Image
  src="/assets/gallery/hero-front-view.jpeg"
  alt="Timber & Threads Retreat Center"
  fill
  priority  // ✅ Preloads LCP candidate
  quality={85}  // ✅ Balanced quality (100 is overkill for web)
  sizes="100vw"
  className="object-cover"
/>
```
**Source:** [Next.js Image Priority Documentation](https://nextjs.org/docs/app/api-reference/components/image#priority)

### Bundle Analyzer Setup
```javascript
// next.config.js - Add bundle analyzer
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },

  // Optimize icon library imports if present
  optimizePackageImports: [
    'react-icons',
    'lucide-react',
  ],
};

module.exports = withBundleAnalyzer(nextConfig);
```

**Usage in package.json:**
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "analyze": "ANALYZE=true next build"
  }
}
```
**Source:** [Next.js Bundle Analyzer Documentation](https://nextjs.org/docs/14/pages/building-your-application/optimizing/bundle-analyzer)

### Lighthouse Performance Testing
```bash
# Install Lighthouse CI (optional - for automated testing)
npm install -D @lhci/cli

# Run Lighthouse audit locally
npx lighthouse https://timberandthreadsretreat.com --view

# Run with mobile throttling (Fast 3G)
npx lighthouse https://timberandthreadsretreat.com \
  --preset=perf \
  --throttling-method=devtools \
  --throttling.cpuSlowdownMultiplier=4 \
  --view
```

**.lighthouserc.json (optional CI configuration):**
```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "settings": {
        "preset": "desktop",
        "throttling": {
          "rttMs": 40,
          "throughputKbps": 10240,
          "cpuSlowdownMultiplier": 1
        }
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.8}],
        "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}]
      }
    }
  }
}
```
**Source:** [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual srcset generation | Next.js Image with automatic srcset | Next.js 10+ (2020) | Automatic responsive images, no manual breakpoint management |
| `loading="eager"` everywhere | Strategic lazy loading with `loading="lazy"` | HTML standard (2019) | 20-50% faster initial page loads by deferring below-fold images |
| Generic image quality settings | `quality="auto"` with Cloudinary | Cloudinary 2023+ | 30-40% smaller file sizes with imperceptible quality loss |
| webpack-bundle-analyzer manual setup | @next/bundle-analyzer official plugin | Next.js 13+ (2022) | Simpler setup, Turbopack compatibility, better DX |
| `priority` property | `preload` property | Next.js 16+ (2026) | `priority` deprecated in favor of explicit `preload` |

**Deprecated/outdated:**
- `images.unoptimized: true` - Was development workaround for Sharp installation issues, now considered anti-pattern for production
- Quality 100 for web images - Modern standard is 75-85 with Cloudinary auto-quality
- Wildcard hostname `'**'` in remotePatterns - Security risk, use specific domains

## Open Questions

1. **Current bundle size baseline**
   - What we know: Cloudinary packages installed but unused (commented out)
   - What's unclear: Total bundle size impact, which dependencies contribute most bloat
   - Recommendation: Run bundle analyzer immediately to establish baseline before optimization

2. **Gallery image count and sizes**
   - What we know: Gallery loads all images without pagination (from CONCERNS.md)
   - What's unclear: How many images exist? Average file sizes? Total bandwidth per page load?
   - Recommendation: Audit gallery API response size and implement pagination if >20 images

3. **Video integration impact on performance**
   - What we know: Phase 3 adds hero background video and promo video section
   - What's unclear: Will video addition push page load over 3-second budget on Fast 3G?
   - Recommendation: Phase 4 must test with videos in place from Phase 3, implement connection detection

4. **Cloudinary integration timing**
   - What we know: Phase 2 migrates to Cloudinary, but optimization happens in Phase 4
   - What's unclear: Will Phase 2 implementation already handle responsive sizing, or defer to Phase 4?
   - Recommendation: Phase 4 should verify and optimize Phase 2 Cloudinary implementation, not rebuild it

5. **Icon library usage**
   - What we know: `optimizePackageImports` can optimize icon libraries (react-icons, lucide-react)
   - What's unclear: Does codebase use icon libraries? Which ones? How many icons imported?
   - Recommendation: Grep codebase for icon imports before adding optimizePackageImports

## Sources

### Primary (HIGH confidence)
- [Next.js Image Component Documentation](https://nextjs.org/docs/app/api-reference/components/image) - Official Next.js image optimization configuration and API
- [Next.js Bundle Analyzer Documentation](https://nextjs.org/docs/14/pages/building-your-application/optimizing/bundle-analyzer) - Official bundle analysis setup
- [Next.js Package Bundling Guide](https://nextjs.org/docs/app/guides/package-bundling) - optimizePackageImports configuration
- [Cloudinary Responsive Images with Next.js](https://cloudinary.com/blog/deep-dive-responsive-images-next-js) - CldImage component usage and sizes attribute
- [How Responsive Images Work in Next Cloudinary](https://next.cloudinary.dev/guides/responsive-images) - Official next-cloudinary responsive patterns
- [Vercel: How We Optimized Package Imports](https://vercel.com/blog/how-we-optimized-package-imports-in-next-js) - optimizePackageImports performance benefits

### Secondary (MEDIUM confidence)
- [Mastering Mobile Performance: Next.js Lighthouse Scores](https://www.wisp.blog/blog/mastering-mobile-performance-a-complete-guide-to-improving-nextjs-lighthouse-scores) - Mobile optimization strategies
- [Next.js Performance Tuning: Practical Fixes](https://www.qed42.com/insights/next-js-performance-tuning-practical-fixes-for-better-lighthouse-scores) - Bundle size and lazy loading
- [Lighthouse 100 with Next.js: Missing Performance Checklist](https://medium.com/better-dev-nextjs-react/lighthouse-100-with-next-js-the-missing-performance-checklist-e87ee487775f) - Core Web Vitals optimization
- [Next.js Image Component: Performance and CWV](https://pagepro.co/blog/nextjs-image-component-performance-cwv/) - LCP optimization with priority attribute
- [Fix Largest Contentful Paint Lazy Loading](https://www.corewebvitals.io/pagespeed/fix-largest-contentful-paint-image-was-lazily-loaded-lighthouse) - Avoiding lazy loading pitfall on LCP
- [Reducing Next.js Bundle Size](http://www.catchmetrics.io/blog/reducing-nextjs-bundle-size-with-nextjs-bundle-analyzer) - Bundle analysis workflow

### Tertiary (LOW confidence - needs validation)
- [Best Rural Internet Solutions 2026](https://www.compareinternet.com/blog/best-rural-internet-solutions-2026/) - Rural connectivity landscape (validates 3G relevance)
- [Evolution of 3G+ Networks](https://www.p1sec.com/en/blog/the-evolution-and-impact-of-3g-networks-connecting-the-world-and-bridging-gaps) - 3G role in rural areas (background context)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Next.js documentation, verified package versions, Cloudinary official guides
- Architecture: HIGH - Next.js patterns well-established, Cloudinary integration documented, bundle analyzer usage standard
- Pitfalls: HIGH - Based on current codebase analysis (images.unoptimized: true exists), official Lighthouse documentation, Cloudinary best practices

**Research date:** 2026-02-14
**Valid until:** 2026-03-16 (30 days - stable domain)

**Dependencies:**
- Phase 2: Cloudinary migration must be complete before responsive sizing optimization
- Phase 3: Video integration must be complete before final performance testing
- Existing codebase: next.config.js, Gallery.tsx, Hero.tsx require modification

**Performance budget (from requirements):**
- Page load: <3 seconds on Fast 3G
- Lighthouse mobile: ≥80
- Images: Responsive sizing via Cloudinary transforms
- Bundle: No unused Cloudinary packages

**Key verification steps for Phase 4:**
1. Run bundle analyzer and document baseline bundle size
2. Remove `images.unoptimized: true` and verify Sharp is processing images
3. Audit gallery for image count and implement pagination if needed
4. Update Gallery.tsx with proper `sizes` attributes
5. Update Hero.tsx with `priority` on LCP candidate only
6. Remove unused packages (cloudinary/next-cloudinary if not used by Phase 2)
7. Run Lighthouse with Fast 3G throttling and verify ≥80 score
8. Test on real mobile device with cellular connection
