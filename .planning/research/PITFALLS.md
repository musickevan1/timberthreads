# Pitfalls Research

**Domain:** Next.js 14 site with self-hosted video + Cloudinary gallery migration on Vercel
**Researched:** 2026-02-14
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Vercel Free Tier Bandwidth Exhaustion

**What goes wrong:**
Serving self-hosted 4K video files directly from Vercel deployment rapidly exhausts the 100GB monthly bandwidth limit on the free tier, causing site suspension or unexpected upgrade to paid plan mid-month.

**Why it happens:**
Developers assume Vercel's CDN caching will minimize bandwidth consumption, but Vercel bills for ALL bandwidth (cached or uncached). A single 4K drone video at 50-100MB means only 1,000-2,000 full video loads per month before hitting the limit. With background video auto-looping on hero sections, this limit can be reached in days, not weeks.

**How to avoid:**
- Compress 4K source footage aggressively (target <10MB for hero background videos, <25MB for main promo video)
- Use multiple quality versions: 4K for downloads only, 1080p for desktop viewing, 720p for mobile
- Consider Cloudinary for video delivery (not just images) to leverage their bandwidth allocation
- Monitor Vercel dashboard bandwidth usage daily during first week after video deployment
- Implement adaptive loading: detect mobile/slow connections and serve lower quality or disable autoplay

**Warning signs:**
- Source video files in `/public` folder exceed 15MB each
- No compression workflow defined before deployment
- Planning to use same video file for all device types
- Bandwidth usage jumps >20GB in first 3 days post-deployment

**Phase to address:**
Phase 1 (Video Optimization & Compression) - MUST establish compression pipeline before any deployment

---

### Pitfall 2: Incorrect Video Compression Settings

**What goes wrong:**
Using default FFmpeg settings or wrong codec produces either massive file sizes (defeating bandwidth optimization) or unacceptable quality loss (especially visible in aerial/drone footage with motion). H.265/HEVC encoding without proper browser compatibility fallback causes playback failures on older devices.

**Why it happens:**
Developers copy FFmpeg commands from generic tutorials without understanding the CRF (Constant Rate Factor) quality scale or preset tradeoffs. Drone footage has unique compression challenges - high motion, detailed landscapes, and wide color ranges that generic "web video" settings handle poorly. Additionally, Safari requires specific H.265 tags (`-tag:v hvc1`) that most tutorials omit.

**How to avoid:**
- **For H.264 (universal compatibility):** `ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -movflags +faststart -c:a aac -b:a 128k output.mp4`
- **For H.265 (better compression, modern browsers):** `ffmpeg -i input.mp4 -c:v libx265 -crf 28 -preset medium -tag:v hvc1 -movflags +faststart -c:a aac -b:a 128k output.mp4`
- Always include `-movflags +faststart` for web streaming (enables progressive playback)
- Test CRF values: 23 (H.264) or 28 (H.265) are starting points - review output quality and adjust
- Create multi-resolution versions: 4K source → 1080p, 720p, 480p variants
- Provide BOTH H.264 and H.265 versions with `<video>` source fallbacks

**Warning signs:**
- Compressed video file is still >50% of original size
- Visible compression artifacts in sky/gradient areas of drone footage
- Video won't play in Safari (missing hvc1 tag for H.265)
- Playback doesn't start until full download (missing faststart flag)
- Using only H.265 without H.264 fallback

**Phase to address:**
Phase 1 (Video Optimization & Compression) - Test compression settings with actual drone footage samples before batch processing

---

### Pitfall 3: Hero Background Video Mobile Performance Disaster

**What goes wrong:**
Background video that looks great on desktop destroys mobile performance: slow page loads, excessive data consumption on cellular, autoplay failures, and fullscreen takeover in Safari. Lighthouse mobile scores drop from 90+ to <50, triggering SEO penalties and user abandonment.

**Why it happens:**
Mobile browsers have strict autoplay policies, different resource loading priorities, and limited bandwidth. iOS Safari requires `playsinline` attribute or forces fullscreen mode. Developers test on desktop or WiFi-connected phones, missing real-world cellular performance issues. Loading a 25MB hero video on 3G consumes user's data allowance and delays actual content rendering.

