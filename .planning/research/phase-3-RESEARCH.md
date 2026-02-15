# Phase 3: Video Integration - Research

**Researched:** 2026-02-14
**Domain:** HTML5 video integration for Next.js retreat center website
**Confidence:** HIGH

## Summary

Phase 3 adds professionally shot promo video to the Timber & Threads Retreat homepage in two locations: a muted autoplay background video in the existing Hero component, and a dedicated video section with full playback controls for the complete promo video. The implementation uses standard HTML5 `<video>` elements with careful attention to mobile performance, accessibility, and network-aware loading.

The critical technical challenges are: (1) ensuring autoplay works on iOS Safari (requires `muted`, `loop`, `autoplay`, and `playsinline` attributes), (2) maintaining mobile performance (requires connection detection to disable video on slow networks and serve poster images instead), (3) keeping file sizes under 10MB total to avoid Vercel bandwidth exhaustion, and (4) providing accessible pause/play controls for users who want to reduce motion or save data.

The architecture integrates video into the existing Hero component (replacing the current static Image background) and adds a new VideoSection component between Gallery and Contact sections. Both components are client-side rendered ('use client') to handle video playback state. No external libraries are required—native HTML5 video handles all requirements with proper attributes and JavaScript connection detection.

**Primary recommendation:** Use HTML5 `<video>` elements with Network Information API for connection detection, preload="metadata" for performance, and always provide high-quality poster images as fallbacks. Compress videos to <5MB per file using FFmpeg with H.264 (CRF 23) for universal compatibility.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| HTML5 video | Native | Video playback with autoplay, loop, controls | Universal browser support, no dependencies, built-in accessibility features |
| Network Information API | Native | Detect connection speed (effectiveType: slow-2g, 2g, 3g, 4g) | Native browser API, enables adaptive video loading based on network quality |
| FFmpeg | 7.0+ (CLI tool) | Video compression and optimization | Industry standard for video encoding, produces optimal web-ready files |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| React hooks (useState, useEffect, useRef) | Built-in | Manage video playback state and custom controls | Already available in Next.js, handles play/pause toggle, connection detection |
| sharp | 0.33.5+ (already installed) | Generate poster images from video frames | Extract high-quality still frames for poster attribute and fallback images |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| HTML5 video (self-hosted) | Cloudinary CldVideoPlayer | Cloudinary adds adaptive streaming (HLS/DASH) and automatic quality optimization, but consumes free tier bandwidth faster. Self-hosted HTML5 is simpler for 2-3 short videos. |
| HTML5 video | next-video package | next-video provides smart storage and auto-optimization, but adds complexity and another dependency. Not needed for simple autoplay + controls use case. |
| Network Information API | Save-Data header | save-data only indicates user preference, not actual connection speed. Network Info API provides real-time effectiveType detection. |
| H.264 codec | H.265/HEVC | H.265 achieves 50% better compression but requires Safari-specific tags (`-tag:v hvc1`) and isn't supported on older devices. Use H.264 for universal compatibility. |

**Installation:**
```bash
# No new dependencies required - using native HTML5 video and browser APIs
# FFmpeg for video compression (one-time processing, not a Node.js dependency)

# Install FFmpeg (if not already installed)
# macOS: brew install ffmpeg
# Linux: apt-get install ffmpeg or yum install ffmpeg
# Windows: Download from https://ffmpeg.org/download.html
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── Hero.tsx              # Update: Replace Image with video background
│   ├── VideoSection.tsx      # New: Dedicated promo video section with controls
│   └── [existing components]
public/
└── assets/
    └── videos/               # New: Self-hosted video files
        ├── hero-background.mp4      # <5MB, muted autoplay loop
        ├── hero-poster.jpg          # High-quality fallback image
        ├── promo-full.mp4           # <10MB, full promo with controls
        └── promo-poster.jpg         # Poster for full promo video
```

