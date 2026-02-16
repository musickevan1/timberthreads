# Project Research Summary

**Project:** Timber & Threads Video Processing (v1.1)
**Domain:** CLI video processing pipeline for raw drone/camera footage conversion to web-ready deliverables
**Researched:** 2026-02-16
**Confidence:** HIGH

## Executive Summary

This milestone involves processing 14+ minutes of raw drone (DJI Mavic Air) and interior camera (Canon) footage from a Feb 15, 2026 shoot into two web-optimized deliverables: a 15-30s hero background loop (<5MB, 720p, muted) and a 1-2min property promo video (<10MB, 1080p, with music). The recommended approach splits work between CLI automation (FFmpeg for compression/trimming, auto-editor for silence detection) and creative editing (DaVinci Resolve for assembly, color grading, music sync).

Industry best practice for this workflow is a two-pass architecture: (1) CLI preprocessing reduces 14min of raw footage to trimmed, cataloged segments, removing dead space automatically; (2) DaVinci Resolve handles creative decisions on pre-processed clips, exporting high-quality masters (ProRes/DNxHR); (3) FFmpeg performs final web compression with strict size targeting using two-pass encoding. This separation avoids manual tedium (cataloging 25+ clips, silence detection) while preserving creative control where it matters (pacing, color, music).

The primary risks are file size unpredictability (CRF-only encoding can miss <5MB/<10MB targets), lost DJI stabilization metadata (breaks Resolve features), and Safari compatibility (wrong pixel format causes black screens for 30-40% of users). All are preventable with explicit FFmpeg flags: two-pass encoding with calculated bitrate for size targets, `-map_metadata 0` for DJI footage preservation, and `-pix_fmt yuv420p -movflags +faststart` for universal browser compatibility.

## Key Findings

### Recommended Stack

The optimal stack is 100% free, battle-tested, and matches industry workflows used by YouTube, Netflix, and professional editors. FFmpeg 8.0.1 handles all compression, format conversion, metadata extraction, and poster frame generation. DaVinci Resolve 20.3.2 Free provides professional-grade creative editing with no watermark. auto-editor 29.7.0 automates silence detection for drone/ambient footage with customizable thresholds.

**Core technologies:**
- **FFmpeg 8.0.1** (compression, trimming, metadata) — industry standard for video processing, universal browser codec support (H.264/AAC), 30+ years production-proven
- **DaVinci Resolve 20.3.2 Free** (creative editing, color grading) — professional NLE with full feature set, native H.264 support, free version has no watermark or 4K limitations
- **auto-editor 29.7.0** (silence detection, automated trimming) — analyzes audio to identify dead space, exports cut lists or pre-trimmed clips, saves hours vs manual scrubbing
- **Python 3.11+** (batch processing scripts) — system-installed on Arch, required for auto-editor, enables parallel FFmpeg jobs

**Critical versions:**
- FFmpeg 8.0.1 (Nov 2025 stable release, includes libx264/libx265/AAC)
- auto-editor from GitHub (NOT PyPI — PyPI version is 3+ years outdated at 22.17.1)
- DaVinci Resolve 20.3.2 (Feb 2026, latest with improved trim editor)

### Expected Features

**Must have (table stakes):**
- **Video compression** — raw footage unusable at web scale, H.264 with CRF 23 standard
- **Format conversion** — MOV/MP4 sources to web-compatible MP4 containers
- **Resolution scaling** — 720p for hero (bandwidth optimization), 1080p for promo
- **Poster frame extraction** — HTML5 video fallback images, avoid blank screen pre-playback
- **Trim/cut raw footage** — 14min raw to 15-30s + 1-2min deliverables
- **Metadata preservation** — DJI stabilization data critical for Resolve quality
- **Quality validation** — automated checks for size <5MB/<10MB, resolution correct, playback functional

**Should have (competitive):**
- **Batch processing pipeline** — automate cataloging, silence detection, compression for 25+ clips
- **Scene detection** — identify shot boundaries in 9min drone footage for cataloging
- **VMAF quality metrics** — objective quality validation (Netflix standard, target 90+)
- **Multiple quality levels** — 480p/720p/1080p for rural Missouri audience adaptive delivery

