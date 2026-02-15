# Project Research Summary

**Project:** Timber & Threads Retreat Center - Video & Gallery Enhancement
**Domain:** Next.js 14 website enhancement with video integration and Cloudinary gallery migration
**Researched:** 2026-02-14
**Confidence:** HIGH

## Executive Summary

This is a Next.js 14 enhancement project for a retreat center website, adding promo video integration (hero background + dedicated section) and migrating image gallery from file-based storage to Cloudinary. The site is deployed on Vercel with existing infrastructure: Next.js 14.2.24 with App Router, Tailwind CSS, and a broken file-based gallery system caused by Vercel's read-only filesystem.

The recommended approach prioritizes fixing the broken gallery infrastructure first, then adding video capabilities. Use Cloudinary for both images AND videos to stay within budget constraints (both have generous free tiers). The critical architectural insight is that Vercel's serverless environment requires external persistent storage - Cloudinary for media, Vercel KV for metadata - rather than file-based databases. Video files must be aggressively compressed (<10MB total) to avoid bandwidth exhaustion on Vercel's 100GB free tier, with mobile-specific optimizations mandatory for rural Missouri target audience.

Key risks center on bandwidth consumption (both Vercel and Cloudinary free tiers) and mobile performance degradation from unoptimized video. Mitigation: compress all videos to <5MB each, implement connection detection to disable video on 3G/slow connections, use next-cloudinary components exclusively (not direct Image component with Cloudinary URLs), and establish quota monitoring from day one. The tight 1-week timeline and $400-600 budget make external CDN usage (Cloudinary) more cost-effective than self-hosting infrastructure.

## Key Findings

### Recommended Stack

**Critical finding:** The current architecture has a production bug - file-based JSON database (db.json) fails on Vercel's read-only filesystem. This must be resolved before any new features. Stack research identified Cloudinary + next-cloudinary as the optimal solution for both images and videos within budget constraints.

**Core technologies:**
- **Next.js 14.2.24 (current) → 15.1.11+ (optional upgrade)**: Already in use with App Router. Provides server components for bundle size reduction. Next.js 15 adds Cache Components but upgrade is optional, not required.
- **next-cloudinary 6.17.5+**: Unified image/video optimization library. Provides CldImage and CldVideoPlayer components with automatic format optimization (WebP, AVIF), adaptive streaming (HLS/DASH), and transformation API. Medium Source Reputation (79.6 benchmark), 380 code snippets.
- **Cloudinary 2.5.1+ (SDK)**: Cloud-based media hosting and CDN. Free tier: 25 GB storage + 25 GB bandwidth. Solves read-only filesystem issue by providing persistent cloud storage. Cost-effective for budget projects vs self-hosting + CDN.
- **sharp 0.33.5+**: Already installed. Strongly recommended by Next.js for production image optimization. 20-60% faster than alternatives.
- **@next/bundle-analyzer**: For performance optimization phase. Identifies bloated dependencies. Works with both Webpack and Turbopack.

**Critical configuration changes required:**
- Remove `images.unoptimized: true` from next.config.js (currently disables all optimization)
- Add Cloudinary to remotePatterns for res.cloudinary.com
- Enable optimizePackageImports for icon libraries (15-70% dev time improvement)

### Expected Features

Research identified a clear MVP scope focusing on performance and mobile-first design for rural Missouri audience.

**Must have (table stakes):**
- Mobile-optimized gallery (60%+ traffic from mobile) - Cloudinary handles responsive breakpoints automatically
- Lazy-loaded images - Browser-native loading="lazy" + Cloudinary optimization
- Gallery categories/organization - Simple filter/tab UI over categorized images
- Fast page load (<3s) - Critical for rural connections; requires video optimization + CDN
- Muted autoplay hero video - Industry standard for hospitality sites, accessibility requirement
- Video fallback image - Hero video needs static placeholder for slow connections
- Alt text on all images - Accessibility requirement + SEO benefit

**Should have (competitive):**
- Self-hosted promo video (no YouTube ads/branding) - Professional feel, using next-cloudinary CldVideoPlayer
- Drone footage showcase - Unique island location differentiator
- Progressive image loading (blur-up) - Smooth UX despite slower rural connections
- Pause control for hero video - Respectful of data usage, accessibility
- Dedicated "Virtual Tour" section - Helps remote users visualize space
- Gallery metadata/captions - Tell story of quilting space and family-friendly features