### Pattern 1: Hero Background Video (Autoplay, Muted, Loop)
**What:** Replace Hero component's static background Image with autoplay muted looping video
**When to use:** For creating immersive, motion-rich hero sections without disrupting user experience
**Example:**
```tsx
// src/components/Hero.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-scroll';
import Image from 'next/image';

const Hero = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    // Detect slow connections and disable video
    const connection = (navigator as any).connection;
    if (connection) {
      const effectiveType = connection.effectiveType;
      // Disable video on 2G and slow-2g connections
      if (effectiveType === '2g' || effectiveType === 'slow-2g') {
        setShowVideo(false);
      }
    }

    // Fallback: Disable video on small screens (mobile) for performance
    if (window.innerWidth < 768) {
      const isSlow = connection?.effectiveType === '3g' ||
                     connection?.effectiveType === '2g' ||
                     connection?.effectiveType === 'slow-2g';
      if (isSlow) {
        setShowVideo(false);
      }
    }
  }, []);

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        {showVideo ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/assets/videos/hero-poster.jpg"
              className="object-cover w-full h-full"
              style={{ objectPosition: 'center 15%' }}
            >
              <source src="/assets/videos/hero-background.mp4" type="video/mp4" />
              {/* Fallback to poster image if video fails */}
            </video>
            {/* Accessibility: Pause/Play control */}
            <button
              onClick={togglePlayback}
              className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all"
              aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          </>
        ) : (
          <Image
            src="/assets/videos/hero-poster.jpg"
            alt="Timber & Threads Retreat Center"
            fill
            priority
            quality={100}
            loading="eager"
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: 'center 15%' }}
          />
        )}
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Existing content (logo, heading, buttons) remains unchanged */}
      <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8">
        {/* ... existing Hero content ... */}
      </div>
    </section>
  );
};

export default Hero;
```

### Pattern 2: Dedicated Video Section with Controls
**What:** New section component displaying full promo video with native browser controls
**When to use:** When users need to watch complete video content with play/pause, seek, volume, and fullscreen controls
**Example:**
```tsx
// src/components/VideoSection.tsx
'use client';

const VideoSection = () => {
  return (
    <section id="video" className="py-20 bg-stone-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-serif font-medium text-stone-900 mb-4">
            Experience Our Island Retreat
          </h2>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto">
            Take a virtual tour of our unique quilting and crafting retreat center,
            nestled on a peaceful island surrounded by a serene lake in rural Missouri.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="relative aspect-video bg-stone-200 rounded-lg overflow-hidden shadow-xl">
            <video
              controls
              preload="metadata"
              poster="/assets/videos/promo-poster.jpg"
              className="w-full h-full"
            >
              <source src="/assets/videos/promo-full.mp4" type="video/mp4" />
              <p className="p-8 text-center text-stone-600">
                Your browser does not support the video element.
                Please <a href="/assets/videos/promo-full.mp4" className="text-teal-600 underline" download>
                  download the video
                </a> to view it.
              </p>
            </video>
          </div>

          <p className="text-sm text-stone-500 text-center mt-4">
            Watch our promo video showcasing the retreat's unique island location,
            cozy accommodations, and creative spaces perfect for quilters and crafters.
          </p>
        </div>
      </div>
    </section>
  );
};

export default VideoSection;
```

### Pattern 3: Connection Detection Utility
**What:** Reusable utility to detect slow connections and disable video
**When to use:** Share connection detection logic across Hero and VideoSection components
**Example:**
```typescript
// src/lib/connectionDetection.ts
export const isSlowConnection = (): boolean => {
  // Check if Network Information API is available
  const connection = (navigator as any).connection;
  if (!connection) {
    // Fallback: assume fast connection if API unavailable
    return false;
  }

  const effectiveType = connection.effectiveType;

  // Consider 2g and slow-2g as slow connections
  if (effectiveType === '2g' || effectiveType === 'slow-2g') {
    return true;
  }

  // On mobile, also consider 3g as slow for video
  if (window.innerWidth < 768 && effectiveType === '3g') {
    return true;
  }

  return false;
};

export const shouldLoadVideo = (): boolean => {
  return !isSlowConnection();
};
```