**How to avoid:**
- **Required attributes for mobile autoplay:** `<video autoPlay muted loop playsInline>`
- Set `preload="metadata"` not `preload="auto"` - reduces initial load from full video to ~50KB
- Implement mobile detection to disable hero video on small screens/slow connections:
  ```javascript
  const isMobile = window.innerWidth < 768;
  const isSlowConnection = navigator.connection?.effectiveType === '3g' || navigator.connection?.effectiveType === '2g';
  if (isMobile || isSlowConnection) {
    // Use static poster image instead
  }
  ```
- Create mobile-specific ultra-compressed version (<5MB, 720p, 15fps) if video is essential
- Always provide high-quality poster image as fallback
- Use CSS media queries to hide video and show static background on mobile
- Test on real device with throttled connection (Chrome DevTools: Fast 3G profile)

**Warning signs:**
- Video element missing `playsInline` attribute
- Using `preload="auto"` for background videos
- No mobile/connection detection logic
- Hero video file size >10MB without mobile optimization
- Testing only on desktop or WiFi
- Lighthouse mobile performance score drops after adding video
- Seeing fullscreen video behavior in iOS testing

**Phase to address:**
Phase 1 (Video Implementation) + Phase 3 (Performance Testing) - Must be part of initial video setup with mobile testing BEFORE production deployment

---

### Pitfall 4: Cloudinary Migration URL Breakage

**What goes wrong:**
After migrating gallery images from file-based storage to Cloudinary, production build contains broken image links, missing images, or mixed content warnings. Image transformations work in development but fail in production. Lazy migration strategy leaves gaps where old URLs still exist but files are deleted from local storage.

**Why it happens:**
Developers migrate images but forget to update all URL references across the codebase - hardcoded paths in content, CSS background images, JSON data, or CMS entries. Using "lazy migration" (upload on first request) without proper fallback handling causes 404s when old URLs are accessed. Not configuring `next.config.js` to allow Cloudinary domain causes Next.js Image component failures.

**How to avoid:**
- **BEFORE migration:** Grep entire codebase for image references:
  ```bash
  grep -r "\.jpg\|\.png\|\.jpeg" --include="*.{js,jsx,ts,tsx,json,css,md}"
  ```
- Update `next.config.js` FIRST:
  ```javascript
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  }
  ```
- Maintain URL mapping file during migration: `old-path → cloudinary-public-id`
- Implement 301 redirects or image proxy for old URLs during transition period
- Verify production build output for missing images:
  ```bash
  # After build, check for 404s
  grep -r "missing.*image" .next/
  ```
- Use consistent public ID naming convention: `gallery/quilt-retreat-2024-01.jpg`
- Test complete build + deploy to Vercel preview environment BEFORE production

**Warning signs:**
- Image migration script doesn't generate URL mapping file
- `next.config.js` not updated before migration
- No testing in Vercel preview deployment
- Planning to delete local images immediately after Cloudinary upload
- Mixed local/Cloudinary paths in same component
- No systematic plan for updating CMS or JSON content

**Phase to address:**
Phase 2 (Cloudinary Migration) - Create comprehensive URL audit BEFORE migrating any files

---

### Pitfall 5: Next.js Build Size Exceeds Vercel Limits

**What goes wrong:**
Vercel deployment fails with "Serverless Function has exceeded the unzipped maximum size of 250 MB" or build cache exceeds 1GB limit, preventing deployment. This happens AFTER adding video files to `/public` or including too many high-resolution images in the build output.

**Why it happens:**
Developers place large video files (50-100MB each) in `/public` directory, which are included in deployment bundle. Multiple video versions (4K, 1080p, 720p) for different devices compound the problem. Vercel's 250MB function limit includes all static assets, dependencies, and Next.js build artifacts. The `.next` folder can grow to hundreds of MBs with static exports or large page counts.

**How to avoid:**
- **NEVER put videos in `/public` if they exceed 10MB total** - use external storage (Cloudinary, S3, etc.)
- For absolutely necessary self-hosted videos in `/public`:
  - Compress aggressively (target <5MB per file)
  - Limit to maximum 2-3 video files
  - Use video streaming services for anything larger