**Defer (v2+):**
- Video testimonials from guests (need to collect content first)
- 360° photo tours (high production cost, validate need first)
- Integrated booking system (scope creep, contact form sufficient)
- Video analytics (optimization for later, focus on launch)

**Anti-features to avoid:**
- Unmuted autoplay video (accessibility nightmare, annoying, browsers block it)
- Auto-advancing gallery carousel (accessibility issues, motion sickness)
- Full 1080p+ video everywhere (massive file sizes, 720p sufficient for web)
- Video hosted on own server without CDN (bandwidth costs, no optimization)
- Infinite scroll gallery (hard to reach footer, accessibility issues)

### Architecture Approach

Standard Next.js 14 App Router architecture with serverless API routes and external persistent storage. The key architectural pattern is separation of concerns: static video files in /public (compressed <10MB total), Cloudinary for image/video CDN delivery, and Vercel KV for metadata persistence. Current file-based database must be replaced with Vercel KV to fix production bugs.

**Major components:**
1. **Hero Component** - Display hero section with background video using HTML5 `<video>` tag, autoplay, loop, muted, playsInline attributes. Static MP4 from /public/assets/videos/.
2. **Gallery Component** - Display Cloudinary-hosted images using CldImage from next-cloudinary with lazy loading. Fetch metadata from /api/gallery route backed by Vercel KV.
3. **VideoSection Component** - Dedicated promo video section using CldVideoPlayer for automatic optimization, adaptive streaming, and proper controls.
4. **API Gallery Route** - CRUD operations for gallery images using Cloudinary SDK + Vercel KV for metadata. Replaces broken file-based db.json.
5. **Cloudinary Integration Layer** - Centralized configuration (lib/cloudinary.ts) with upload helpers, transformation presets, and SDK initialization.

**Critical patterns:**
- **Self-hosted video delivery:** For videos <50MB, serve from /public via Vercel's Edge Network. Simple, no external dependencies. Target <10MB total to avoid bandwidth exhaustion.
- **Cloudinary for gallery:** Use as CDN and optimization service. Solves read-only filesystem issue, provides persistent storage, automatic format optimization (WebP, AVIF).
- **Vercel KV for metadata:** Replace file-based JSON database with Redis. Persistent across deployments, fast read/write, integrated with Vercel. Free tier: 256MB storage, 100K reads/month.
- **Signed uploads for security:** Generate server-side signatures for Cloudinary uploads to prevent unauthorized access and quota theft.
- **Progressive enhancement:** Lazy loading, skeleton states, optimized delivery. Intersection Observer for images, preload="none" for videos.

### Critical Pitfalls

1. **Vercel Free Tier Bandwidth Exhaustion** - Serving self-hosted video directly from Vercel deployment rapidly exhausts 100GB monthly bandwidth limit. A single 50MB video = only 2,000 loads before limit hit. Background video auto-looping can reach limit in days. **Prevention:** Compress videos aggressively (<10MB for hero, <25MB for promo), use multiple quality versions (1080p desktop, 720p mobile), implement adaptive loading for slow connections, monitor dashboard daily during first week.

2. **Incorrect Video Compression Settings** - Default FFmpeg settings produce either massive file sizes or unacceptable quality loss. Drone footage has unique compression challenges (high motion, detailed landscapes). H.265/HEVC without proper Safari tags (`-tag:v hvc1`) causes playback failures. **Prevention:** Use `ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -movflags +faststart` for H.264 (universal), or `ffmpeg -i input.mp4 -c:v libx265 -crf 28 -tag:v hvc1 -movflags +faststart` for H.265. Always include `-movflags +faststart` for web streaming. Test CRF values on actual drone footage samples.

3. **Hero Background Video Mobile Performance Disaster** - Background video destroys mobile performance: slow page loads, excessive data consumption on cellular, autoplay failures, fullscreen takeover in Safari. Lighthouse mobile scores drop from 90+ to <50. **Prevention:** Required attributes `<video autoPlay muted loop playsInline>`, set `preload="metadata"` not "auto", implement mobile/connection detection to disable video on 3G/slow connections, create mobile-specific ultra-compressed version (<5MB), always provide high-quality poster image fallback, test on real device with throttled connection.