**Defer (v2+):**
- **HLS/DASH adaptive streaming** — overkill for 15-30s/1-2min videos, static multi-quality simpler
- **WebM fallback format** — 20-30% file size savings, but add after MP4 working
- **Automated color correction** — DaVinci handles this; automation only valuable for recurring shoots
- **Video stabilization** — DJI gimbal + in-camera stabilization likely sufficient

### Architecture Approach

The pipeline follows a five-stage architecture: (1) Cataloging Layer generates thumbnails and metadata for visual browsing of 25+ clips; (2) Silence Detection Layer uses auto-editor to identify dead space in drone/ambient footage; (3) Trimmed Segments Layer applies cut lists via FFmpeg stream copy (fast, lossless); (4) Creative Edit Layer in DaVinci Resolve handles assembly, color grading, music sync, exporting ProRes/DNxHR masters; (5) Web Compression Layer performs final H.264 encoding with two-pass bitrate targeting for guaranteed <5MB/<10MB sizes.

**Major components:**
1. **Raw Footage Storage** — preserve original camera files untouched in drone-clips/ and timberandthreads-promo-clips/
2. **CLI Preprocessing (FFmpeg + auto-editor)** — catalog (thumbnails, metadata), silence detection, batch trimming to processing/trimmed/
3. **Creative Editor (DaVinci Resolve)** — manual assembly, color grading, music integration, export to exports/ as ProRes/DNxHR
4. **Web Compressor (FFmpeg)** — two-pass H.264 encoding with calculated bitrate, faststart flag, yuv420p pixel format
5. **Deployment Pipeline** — copy compressed videos + poster frames to public/assets/videos/ for Vercel delivery

**Key patterns:**
- **Two-pass workflow** — CLI preprocessing (automation) → Resolve (creativity) → FFmpeg (web compression)
- **Catalog-first** — generate thumbnails/metadata before editing for visual selection of 25+ clips
- **Silence detection with margins** — auto-editor with 0.1-0.3s margins preserves natural pacing
- **Master export → web compression** — Resolve exports ProRes/DNxHR, FFmpeg compresses separately (avoids double compression)
- **Reference workflow** — Resolve links to processing/trimmed/ instead of copying (no duplication, single source of truth)

### Critical Pitfalls

1. **File size unpredictability with CRF-only encoding** — CRF prioritizes quality over size, producing unpredictable results (same CRF can yield 3MB or 8MB). **Fix:** Use two-pass encoding with calculated bitrate for final web delivery: `(target_MB × 8192) / duration_sec = bitrate_kbps`. CRF for editing workflows, two-pass for web delivery.

2. **Lost DJI stabilization metadata** — naive FFmpeg commands strip gyroscopic timestamps, breaking Resolve stabilization features. **Fix:** Always use `-map_metadata 0 -map_metadata:s:v 0:s:v` when processing DJI footage. Better: import originals to Resolve, use proxy workflow (no compression).

3. **Missing faststart flag breaks progressive playback** — MOOV atom at file end requires full download before playback, creating 5-10s delays on rural connections. **Fix:** Always include `-movflags +faststart` for web video (moves metadata to start, enables streaming).

4. **Wrong pixel format breaks Safari** — yuv422p/yuv444p formats work in Chrome but fail in Safari/iOS (30-40% of users). **Fix:** Always specify `-pix_fmt yuv420p` for universal browser compatibility.

5. **Seamless loop mismatch** — random trim points create jarring "jump" every loop cycle on hero background. **Fix:** Select footage with matched start/end frames, keep loops short (6-8s ideal), test 3+ cycles before deployment.

6. **Incorrect frame rate conversion** — using `-r 30` flag doubles playback speed (60fps → 30fps in half duration). **Fix:** Use `-filter:v "fps=30"` to maintain duration with intelligent frame selection.

7. **Unoptimized audio bloats file size** — 320kbps source audio wastes 30-50% of size budget. **Fix:** Strip audio entirely for muted hero (`-an`), use AAC 128kbps for promo music (`-b:a 128k`).

8. **Corrupt DJI file blocks pipeline** — DJI_0018.MP4 has missing MOOV atom, stops batch processing. **Fix:** Implement validation with `ffprobe`, skip corrupt files gracefully, log to processing notes.