- Enable standalone output in `next.config.js` (copies only necessary files):
  ```javascript
  output: 'standalone'
  ```
- For image galleries with hundreds of images, migrate to Cloudinary BEFORE adding videos
- Monitor build size locally:
  ```bash
  du -sh .next/
  ```
- Consider static export (`output: 'export'`) if server-side rendering isn't needed
- Use Vercel's `vercel build` locally to catch size issues before deployment

**Warning signs:**
- `/public` directory exceeds 50MB
- More than 2 video files in static assets
- Not using Cloudinary or external CDN for media
- Build output warnings about large page sizes
- `.next` folder size >200MB locally
- Planning to include both H.264 AND H.265 versions of all videos in deployment

**Phase to address:**
Phase 1 (Video Optimization) - Establish external hosting strategy BEFORE adding videos to codebase

---

### Pitfall 6: Cloudinary Free Tier Quota Exhaustion

**What goes wrong:**
Gallery images load initially, then stop working mid-month due to bandwidth exhaustion. Cloudinary free tier's 25 credits (configurable as storage/bandwidth/transformations) depletes faster than expected, causing broken gallery and potential overage charges or service degradation.

**Why it happens:**
Free tier provides 25 credits total (recent increase from 5 credits in 2025). Developers don't understand credit consumption model: 1 credit = 1GB bandwidth OR 1GB storage OR 1,000 transformations. A gallery with 200 high-resolution images using automatic format optimization and responsive sizing can consume credits rapidly. Each page load with 20 images = 20 transformations. 100 visitors = 2,000 transformations = 2 credits burned.

**How to avoid:**
- **Calculate quota usage BEFORE migration:**
  - Storage: 200 images × 5MB average = 1GB = 1 credit
  - Bandwidth: Estimate monthly pageviews × images per page × avg size
  - Transformations: Pageviews × images per page × transformation versions (original, webp, thumbnails)
- Optimize quota allocation for this use case:
  - **Recommended split:** 10GB storage, 10GB bandwidth, 5,000 transformations
  - Images are one-time uploads (storage is fixed)
  - Gallery traffic is predictable (bandwidth focus)
- Use named transformations (server-side defined) instead of URL-based transformations to reduce transformation count
- Enable Cloudinary auto-format and auto-quality (built into Next Cloudinary by default)
- Implement image loading limits: lazy load, pagination, or thumbnails instead of loading all gallery images at once
- Monitor Cloudinary dashboard weekly
- Set up Cloudinary usage alerts (available in dashboard)

**Warning signs:**
- More than 200 images planned for migration
- High-traffic site (>5,000 monthly visitors)
- No quota calculation performed
- Planning to use dynamic transformations for every image variant
- Generating multiple sizes on-the-fly instead of pre-defined named transformations
- Loading entire gallery (50+ images) on single page without pagination

**Phase to address:**
Phase 2 (Cloudinary Migration) - Calculate quota requirements BEFORE migration, implement usage monitoring from day one

---

### Pitfall 7: Next.js Image Component Misuse with Cloudinary

**What goes wrong:**
Using `next/image` with Cloudinary causes oversized downloads, missing responsive sizing, layout shift (CLS issues), or doubled transformation costs. Images load but performance is worse than plain `<img>` tags. Lighthouse scores DROP after implementing "optimized" image component.

**Why it happens:**
Developers use Next.js Image component with Cloudinary URLs without understanding that this creates DOUBLE optimization - Next.js tries to optimize Cloudinary URLs (which are already optimized), causing conflicts. Setting `sizes="100vw"` everywhere defeats responsive image optimization. Using `<Image fill />` without container constraints causes massive layout shift. Missing `priority` on LCP hero images delays critical rendering.

**How to avoid:**
- **Use `next-cloudinary` components, NOT `next/image` with Cloudinary URLs:**
  ```typescript
  import { CldImage } from 'next-cloudinary';

  <CldImage
    src="gallery/quilt-retreat-2024-01"
    width={800}
    height={600}
    alt="Quilting retreat"
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 800px"
  />
  ```
- Set accurate `sizes` prop based on actual layout:
  - Full-width hero: `sizes="100vw"`
  - Two-column gallery: `sizes="(max-width: 768px) 100vw, 50vw"`
  - Three-column: `sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"`