4. **Cloudinary Migration URL Breakage** - After migrating gallery images to Cloudinary, production build contains broken image links, missing images. Developers forget to update all URL references (hardcoded paths, CSS backgrounds, JSON data). Not configuring next.config.js remotePatterns causes Image component failures. **Prevention:** Grep entire codebase for image references before migration, update next.config.js FIRST to allow res.cloudinary.com, maintain URL mapping file (old-path → cloudinary-public-id), implement 301 redirects for old URLs during transition, test in Vercel preview environment before production.

5. **Next.js Build Size Exceeds Vercel Limits** - Placing large video files (50-100MB) in /public directory causes deployment failure ("Serverless Function exceeded 250 MB"). Multiple video versions compound the problem. **Prevention:** NEVER put videos >10MB total in /public - use external storage, compress aggressively (<5MB per file), limit to maximum 2-3 video files, enable standalone output in next.config.js, monitor build size locally with `du -sh .next/`.

## Implications for Roadmap

Based on research, suggested phase structure prioritizes fixing broken infrastructure before adding new features:

### Phase 1: Foundation & Video Optimization
**Rationale:** Current gallery system is broken in production (file-based db.json on read-only filesystem). Must fix this foundational issue before building new features. Pair with video optimization to establish compression workflow early and avoid bandwidth disasters.

**Delivers:**
- Cloudinary account setup and configuration (lib/cloudinary.ts)
- Vercel KV integration for persistent metadata storage
- Video compression pipeline (FFmpeg settings, multi-resolution versions)
- Compressed video assets (<10MB total) ready for deployment

**Addresses:**
- CRITICAL: Fixes broken gallery persistence in production
- Establishes video optimization workflow before deployment
- Sets up infrastructure for all subsequent work

**Avoids:**
- Vercel bandwidth exhaustion (Pitfall 1)
- Incorrect video compression (Pitfall 2)
- Build size exceeding limits (Pitfall 5)

**Research flag:** Standard setup, well-documented patterns - skip additional research

### Phase 2: Gallery Migration to Cloudinary
**Rationale:** With Cloudinary and Vercel KV infrastructure in place, migrate existing gallery images and update all references. This must happen before video integration to avoid compounding complexity and ensure gallery is working before adding more media.

**Delivers:**
- Migrated gallery images to Cloudinary with optimized delivery
- Updated Gallery component using CldImage from next-cloudinary
- Updated API routes using Vercel KV for metadata (replaces db.json)
- Comprehensive URL mapping file (old paths → Cloudinary public IDs)
- Updated next.config.js with remotePatterns for Cloudinary

**Uses:**
- next-cloudinary 6.17.5+ for CldImage components
- Cloudinary SDK for upload and API operations
- Vercel KV for metadata persistence

**Implements:**
- Gallery Component architecture pattern
- API Gallery Route with Vercel KV backend
- Signed uploads for security

**Avoids:**
- Cloudinary migration URL breakage (Pitfall 4)
- Next.js Image component misuse (Pitfall 7 from PITFALLS.md)

**Research flag:** Standard Cloudinary migration - skip additional research, follow established patterns from ARCHITECTURE.md

### Phase 3: Video Integration (Hero + Promo Section)
**Rationale:** With gallery working and video assets optimized, add hero background video and dedicated promo section. This phase is independent from gallery work and can leverage optimized video pipeline from Phase 1.

**Delivers:**
- Updated Hero component with background video (muted autoplay loop)
- New VideoSection component with dedicated promo video player
- Poster images for fallback states
- Mobile-responsive video loading with connection detection
- Video assets deployed to /public/assets/videos/

**Addresses:**
- Hero background video (must-have feature)
- Self-hosted promo video (differentiator)
- Video pause controls (must-have)
- Video fallback image (must-have)

**Implements:**
- Hero Component architecture pattern
- VideoSection Component architecture pattern
- Self-hosted video delivery pattern from ARCHITECTURE.md

**Avoids:**
- Hero background video mobile performance disaster (Pitfall 3)
- Autoplay failures on iOS (proper attributes)

**Research flag:** Standard HTML5 video implementation - skip additional research, use patterns from STACK.md + ARCHITECTURE.md

### Phase 4: Performance Optimization & Polish
**Rationale:** With all features implemented, optimize performance to meet targets for rural Missouri audience. Focus on Core Web Vitals, mobile performance, and bandwidth efficiency.

**Delivers:**
- Lazy loading for images (first 6 eager, rest lazy)
- Progressive blur-up placeholders for gallery images
- Optimized video preload attributes and poster images
- Bundle analysis and optimization (icon library tree-shaking)
- Mobile-specific optimizations (connection detection, disabled video on 3G)
- Performance testing on throttled connections (Fast 3G)