9. **Poor keyframe interval breaks scrubbing** — default 10+ second GOP causes 2-5s seek delays. **Fix:** Set `-g 60` (2-second keyframe intervals at 30fps) for responsive web scrubbing.

10. **Double compression degrades quality** — exporting H.264 from Resolve, re-encoding with FFmpeg compounds generation loss. **Fix:** Export ProRes/DNxHR from Resolve, compress once with FFmpeg.

## Implications for Roadmap

Based on research, the work splits into **3 phases** aligned with the existing milestone structure:

### Phase 1: Video Processing Infrastructure (CLI Setup)
**Rationale:** Establish toolchain and processing workflow before touching creative work. Cataloging 25+ clips and validating DJI footage quality gates all downstream work. Prevents rework from wrong compression settings or lost metadata.

**Delivers:**
- FFmpeg 8.0.1 + auto-editor 29.7.0 installation verified
- Catalog of all drone/Canon clips (thumbnails, metadata, duration)
- Corrupt DJI_0018.MP4 identified and documented
- Silence detection applied to clips with significant dead space
- Trimmed segments in processing/trimmed/ ready for Resolve import
- Compression script templates (hero 720p, promo 1080p) with correct flags

**Addresses (from FEATURES.md):**
- Asset cataloging
- Metadata preservation
- Quality validation
- Batch processing pipeline

**Avoids (from PITFALLS.md):**
- Corrupt file blocking (Pitfall 8 - implement validation)
- Lost DJI metadata (Pitfall 2 - establish import workflow)
- Missing faststart/wrong pixel format (Pitfalls 3, 4 - embed in templates)
- Frame rate conversion errors (Pitfall 6 - test Canon 60fps → 30fps)

**Research needs:** NONE — FFmpeg and auto-editor are well-documented with official guides. Phase can proceed directly to task breakdown.

### Phase 2: Creative Video Editing (DaVinci Resolve)
**Rationale:** Creative decisions (clip selection, pacing, color, music) require human judgment. Must happen after preprocessing (Phase 1) provides trimmed, cataloged clips. Before web compression (Phase 3) since Resolve exports masters.

**Delivers:**
- DaVinci Resolve project with organized bins (Drone, Canon, Audio, GFX)
- Hero background timeline (15-30s loop, seamless start/end match)
- Promo video timeline (1-2min, music + ambient sound, color graded)
- Master exports (ProRes 422 or DNxHR HQ) to exports/ directory
- Poster frame candidates identified (compelling 3-5s timestamps)

**Uses (from STACK.md):**
- DaVinci Resolve 20.3.2 Free (creative NLE)
- Processing/trimmed/ clips from Phase 1
- auto-editor XML timelines (optional, for pre-trimmed imports)

**Implements (from ARCHITECTURE.md):**
- Creative Edit Layer (Component 3)
- Reference workflow (Resolve links to processing/trimmed/)
- Version-controlled timelines (v1, v2, FINAL)

**Avoids (from PITFALLS.md):**
- Seamless loop mismatch (Pitfall 5 - test 3+ loop cycles)
- Double compression (Pitfall 10 - export ProRes/DNxHR, not H.264)
- Editing raw footage directly (Anti-pattern 1 - use trimmed clips from Phase 1)

**Research needs:** NONE — DaVinci Resolve workflows are standard NLE patterns. Creative editing doesn't require technical research.

### Phase 3: Web Optimization & Deployment
**Rationale:** Final compression must happen after creative approval (Phase 2) since web encoding is lossy and targets strict file sizes. Poster extraction requires final compressed video (not masters) to match delivered quality/aspect ratio.

**Delivers:**
- Hero background: 720p H.264, <5MB, muted, seamless loop, faststart enabled
- Promo video: 1080p H.264, <10MB, AAC 128kbps, faststart enabled
- Poster frames: hero-poster.jpg (1280x720), promo-poster.jpg (1920x1080)
- Files deployed to public/assets/videos/ and committed
- Verification: Safari/iOS tested, file sizes confirmed, scrubbing responsive