- For layout="fill", ALWAYS set container with `position: relative` and aspect ratio
- Mark hero/LCP images with `priority={true}` (limit to 1-2 per page)
- Avoid `priority` on below-fold images (wastes preload bandwidth)
- Test real-world CLS in Chrome DevTools → Performance → Web Vitals

**Warning signs:**
- Using `next/image` with `src="https://res.cloudinary.com/..."`
- All images have `sizes="100vw"`
- Using `layout="fill"` without aspect ratio containers
- More than 3 images marked `priority={true}` on single page
- Lighthouse showing CLS >0.1
- Network tab shows images downloading at wrong sizes (e.g., 2000px image for 400px container)

**Phase to address:**
Phase 2 (Cloudinary Migration) + Phase 3 (Performance Optimization) - Use correct components from start, audit sizes/priority in performance phase

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skipping video compression, uploading 4K raw footage | Saves 2-3 hours of FFmpeg learning/processing | Bandwidth exhaustion within days, site suspension, forced upgrade to Pro plan ($20/mo) | Never - compression is mandatory |
| Using same video file for desktop + mobile | Single file to maintain | 3-5x higher mobile bounce rate, poor Lighthouse scores, cellular data waste | Never for hero videos; acceptable for optional background videos with mobile disable |
| Manual Cloudinary migration without URL mapping | Faster initial migration | Broken image links, hours of debugging, potential data loss | Never for production; OK for personal/test sites |
| Loading all gallery images without lazy loading | Simpler implementation | Cloudinary quota exhaustion, slow page loads, poor UX | Acceptable for galleries <10 images |
| Using generic FFmpeg CRF settings without testing | Saves testing time | Either bloated files or quality loss requiring re-encoding | Never for client-facing videos; acceptable for internal/admin videos |
| Deploying without Vercel preview environment testing | Faster to production | Production outages, image 404s, emergency rollbacks | Never - Vercel preview deploys are instant and free |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Cloudinary + Next.js | Using `next/image` with Cloudinary URLs | Use `next-cloudinary` package: `CldImage`, `CldVideoPlayer` components |
| Vercel deployment | Placing videos in `/public` folder | Store videos externally (Cloudinary, S3) or compress to <5MB total |
| Video autoplay iOS | Missing `playsInline` attribute | Always include `<video autoPlay muted loop playsInline>` |
| FFmpeg compression | Using `-crf 18` (too high quality) or missing `-movflags +faststart` | Use `-crf 23` (H.264) or `-crf 28` (H.265) with `-movflags +faststart` |
| Cloudinary free tier | Assuming 25 credits = 25GB bandwidth | Credits are split: storage + bandwidth + transformations. Calculate usage before migration |
| Mobile video loading | Using `preload="auto"` | Use `preload="metadata"` and implement device/connection detection |
| Next.js Image sizing | Using `sizes="100vw"` everywhere | Calculate actual layout sizes: `"(max-width: 768px) 100vw, 50vw"` |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Uncompressed hero background video | Lighthouse mobile score <50, slow initial load, high bounce rate | Compress to <10MB, use `preload="metadata"`, disable on mobile | Immediately on cellular connections; at scale >100 visitors/day |
| Loading all gallery images on page load | Slow page load (>5s), high Cloudinary transformation usage | Implement lazy loading with IntersectionObserver, use thumbnails + lightbox | Gallery >20 images or site >1,000 monthly visitors |
| Using only H.265 without H.264 fallback | Video won't play on older devices/browsers (Safari <11, Firefox <120) | Provide both H.265 and H.264 with `<source>` fallbacks | Affects ~15-20% of users on older devices |
| Excessive preloading with `priority={true}` | Slow FCP/LCP, high bandwidth waste | Limit `priority` to 1 true LCP image per page | >3 priority images causes 1-2s FCP delay |
| Self-hosted video with no CDN | Slow video delivery, high latency for international users | Use Cloudinary video delivery or Vercel Edge caching | International traffic or >500 concurrent users |
| Multiple 4K video variants in build | Deployment fails, 250MB function limit exceeded | Use external video hosting, provide only 1080p max for self-hosted | >2 video files or total video size >30MB |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing Cloudinary API credentials in client-side code | Unauthorized uploads, quota theft, account takeover | Use server-side upload API routes, environment variables only |
| Public Cloudinary upload presets without restrictions | Spam uploads, inappropriate content, quota exhaustion | Use signed uploads or restrict upload presets to server-side only |
| Missing Content-Security-Policy for video sources | XSS vulnerabilities, unauthorized video injection | Add CSP headers allowing only trusted video domains |
| Allowing unlimited video uploads without size validation | Storage exhaustion, denial of service | Validate file sizes server-side before Cloudinary upload |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Autoplay hero video with sound | Jarring experience, immediate mute/leave, accessibility issues | Always `muted`, provide unmute control if audio is important |
| No loading state for video | Blank space, layout shift, user confusion | Show poster image, loading spinner, or static background |
| Missing video fallback image | Blank hero section on mobile/slow connections | Provide high-quality poster image that works as standalone design |
| Gallery loading all images without feedback | Appears broken, users don't wait, high bounce rate | Show skeleton loaders, progressive image loading, or "Loading X of Y" counter |
| Video controls disabled | Users can't pause/replay, accessibility failure | Always provide controls for non-background videos |
| No mobile-optimized video version | High data usage, long load times, user frustration | Detect mobile and serve lower resolution or static image |