**Addresses:**
- Fast page load <3s (must-have)
- Progressive image loading (differentiator)
- Mobile-optimized gallery (must-have)
- Lazy-loaded images (must-have)

**Uses:**
- @next/bundle-analyzer for bundle size optimization
- optimizePackageImports in next.config.js
- Cloudinary optimization features (blur-up, responsive sizing)

**Avoids:**
- Loading all gallery images eagerly (Performance Trap)
- Excessive preloading with priority={true} (Performance Trap)
- Uncompressed hero background video (Performance Trap)

**Research flag:** Skip additional research - leverage Lighthouse, Chrome DevTools, and established performance patterns

### Phase Ordering Rationale

**Why this order:**
1. **Foundation first (Phase 1)** - File-based database is broken in production (critical bug). Cannot build new features on broken infrastructure. Cloudinary setup enables both gallery and video work. Video optimization must happen before deployment to avoid bandwidth disasters.

2. **Gallery before video (Phase 2)** - Gallery is existing functionality that needs fixing, video is new. Migrating gallery establishes Cloudinary patterns that video work can leverage. Separating gallery and video work reduces complexity and allows for focused testing.

3. **Video integration independent (Phase 3)** - Uses completely separate architecture (static files + HTML5 video vs Cloudinary API). Can be developed in parallel with Phase 2 if needed, but sequential order reduces risk.

4. **Performance last (Phase 4)** - Requires all components to be in place for holistic optimization. Bundle analysis only useful once all dependencies are installed. Lazy loading strategies depend on final component structure.

**Dependency structure:**
- Phase 1 → Phase 2 (critical path: Cloudinary/KV setup enables gallery migration)
- Phase 1 → Phase 3 (video optimization enables video integration)
- Phases 2 + 3 → Phase 4 (performance requires all features implemented)

**Grouping rationale:**
- Phase 1 groups infrastructure setup with video optimization because both must happen before deployment
- Phase 2 is isolated gallery work to reduce complexity and enable focused testing
- Phase 3 is isolated video work using patterns established in Phase 1
- Phase 4 is holistic optimization across all implemented features

**How this avoids pitfalls:**
- Early compression workflow (Phase 1) prevents bandwidth exhaustion and build size issues
- Gallery migration before video (Phase 2) avoids compounding complexity when debugging URL breakage
- Mobile testing in performance phase (Phase 4) catches background video mobile disasters before production
- Sequential phases with clear boundaries enable Vercel preview testing between each phase

### Research Flags

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** Cloudinary setup and FFmpeg video compression are well-documented with established patterns. Use official docs and STACK.md recommendations.
- **Phase 2:** Cloudinary migration has extensive documentation and community examples. Follow Architecture.md patterns for Vercel KV integration.
- **Phase 3:** HTML5 video implementation is standard web development. Use patterns from STACK.md and ARCHITECTURE.md.
- **Phase 4:** Performance optimization uses standard tools (Lighthouse, bundle-analyzer) with well-established techniques.