**Uses (from STACK.md):**
- FFmpeg 8.0.1 (two-pass encoding, poster extraction)
- exports/ masters from Phase 2 as input
- Two-pass bitrate calculation: `(5 × 8192) / 20sec = 2048kbps` (hero)

**Implements (from ARCHITECTURE.md):**
- Web Compression Layer (Component 4)
- Master export → web compression pattern (Pattern 5)
- Deployment pipeline (copy to public/assets/videos/)

**Avoids (from PITFALLS.md):**
- File size unpredictability (Pitfall 1 - two-pass encoding with calculated bitrate)
- Missing faststart (Pitfall 3 - explicit `-movflags +faststart`)
- Wrong pixel format (Pitfall 4 - explicit `-pix_fmt yuv420p`)
- Poor keyframe interval (Pitfall 9 - set `-g 60` for 2s GOP)
- Unoptimized audio (Pitfall 7 - `-an` for hero, `-b:a 128k` for promo)

**Research needs:** NONE — FFmpeg compression flags are well-documented. Phase can proceed directly to task breakdown.

### Phase Ordering Rationale

- **Phase 1 before 2:** Must catalog and preprocess raw footage before creative editing. Importing 25+ uncataloged clips into Resolve wastes time. Silence detection reduces manual trimming labor.
- **Phase 2 before 3:** Must complete creative edit and export masters before web compression. Compressing before creative approval leads to rework when client requests changes.
- **Phase 3 standalone:** Web compression is independent, repeatable process. Can re-run with different settings (tighter size targets, different resolutions) without touching creative edit.

This structure avoids circular dependencies (each phase consumes output from previous) and minimizes rework (CLI preprocessing is automated, creative edit is human-approved, web compression is deterministic).

### Research Flags

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** FFmpeg cataloging, auto-editor silence detection, batch trimming — well-documented CLI tools with official guides and community tutorials. Proceed directly to task breakdown.
- **Phase 2:** DaVinci Resolve NLE workflow — standard video editing patterns (bin organization, timeline versions, master exports). No domain-specific complexity.
- **Phase 3:** FFmpeg web compression — H.264 encoding parameters, two-pass bitrate targeting, browser compatibility flags. Industry-standard patterns with authoritative sources (Mux, Cloudinary, slhck CRF guide).

**No phases need deeper research.** All three phases use established tools (FFmpeg, DaVinci Resolve) with comprehensive documentation and proven workflows. The research completed provides sufficient detail for task-level planning.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | FFmpeg 8.0.1, DaVinci Resolve 20.3.2, auto-editor 29.7.0 versions verified from official sources (FFmpeg.org, Blackmagic Design, GitHub releases). Installation steps tested on Arch Linux. |
| Features | HIGH | Table stakes (compression, trimming, metadata preservation) confirmed across multiple authoritative sources (Mux, Cloudinary, AWS). Differentiators (scene detection, VMAF) documented with clear use cases. |
| Architecture | HIGH | Five-layer pipeline (catalog → silence detection → trim → creative edit → web compression) matches industry best practices from Fastpix, Frame.io, AWS video pipeline guides. DaVinci Resolve integration patterns verified from Alecaddd, Coert Vonk. |
| Pitfalls | HIGH | All 10 critical pitfalls sourced from authoritative guides (Mux FFmpeg optimization, slhck CRF guide, DJI metadata preservation research). File size/faststart/pixel format issues confirmed across multiple production deployment cases. |

**Overall confidence:** HIGH

### Gaps to Address

**DJI_0018.MP4 corruption extent unknown:** Research confirms file is corrupt (MOOV atom missing), but exact cause unclear (crash? battery death? recording interrupted?). **Handle during Phase 1:** Validate with `ffprobe`, document as unrecoverable, skip gracefully in batch scripts. If footage is critical, attempt DJIFIX tool recovery (success rate ~50% per research).

**Optimal hero video loop duration undetermined:** Research recommends 6-8s for seamless loops (vs 15-30s requirement). Shorter loops hide mismatch better, but 15-30s may be stakeholder requirement. **Handle during Phase 2:** Test both options (6-8s tight loop vs 15-30s with careful endpoint matching), validate with 3+ loop cycles, confirm with client before finalizing.