## "Looks Done But Isn't" Checklist

- [ ] **Video compression:** Often missing multi-resolution versions - verify 1080p, 720p exist, not just 4K
- [ ] **Mobile video testing:** Often missing real device + throttled connection test - verify on actual iPhone with "Fast 3G" throttling
- [ ] **Cloudinary config:** Often missing `remotePatterns` in next.config.js - verify build succeeds and images load
- [ ] **Video attributes:** Often missing `playsInline` or `muted` - verify autoplay works on iOS Safari
- [ ] **Quota monitoring:** Often missing Cloudinary/Vercel usage tracking - verify dashboard alerts configured
- [ ] **Error boundaries:** Often missing fallback UI for failed video/image loads - verify broken URL shows poster/placeholder
- [ ] **Lazy loading:** Often applied to hero images incorrectly - verify hero image has `priority={true}` and below-fold images lazy load
- [ ] **URL migration mapping:** Often missing comprehensive list - verify all old image URLs have Cloudinary replacements
- [ ] **Performance testing:** Often skipped on mobile - verify Lighthouse mobile score >80 AFTER video/gallery changes
- [ ] **Bandwidth calculation:** Often skipped before launch - verify estimated monthly usage fits within free tier limits

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Bandwidth exhaustion (Vercel) | MEDIUM | 1. Immediately compress videos to <10MB; 2. Redeploy; 3. Upgrade to Pro if mid-month OR wait for reset; 4. Monitor daily |
| Poor video compression quality | LOW | 1. Re-encode with adjusted CRF (lower number = higher quality); 2. Test sample; 3. Batch re-encode; 4. Redeploy |
| Cloudinary quota exhaustion | LOW | 1. Optimize image loading (lazy load, pagination); 2. Switch to named transformations; 3. Wait for monthly reset OR upgrade plan |
| Broken image links after migration | HIGH | 1. Restore old images temporarily; 2. Create URL mapping file; 3. Update all references systematically; 4. Test in preview; 5. Redeploy |
| Build size exceeds Vercel limit | MEDIUM | 1. Move videos to external storage; 2. Enable `output: 'standalone'` in next.config.js; 3. Remove unused dependencies; 4. Redeploy |
| Autoplay failure on iOS | LOW | 1. Add `playsInline muted` attributes; 2. Test in Safari; 3. Redeploy |
| Performance regression (Lighthouse <60) | MEDIUM | 1. Audit with Lighthouse; 2. Fix CLS (image dimensions); 3. Reduce video size; 4. Implement lazy loading; 5. Test mobile; 6. Redeploy |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Vercel bandwidth exhaustion | Phase 1: Video Optimization | Check compressed file sizes <10MB total; calculate estimated monthly bandwidth usage |
| Incorrect video compression | Phase 1: Video Optimization | Visual quality review on actual drone footage; test in Safari + Chrome |
| Hero video mobile performance | Phase 1: Video Implementation + Phase 3: Performance Testing | Lighthouse mobile score >80; test on throttled real device |
| Cloudinary migration URL breakage | Phase 2: Cloudinary Migration | Build succeeds; no 404s in Vercel preview deployment |
| Build size exceeds Vercel limits | Phase 1: Video Optimization | Local build size check: `du -sh .next/` <200MB |
| Cloudinary quota exhaustion | Phase 2: Cloudinary Migration | Quota calculation document; usage monitoring configured |
| Next.js Image component misuse | Phase 2: Cloudinary Migration + Phase 3: Performance | CLS <0.1; Network tab shows correctly sized images |