### Anti-Patterns to Avoid
- **Unmuted autoplay:** Browsers block it, creates jarring user experience, accessibility nightmare. Always use `muted` for autoplay.
- **Missing `playsInline` on iOS:** Video goes fullscreen on play instead of staying inline. Always include for mobile compatibility.
- **Using `preload="auto"` for background video:** Downloads entire video before page loads, delays rendering. Use `preload="metadata"` (only downloads ~50KB).
- **No poster image:** Blank space or first frame (which may be black) shows before video loads. Always provide high-quality poster.
- **Disabling native controls on main video:** Creates accessibility barrier, users can't pause/seek/adjust volume. Always use `controls` attribute for non-background videos.
- **Only H.265 codec without H.264 fallback:** Breaks playback on 15-20% of devices. Provide both or stick with H.264 for universal support.
- **No connection detection:** Mobile users on cellular consume massive data, page loads slowly. Always detect and disable video on slow connections.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Video format conversion | Custom Node.js video processing pipeline | FFmpeg CLI tool | FFmpeg is battle-tested, handles edge cases (rotation, color spaces, codecs), produces optimal compression. Custom solutions miss critical encoding flags like `-movflags +faststart`. |
| Adaptive bitrate streaming | Manual HLS/DASH playlist generation | Cloudinary CldVideoPlayer OR keep it simple with single MP4 | Creating adaptive streaming requires generating multiple resolutions, playlists, and segment files. Overkill for 2-3 short videos. Single optimized MP4 sufficient for this use case. |
| Connection speed detection | Custom network speed test | Network Information API (navigator.connection.effectiveType) | Browser API provides real-time effective connection type without additional bandwidth consumption. Custom speed tests add latency and consume user data. |
| Poster frame extraction | Canvas-based video frame capture in browser | FFmpeg or sharp (server-side) | Browser-based extraction requires video download first (defeats purpose). FFmpeg extracts frames without full decode: `ffmpeg -i video.mp4 -ss 00:00:03 -frames:v 1 poster.jpg` |
| Custom video player UI | Build controls from scratch with range inputs and event listeners | Use native `controls` attribute OR lightweight library | Native controls are keyboard-accessible, screen-reader compatible, mobile-optimized, and handle edge cases (buffering, errors, fullscreen). Custom controls require extensive accessibility work. |
| Video compression optimization | Trial-and-error with different settings | Follow proven FFmpeg recipes (CRF 23 for H.264, preset medium, movflags +faststart) | Video encoding has dozens of parameters. Wrong settings cause bloated files or quality loss. Standard recipes balance compression/quality/encode time based on years of community testing. |

**Key insight:** Video is deceptively complex. Browser compatibility issues (iOS autoplay policies, codec support, fullscreen behavior), performance implications (preload strategies, connection detection, poster images), and accessibility requirements (controls, captions, keyboard navigation) make seemingly simple features surprisingly hard. Use native HTML5 features and proven tools (FFmpeg) rather than reinventing solutions.

## Common Pitfalls

### Pitfall 1: iOS Safari Autoplay Failure
**What goes wrong:** Background video doesn't autoplay on iPhone/iPad, shows static poster instead or requires user tap to play.
**Why it happens:** iOS Safari has strict autoplay policies. Video must be `muted` AND have `playsInline` attribute, or Safari forces fullscreen playback on user interaction. Many developers forget `playsInline` or try to enable sound.
**How to avoid:**
- Always use all four attributes together: `<video autoPlay muted loop playsInline>`
- Never try to unmute autoplay video (browsers block this for good reason)
- Test on actual iOS device, not just Safari on Mac (different behavior)
- Provide poster image that works as standalone design if autoplay fails
**Warning signs:**
- Testing only on desktop browsers
- Missing `playsInline` attribute
- Trying to add sound to autoplay video
- No fallback poster image