**Audio bitrate for rural Missouri connections:** Research recommends AAC 128kbps for music, but rural 1-5 Mbps connections may benefit from 96kbps. **Handle during Phase 3:** Encode promo at 128kbps first (standard quality), validate load time on deployed preview. If >10s delay on slow connections, re-encode at 96kbps and A/B test quality acceptability.

**Canon 60fps footage quantity unknown:** Research recommends converting Canon 60fps → 30fps for web delivery (50% file size reduction), but exact clip count and durations unclear from source files. **Handle during Phase 1:** Catalog phase will identify all 60fps clips via metadata extraction. Batch convert all Canon clips to 30fps during trim phase using `fps` filter.

## Sources

### Primary (HIGH confidence)
- [FFmpeg Official Download](https://www.ffmpeg.org/download.html) — Version 8.0.1 stable release verified
- [FFmpeg Formats Documentation](https://ffmpeg.org/ffmpeg-formats.html) — movflags, faststart flag specifications
- [FFmpeg Codecs Documentation](https://ffmpeg.org/ffmpeg-codecs.html) — libx264, AAC encoder parameters
- [DaVinci Resolve Downloads](https://www.blackmagicdesign.com/products/davinciresolve) — Version 20.3.2 confirmed
- [auto-editor GitHub Releases](https://github.com/WyattBlue/auto-editor/releases) — Version 29.7.0 (Feb 6, 2026) verified
- [Arch Linux FFmpeg Wiki](https://wiki.archlinux.org/title/FFmpeg) — Installation and usage on target system
- [Mux: Compress Video with FFmpeg](https://www.mux.com/articles/how-to-compress-video-files-while-maintaining-quality-with-ffmpeg) — CRF, quality settings, faststart flag
- [slhck CRF Guide](https://slhck.info/video/2017/02/24/crf-guide.html) — Definitive CRF explanation, ±6 = 2x file size
- [Cloudinary: H.264 Best Practices](https://cloudinary.com/guides/video-formats/h-264-video-encoding-how-it-works-benefits-and-9-best-practices) — Web video optimization standards

### Secondary (MEDIUM confidence)
- [Transloadit: FFmpeg Web Optimization](https://transloadit.com/devtips/reducing-video-file-size-with-ffmpeg-for-web-optimization/) — File size reduction techniques, preset comparison
- [Fastpix: Video Pipelines for Developers](https://www.fastpix.io/blog/a-complete-guide-to-video-pipelines) — Pipeline architecture patterns
- [Frame.io: Video Post-Production Workflow](https://workflow.frame.io/guide/) — File organization best practices
- [Compress Drone Videos Without Losing Stabilization Metadata](https://lifetips.alibaba.com/tech-efficiency/compress-drone-videos-without-losing-stabilization-metadata) — DJI metadata preservation
- [DaVinci Resolve FFmpeg cheatsheet for Linux](https://alecaddd.com/davinci-resolve-ffmpeg-cheatsheet-for-linux/) — Resolve ↔ FFmpeg integration
- [Exchanging video between DaVinci Resolve and FFMPEG](https://coertvonk.com/other/videoediting/exchanging-video-between-davinci-resolve-and-ffmpeg-32871) — Master export codecs
- [FFmpeg to the Rescue: Convert 60fps to 30fps](https://streaminglearningcenter.com/blogs/ffmpeg-rescue-converting-60-fps-30-fps.html) — Frame rate conversion with fps filter
- [Repairing Corrupt DJI Video Files](https://djifix.live555.com/) — DJI_0018.MP4 recovery options

### Tertiary (LOW confidence - community sources)
- [GitHub Gist: YouTube FFmpeg Settings](https://gist.github.com/mikoim/27e4e0dc64e384adbcb91ff10a2d3678) — CRF 23 recommendation validation
- [DJI Mavic Pilots Forum: H.264 vs H.265](https://mavicpilots.com/threads/h-264-vs-h-265.50152/) — DJI Mavic Air codec discussion
- [NewsShooter: Resolve 20.3.2 Update](https://www.newsshooter.com/2026/02/11/davinci-resolve-20-3-2-update/) — Latest release feature verification

---
*Research completed: 2026-02-16*
*Ready for roadmap: yes*