## Sources

### Vercel Limits & Bandwidth
- [Vercel Limits](https://vercel.com/docs/limits) - Official documentation on bandwidth and function size limits
- [Vercel Pricing](https://vercel.com/pricing) - Free tier 100GB bandwidth specification
- [Breaking down Vercel's 2025 pricing plans](https://flexprice.io/blog/vercel-pricing-breakdown) - Analysis of bandwidth billing
- [Vercel Functions Limitations](https://vercel.com/docs/functions/limitations) - 250MB unzipped function size limit

### Next.js Video Optimization
- [Next.js Videos Guide](https://nextjs.org/docs/app/guides/videos) - Official video optimization recommendations
- [Vercel: Best practices for hosting videos](https://vercel.com/guides/best-practices-for-hosting-videos-on-vercel-nextjs-mp4-gif) - Guidelines for video hosting on Vercel
- [Next.js Build Output Limits](https://vercel.com/guides/what-can-i-do-when-i-run-into-build-output-limits-with-next-js-on-vercel) - Handling large deployments

### Video Compression
- [Creating web optimized video with ffmpeg](https://pixelpoint.io/blog/web-optimized-video-ffmpeg/) - H.264/H.265 compression settings
- [Understanding Rate Control Modes](https://slhck.info/video/2017/03/01/rate-control.html) - CRF and bitrate guidance
- [Compress Drone Video for Web](https://www.winxdvd.com/resize-video/compress-drone-video.htm) - Drone footage specific compression
- [Encoding Drone Video for the Web](https://igis.ucanr.edu/Tech_Notes/Encode_Drone_Video/) - FFmpeg settings for aerial footage

### Cloudinary Integration
- [Cloudinary Migration Guide](https://cloudinary.com/documentation/migration) - Official migration documentation
- [Cloudinary Pricing 2026](https://cloudinary.com/pricing) - Free tier quotas and limits
- [Cloudinary: How quotas work](https://support.cloudinary.com/hc/en-us/articles/203125631-How-does-Cloudinary-count-my-plan-s-quotas-and-what-does-every-quota-mean) - Credit calculation
- [Migrating to Cloudinary case study](https://nearform.com/digital-community/migrating-to-cloudinary/) - Real-world migration experience

### Next.js Image Performance
- [Next.js Image Component Performance](https://pagepro.co/blog/nextjs-image-component-performance-cwv/) - Common mistakes and Core Web Vitals impact
- [Integrating Cloudinary with Next.js](https://cloudinary.com/guides/front-end-development/integrating-cloudinary-with-next-js) - Best practices for next-cloudinary
- [Next.js Lighthouse Performance](https://www.qed42.com/insights/next-js-performance-tuning-practical-fixes-for-better-lighthouse-scores) - Performance optimization checklist

### Mobile Video Performance
- [Background Video Mobile Performance](https://discourse.webflow.com/t/background-media-in-hero-section-slows-mobile-performance-best-practices/325127) - Mobile optimization strategies
- [Autoplay Videos Best Practices](https://ignite.video/en/articles/basics/autoplay-videos) - UX and performance guidelines
- [Video Preload Attribute](https://copyprogramming.com/howto/html-video-preload-metadata-react-code-example) - Metadata vs auto vs none
- [Fast playback with preload](https://web.dev/articles/fast-playback-with-preload) - Google's video preload recommendations

---
*Pitfalls research for: Timber & Threads quilting retreat center website*
*Researched: 2026-02-14*