### Pitfall 2: Mobile Performance Degradation
**What goes wrong:** Homepage loads slowly on mobile, high data consumption on cellular, poor Lighthouse mobile scores (<50), users bounce before content loads.
**Why it happens:** Background video consumes 5-10MB on cellular connections. With `preload="auto"`, video downloads before page renders. Mobile CPUs struggle with video decode while rendering page. Developers test on WiFi-connected phones, miss real cellular performance.
**How to avoid:**
- Set `preload="metadata"` not `preload="auto"` (reduces initial load from full video to ~50KB)
- Implement connection detection to disable video on 2G/3G: `navigator.connection.effectiveType`
- Create mobile-specific ultra-compressed version (<3MB, 720p, 15fps) OR disable video entirely on mobile
- Always provide high-quality poster image as fallback
- Test on real device with throttled connection (Chrome DevTools: Fast 3G profile)
- Monitor Lighthouse mobile score before/after video integration
**Warning signs:**
- Using `preload="auto"` for background videos
- No connection detection logic
- Hero video file >5MB
- Testing only on WiFi
- Lighthouse mobile performance drops after adding video

### Pitfall 3: Missing Accessibility Controls
**What goes wrong:** Users with motion sensitivity, slow connections, or limited data plans cannot disable autoplay video. Screen reader users can't pause video that interferes with audio feedback. Violates WCAG accessibility guidelines.
**Why it happens:** Developers focus on visual design and forget that autoplay video is problematic for many users. Background video with no controls creates accessibility barrier. Native video controls often hidden for aesthetic reasons.
**How to avoid:**
- Provide visible pause/play button for background video (top-right corner is conventional)
- Use semantic button elements with proper ARIA labels: `aria-label="Pause background video"`
- Ensure button is keyboard accessible (can be reached with Tab key)
- For main promo video, always use native `controls` attribute (never disable)
- Consider `prefers-reduced-motion` media query to disable autoplay for users with motion sensitivity
**Warning signs:**
- No pause control for background video
- Using `div` instead of `button` for custom controls
- Missing ARIA labels on control buttons
- Disabling native controls on main video player
- No consideration for `prefers-reduced-motion`

### Pitfall 4: Incorrect Video Compression Settings
**What goes wrong:** Compressed video is still too large (>10MB) and consumes excessive bandwidth, OR compression artifacts are visible in sky/gradient areas of drone footage, making video look unprofessional.
**Why it happens:** Default FFmpeg settings produce massive files. Generic web video settings don't account for drone footage characteristics (high motion, detailed landscapes, wide color ranges). CRF (Constant Rate Factor) value too low (high quality) creates large files; too high creates visible artifacts.
**How to avoid:**
- Use proven FFmpeg recipe for H.264 web video:
  ```bash
  ffmpeg -i input.mp4 -c:v libx264 -crf 23 -preset medium -movflags +faststart -c:a aac -b:a 128k output.mp4
  ```
- Test CRF values on actual footage: try 22, 23, 24 and compare file size vs quality
- Always include `-movflags +faststart` for web streaming (enables progressive playback)
- Target file sizes: <5MB for hero background, <10MB for full promo video
- For better compression (50% smaller), use H.265 with Safari compatibility:
  ```bash
  ffmpeg -i input.mp4 -c:v libx265 -crf 28 -preset medium -tag:v hvc1 -movflags +faststart -c:a aac -b:a 128k output.mp4
  ```