**No phases require additional research.** All four phases can be implemented using findings from completed research documents (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified with official Next.js, Cloudinary, and Vercel docs. Context7 data for next-cloudinary (380 snippets). Sharp and bundle-analyzer are official Next.js recommendations. |
| Features | MEDIUM | Web search sources for retreat center best practices, hospitality site standards, and video optimization. No Context7 data, but multiple sources converge on same recommendations. |
| Architecture | HIGH | Official Vercel and Next.js documentation for serverless patterns, Cloudinary integration guides, established patterns for App Router. Clear architectural requirements based on platform constraints. |
| Pitfalls | HIGH | Official Vercel documentation on limits, Next.js video optimization guides, Cloudinary pricing and quota documentation. Multiple web search sources confirm compression settings and mobile performance issues. |

**Overall confidence:** HIGH

All four research areas have strong source backing (official docs, Context7, or converging web search results). The architecture is dictated by Vercel's serverless constraints (well-documented). Stack recommendations come from official sources. Pitfalls are backed by Vercel's official documentation on limits and Next.js best practices.

### Gaps to Address

**Cloudinary free tier usage estimation:**
- Research calculated estimated usage based on "low-traffic retreat center" assumption
- **Gap:** Actual traffic patterns unknown - could exceed 25GB bandwidth if site gets unexpected viral attention
- **Mitigation:** Set up Cloudinary usage alerts (available in dashboard), monitor weekly during first month, have contingency plan for upgrading to paid tier (~$5-10/month if needed)

**Video quality vs file size tradeoff:**
- FFmpeg CRF settings provided (23 for H.264, 28 for H.265) are starting points
- **Gap:** Optimal CRF for specific drone footage requires testing on actual content
- **Mitigation:** Phase 1 includes testing compression on sample drone footage before batch processing. Iterate CRF values (22, 23, 24) until quality/size balance is acceptable.

**Mobile device diversity:**
- Performance targets assume mid-range Android devices and recent iPhones
- **Gap:** Unknown exact device distribution for rural Missouri audience
- **Mitigation:** Use Chrome DevTools throttling (Fast 3G) for baseline testing, implement progressive enhancement so video failure doesn't break core experience, rely on poster images as fallbacks

**Next.js 14 vs 15 upgrade timing:**
- Research notes Next.js 15 is stable with Cache Components feature
- **Gap:** Unclear if upgrade provides meaningful benefit for this specific project
- **Mitigation:** Stay on Next.js 14.2.24 (currently working). Optional upgrade to 15.x can be deferred to post-launch optimization if needed. No breaking changes identified.

## Sources

### Primary (HIGH confidence)
- **/cloudinary-community/next-cloudinary** (Context7) - CldVideoPlayer, CldImage components, configuration, best practices (380 code snippets)
- **/vercel/next.js** (Context7) - Image optimization, video handling, server components, performance patterns
- [Next.js Production Checklist](https://nextjs.org/docs/app/guides/production-checklist) - Bundle analysis, performance optimization
- [Next.js Videos Guide](https://nextjs.org/docs/app/building-your-application/optimizing/videos) - Video optimization strategies, recommended approaches
- [Vercel: Best Practices for Hosting Videos](https://vercel.com/guides/best-practices-for-hosting-videos-on-vercel-nextjs-mp4-gif) - Official video hosting recommendations
- [Vercel Limits Documentation](https://vercel.com/docs/limits) - Bandwidth and function size limits (100GB, 250MB)
- [Cloudinary Pricing](https://cloudinary.com/pricing) - Free tier specifications (25GB storage + bandwidth)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv) - Setup and usage patterns

### Secondary (MEDIUM confidence)
- [Next.js Performance Optimization 2025 Playbook](https://medium.com/@buildweb.it/next-js-performance-optimization-a-2025-playbook-27db2772c1a7) - Server Components, bundle analysis techniques
- [Lighthouse 100 with Next.js: Missing Performance Checklist](https://medium.com/better-dev-nextjs-react/lighthouse-100-with-next-js-the-missing-performance-checklist-e87ee487775f) - Bundle analyzer usage, font optimization
- [Next.js Performance Tuning: Practical Fixes for Better Lighthouse Scores](https://www.qed42.com/insights/next-js-performance-tuning-practical-fixes-for-better-lighthouse-scores) - Image optimization, lazy loading strategies
- [Optimizing Hero Background Videos](https://rigor.com/blog/optimizing-html5-hero-background-videos/) - Video compression and delivery best practices
- [Fast and Responsive Hero Videos](https://simonhearne.com/2021/fast-responsive-videos/) - Performance optimization techniques for background video
- [Cloudinary Responsive Image Gallery Guide](https://cloudinary.com/guides/responsive-images/responsive-image-gallery) - Gallery optimization patterns
- [12 Key Features for Retreat Websites](https://basundari.com/retreat-websites/) - Retreat center specific feature expectations
- [Hotel Website Design Best Practices](https://fireart.studio/blog/7-tips-for-perfect-hotel-website-design/) - Hospitality industry standards

### Tertiary (LOW confidence - needs validation)
- [Creating Web Optimized Video with FFmpeg](https://pixelpoint.io/blog/web-optimized-video-ffmpeg/) - H.264/H.265 compression settings (validate on actual drone footage)
- [Compress Drone Video for Web](https://www.winxdvd.com/resize-video/compress-drone-video.htm) - Drone-specific compression recommendations (test CRF values)
- [Video Autoplay Best Practices](https://cloudinary.com/guides/video-effects/video-autoplay-in-html) - Autoplay implementation (verify mobile behavior in testing)

---
*Research completed: 2026-02-14*
*Ready for roadmap: yes*