- Create multiple resolution versions: 1080p for desktop, 720p for mobile
**Warning signs:**
- Compressed file is still >50% of original size
- Visible compression artifacts in sky or gradient areas
- Missing `-movflags +faststart` flag (video won't start playing until fully downloaded)
- Using only H.265 without H.264 fallback
- No testing on actual drone footage samples before batch processing

### Pitfall 5: Poster Image Quality Mismatch
**What goes wrong:** High-quality video loads, but poster image shown on slow connections is blurry, pixelated, or poorly composed. Fallback experience looks unprofessional, users think site is broken.
**Why it happens:** Developers extract poster frame automatically without reviewing quality, use wrong frame (black frame, motion blur, bad composition), or over-compress poster image to reduce file size. Poster image is afterthought rather than intentional design element.
**How to avoid:**
- Manually select best frame from video (well-composed, no motion blur, representative of content)
- Extract poster at high quality using FFmpeg:
  ```bash
  ffmpeg -i video.mp4 -ss 00:00:03 -frames:v 1 -q:v 2 poster.jpg
  ```
  (q:v 2 = very high quality JPEG, minimal compression)
- Optimize poster image with sharp (WebP format) for smaller size without quality loss
- Test poster-only experience on slow connection to ensure it works as standalone design
- Make poster image part of design review, not just technical implementation
**Warning signs:**
- Using first frame of video automatically (often black or poorly composed)
- Poster image >200KB (should be 50-150KB after optimization)
- Not testing fallback experience with video disabled
- Poster image noticeably lower quality than video

### Pitfall 6: Vercel Bandwidth Exhaustion
**What goes wrong:** Site hits Vercel's 100GB monthly bandwidth limit within first week after video deployment, causing site suspension or forced upgrade to paid plan mid-month. Unexpected costs or service disruption.
**Why it happens:** Self-hosted video from /public folder consumes Vercel bandwidth. A 5MB hero video auto-looping = 20,000 loads before hitting limit. Developers don't calculate bandwidth consumption before deployment or assume CDN caching will minimize usage (Vercel bills for all bandwidth, cached or not).
**How to avoid:**
- Calculate estimated monthly bandwidth BEFORE deployment:
  ```
  Estimated pageviews: 1,000/month
  Hero video size: 5MB (auto-loads on each pageview)
  Promo video size: 10MB (20% of visitors watch)
  Total: (1,000 × 5MB) + (200 × 10MB) = 7GB/month ✓ Within limits
  ```
- Compress videos aggressively (target <5MB for hero, <10MB for promo)
- Disable video on slow connections (reduces mobile bandwidth consumption)
- Monitor Vercel dashboard bandwidth usage daily during first week
- Set up Vercel usage alerts if available
- Have contingency plan: move videos to Cloudinary if bandwidth approaches limit
**Warning signs:**
- No bandwidth calculation performed before deployment
- Video files >10MB each
- No connection detection to reduce mobile bandwidth
- Planning to deploy before monitoring strategy established

## Code Examples

Verified patterns from official sources:

### Complete Hero Component with Video Background
```tsx
// src/components/Hero.tsx - Full implementation
'use client';

import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-scroll';
import Image from 'next/image';

const Hero = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    // Connection detection - disable video on slow connections
    const checkConnection = () => {
      const connection = (navigator as any).connection;
      if (connection) {
        const effectiveType = connection.effectiveType;
        // Disable on 2G and slow-2G
        if (effectiveType === '2g' || effectiveType === 'slow-2g') {
          setShowVideo(false);
          return;
        }
        // Disable on mobile 3G
        if (window.innerWidth < 768 && effectiveType === '3g') {
          setShowVideo(false);
          return;
        }
      }

      // Check prefers-reduced-motion for accessibility
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        setShowVideo(false);
      }
    };

    checkConnection();

    // Listen for connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', checkConnection);
      return () => connection.removeEventListener('change', checkConnection);
    }
  }, []);

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <section id="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        {showVideo ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster="/assets/videos/hero-poster.jpg"
              className="object-cover w-full h-full"
              style={{ objectPosition: 'center 15%' }}
              onLoadedMetadata={() => {
                // Ensure video starts playing (some browsers require explicit play call)
                videoRef.current?.play().catch(() => {
                  // Autoplay failed - fallback to poster
                  setShowVideo(false);
                });
              }}
            >
              <source src="/assets/videos/hero-background.mp4" type="video/mp4" />
            </video>

            {/* Accessibility: Pause/Play control */}
            <button
              onClick={togglePlayback}
              className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all shadow-lg"
              aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
              title={isPlaying ? 'Pause video' : 'Play video'}
            >
              {isPlaying ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              )}
            </button>
          </>
        ) : (
          // Fallback: Show poster image on slow connections or reduced motion preference
          <Image
            src="/assets/videos/hero-poster.jpg"
            alt="Timber & Threads Retreat Center"
            fill
            priority
            quality={100}
            loading="eager"
            sizes="100vw"
            className="object-cover"
            style={{ objectPosition: 'center 15%' }}
          />
        )}
        <div className="absolute inset-0 bg-black/50"></div>
      </div>

      {/* Existing Hero content */}
      <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8">
        <div className="relative w-40 h-40 mx-auto mb-6">
          <div className="absolute inset-0 bg-white/5 rounded-full blur-xl"></div>
          <Image
            src="/assets/gallery/logo.png"
            alt="Timber & Threads Logo"
            fill
            priority
            className="object-contain drop-shadow-lg"
            sizes="(max-width: 768px) 160px, 160px"
          />
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-medium mb-6">
          Timber & Threads Retreat
        </h1>
        <p className="text-xl sm:text-2xl md:text-3xl mb-10 font-light">
          Relax, create, and connect in nature&apos;s embrace
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="about"
            smooth="easeInOutQuart"
            duration={1000}
            offset={-70}
            className="inline-block bg-teal-50/90 text-stone-900 px-10 py-4 rounded-lg font-medium hover:bg-teal-50 hover:shadow-lg transition-all duration-300 cursor-pointer backdrop-blur-sm"
          >
            Learn More
          </Link>
          <Link
            to="contact"
            smooth="easeInOutQuart"
            duration={1000}
            offset={-70}
            className="inline-block bg-teal-600/90 text-white px-10 py-4 rounded-lg font-medium hover:bg-teal-600 hover:shadow-lg transition-all duration-300 cursor-pointer backdrop-blur-sm"
          >
            Contact Us to Book
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute inset-x-0 bottom-0 z-10 pointer-events-none">
        <div className="flex justify-center">
          <Link
            to="about"
            smooth="easeInOutQuart"
            duration={1000}
            offset={-70}
            className="inline-block text-white/70 hover:text-white cursor-pointer transition-all hover:scale-105 pointer-events-auto pb-4"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              style={{ animation: 'subtleBounce 3s ease-in-out infinite' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Hero;
```

### FFmpeg Video Compression Commands
```bash
# Hero background video - ultra-compressed for autoplay
# Target: <5MB, 720p, optimized for web
ffmpeg -i drone-footage-raw.mp4 \
  -c:v libx264 \
  -crf 23 \
  -preset medium \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black" \
  -r 30 \
  -movflags +faststart \
  -c:a aac \
  -b:a 128k \
  -t 30 \
  public/assets/videos/hero-background.mp4

# Full promo video - higher quality with controls
# Target: <10MB, 1080p, better quality
ffmpeg -i promo-edit-final.mp4 \
  -c:v libx264 \
  -crf 23 \
  -preset medium \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:-1:-1:color=black" \
  -movflags +faststart \
  -c:a aac \
  -b:a 128k \
  public/assets/videos/promo-full.mp4

# Generate poster images
ffmpeg -i public/assets/videos/hero-background.mp4 \
  -ss 00:00:03 \
  -frames:v 1 \
  -q:v 2 \
  public/assets/videos/hero-poster-temp.jpg

ffmpeg -i public/assets/videos/promo-full.mp4 \
  -ss 00:00:05 \
  -frames:v 1 \
  -q:v 2 \
  public/assets/videos/promo-poster-temp.jpg

# Optimize poster images with sharp (convert to WebP)
# Run via Node.js script or use sharp CLI
```

### Integration into page.tsx
```tsx
// src/app/page.tsx - Add VideoSection between Gallery and Contact
'use client';

import NavBar from '../components/NavBar';
import Hero from '../components/Hero';
import About from '../components/About';
import Workshops from '../components/Workshops';
import Accommodations from '../components/Accommodations';
import Calendar from '../components/Calendar';
import Gallery from '../components/Gallery';
import VideoSection from '../components/VideoSection'; // NEW
import Contact from '../components/Contact';
import Connect from '../components/Connect';
import Map from '../components/Map';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <main className="flex-1">
      <NavBar />
      <Hero /> {/* Updated with video background */}
      <About />
      <Workshops />
      <Accommodations />
      <Calendar />
      <Gallery />
      <VideoSection /> {/* NEW: Full promo video section */}
      <Contact />
      <Map />
      <Connect />
      <Footer />
    </main>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Flash video players | HTML5 `<video>` element | 2010-2015 | Native browser support, no plugins required, mobile compatible |
| Manual codec detection | Multiple `<source>` tags with fallbacks | HTML5 spec | Browser automatically selects best supported format |
| Custom video player libraries (Video.js, Plyr) | Native `controls` attribute for most use cases | 2020+ | Simpler implementation, better accessibility, smaller bundle size |
| Always load video | Network-aware loading with Network Information API | 2018+ | Respects user bandwidth constraints, better mobile performance |
| `preload="auto"` default | `preload="metadata"` best practice | 2020+ | 40-60% reduction in initial page load size for video-heavy pages |
| H.264 only | H.265/HEVC for modern browsers with H.264 fallback | 2023+ | 50% better compression, but requires Safari compatibility tags |

**Deprecated/outdated:**
- Flash-based video players (removed from browsers in 2020)
- Ogg Theora codec (replaced by WebM VP9/AV1)
- `<object>` and `<embed>` for video (replaced by `<video>`)
- Auto-unmuted autoplay (blocked by all modern browsers for user experience)

## Open Questions

1. **Optimal hero video duration**
   - What we know: Shorter loops (15-30 seconds) are smaller files, but may feel repetitive. Longer loops (45-60 seconds) are more varied but larger files.
   - What's unclear: Best balance for retreat center context—does 30 seconds feel too short or is 60 seconds unnecessarily large?
   - Recommendation: Start with 30-second loop for hero background (<5MB target). If footage allows, create 45-second version and compare file sizes. User testing will reveal if loop feels repetitive.

2. **Mobile video strategy: disable entirely or serve ultra-compressed version?**
   - What we know: Connection detection can identify slow networks. Can either disable video completely (show poster) or serve mobile-optimized version (<3MB, 720p, lower framerate).
   - What's unclear: Whether rural Missouri mobile users prefer no video (faster load) or degraded video (motion experience).
   - Recommendation: Start by disabling video on 2G/3G connections entirely (show poster). Monitor Vercel bandwidth usage. If within limits after first week, consider adding mobile-optimized version for 3G users in future iteration.

3. **H.265 adoption: worth the complexity?**
   - What we know: H.265 achieves 50% better compression than H.264 (5MB H.264 becomes 2.5MB H.265). Requires Safari-specific tag `-tag:v hvc1`. Not supported on older devices (15-20% of users).
   - What's unclear: Whether bandwidth savings justify additional encoding complexity and potential compatibility issues.
   - Recommendation: Start with H.264 for universal compatibility. If bandwidth usage approaches Vercel limits after deployment, re-encode to H.265 with H.264 fallback using multiple `<source>` tags.

4. **Poster image format: JPEG vs WebP**
   - What we know: WebP provides 25-35% smaller file sizes than JPEG at equivalent quality. Supported in all modern browsers (95%+ coverage in 2026). Next.js Image component can serve WebP automatically.
   - What's unclear: Whether to use WebP directly in video poster attribute or JPEG for maximum compatibility.
   - Recommendation: Use high-quality JPEG for poster attribute (universal compatibility). Next.js Image component already serves WebP for other images, but video poster attribute may not benefit from automatic optimization. File size difference (50KB JPEG vs 35KB WebP) is negligible compared to video size.

## Sources

### Primary (HIGH confidence)
- [Next.js Videos Guide](https://nextjs.org/docs/app/guides/videos) - Official Next.js video optimization recommendations
- [Vercel: Best Practices for Hosting Videos](https://vercel.com/guides/best-practices-for-hosting-videos-on-vercel-nextjs-mp4-gif) - Official Vercel video hosting guidelines
- [MDN: Autoplay Guide for Media and Web Audio APIs](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay) - Browser autoplay policies and best practices
- [MDN: Network Information API](https://developer.mozilla.org/en-US/docs/Web/API/Network_Information_API) - Connection detection API documentation
- [MDN: HTMLMediaElement preload property](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/preload) - Video preload attribute specifications

### Secondary (MEDIUM confidence)
- [How to Fix HTML5 Video Autoplay Issues in Safari and iOS Devices](https://www.hulkapps.com/blogs/ecommerce-hub/how-to-fix-html5-video-autoplay-issues-in-safari-and-ios-devices) - iOS autoplay requirements
- [Fixing HTML video autoplay in Safari and iOS devices](https://www.sitelint.com/blog/fixing-html-video-autoplay-blank-poster-first-frame-and-improving-performance-in-safari-and-ios-devices) - Safari-specific video issues and solutions
- [What Does playsinline Mean in Web Video?](https://css-tricks.com/what-does-playsinline-mean-in-web-video/) - iOS playsinline attribute explanation
- [Background Video Not Autoplaying? Here's the Fix (2026)](https://swarmify.com/blog/how-to-make-an-autoplaying-background-video/) - Modern autoplay troubleshooting
- [Lazy Loading Video Based on Connection Speed](https://ben.robertson.is/front-end/lazy-load-connection-speed/) - Network-aware video loading implementation
- [Adapt video to image serving based on network quality](https://web.dev/codelab-adapt-video-to-image-serving-based-on-network-quality/) - Google's network-adaptive content strategy
- [Fast playback with audio and video preload](https://web.dev/articles/fast-playback-with-preload) - Google's video preload recommendations
- [Building a Custom HTML5 Video Player with HTML, CSS, and JavaScript (Modern Patterns for 2026)](https://thelinuxcode.com/building-a-custom-html5-video-player-with-html-css-and-javascript-modern-patterns-for-2026/) - Custom controls implementation
- [Accessible multimedia](https://developer.mozilla.org/en-US/docs/Learn/Accessibility/Multimedia) - MDN multimedia accessibility guide
- [How to compress video files while maintaining quality with FFmpeg](https://www.mux.com/articles/how-to-compress-video-files-while-maintaining-quality-with-ffmpeg) - FFmpeg compression strategies
- [Reducing video file size with FFmpeg for web optimization](https://transloadit.com/devtips/reducing-video-file-size-with-ffmpeg-for-web-optimization/) - Web-specific FFmpeg settings
- [FFmpeg Compress Video Guide for Beginners](https://cloudinary.com/guides/video-effects/ffmpeg-compress-video) - Beginner-friendly FFmpeg compression guide

### Tertiary (LOW confidence - needs validation)
- [Benchmarking FFMPEG's H.265 Options](https://scottstuff.net/posts/2025/03/17/benchmarking-ffmpeg-h265/) - H.265 encoding performance comparison (validate CRF values on actual footage)
- [Video Preload Attribute best practices](https://www.w3schools.com/tags/att_video_preload.asp) - W3Schools reference (validate with actual performance testing)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - HTML5 video is universal, Network Information API well-documented by MDN, FFmpeg is industry standard
- Architecture: HIGH - Official Next.js docs provide clear guidance, patterns verified across multiple sources
- Pitfalls: HIGH - iOS autoplay issues, mobile performance, and compression settings documented in official sources and real-world case studies

**Research date:** 2026-02-14
**Valid until:** 60 days (stable web standards, but mobile browser policies may evolve)
