# Feature Research

**Domain:** Web Video Processing Pipeline (Raw Footage to Web-Ready Deliverables)
**Researched:** 2026-02-16
**Confidence:** HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Video Compression** | Web delivery requires smaller file sizes than raw footage | LOW | FFmpeg H.264 with CRF 23 is industry standard. For your 720p hero (<5MB) and 1080p promo (<10MB), this is straightforward. |
| **Format Conversion** | Raw drone/camera formats need conversion to web-compatible MP4 | LOW | DJI Mavic Air outputs MOV/MP4, Canon outputs MP4. Both need re-encoding with web-optimized settings. |
| **Resolution Scaling** | Raw 1080p footage needs downscaling for hero video (720p) and bandwidth optimization | LOW | FFmpeg scale filter. Standard operation, no complexity. |
| **Poster Frame Extraction** | HTML5 video requires poster image (1280x720px) to avoid blank screen before playback | LOW | Extract single frame at ~3-5s mark using FFmpeg. Should be 16:9 ratio, <2MB JPG/PNG. |
| **Trim/Cut Raw Footage** | Raw clips need trimming to usable segments before assembly | LOW | FFmpeg copy codec for lossless cutting. DaVinci Resolve for creative trimming. |
| **Asset Cataloging** | Need to track which raw files map to which outputs | LOW | Simple manifest file (JSON/CSV) mapping source files to processed outputs. |
| **Metadata Preservation** | Drone stabilization metadata must be preserved during compression | MEDIUM | Use FFmpeg 6.0+ with `-map_metadata 0` flag. Critical for DJI footage quality. |
| **Quality Validation** | Verify compressed output meets size/quality requirements | LOW | Automated checks: file size <target, resolution correct, playback functional. |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Multiple Quality Levels** | Adaptive delivery for varying connection speeds (critical for rural Missouri audience) | MEDIUM | Generate 480p, 720p, 1080p versions. Requires bitrate ladder (480p@1.5Mbps, 720p@3Mbps, 1080p@5Mbps). |
| **WebM Fallback Format** | 20-30% smaller files for modern browsers, with MP4 fallback for Safari/iOS | MEDIUM | FFmpeg VP9/AV1 encoding. Requires serving both formats via HTML5 `<source>` elements. |
| **Scene Detection** | Automatically identify shot boundaries in raw footage for easier cataloging | MEDIUM | FFmpeg `scdet` filter or PySceneDetect. Useful for ~14min of raw footage to find usable segments. |
| **VMAF Quality Metrics** | Objective quality validation (Netflix standard) instead of manual review | MEDIUM | FFmpeg VMAF filter compares compressed to source. Target VMAF score 90+ for web delivery. |
| **Thumbnail Strip Generation** | Extract keyframe thumbnails every 5-10s for visual catalog/storyboard | LOW | FFmpeg select filter on I-frames. Helpful for reviewing 14min raw footage quickly. |
| **Automated Color Correction** | Apply LUT for consistent look across drone/Canon footage | MEDIUM | FFmpeg with LUT file. DaVinci Resolve generates LUT, FFmpeg applies during compression. |
| **Batch Processing Pipeline** | Process all 25+ raw clips with single command | LOW | Shell script wrapping FFmpeg commands. Essential for efficiency given clip count. |
| **Video Stabilization** | Post-process any shaky footage (though DJI has in-camera stabilization) | HIGH | DaVinci Resolve or FFmpeg vidstab plugin. Probably unnecessary given drone gimbal, but available if needed. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **HLS/DASH Adaptive Streaming** | "Industry standard for streaming" | Overkill for 15-30s hero loop and 1-2min promo. Adds complexity (chunking, manifest files, server config) for minimal benefit. | Multiple quality static files with simple `<source>` elements. Let browser choose. |
| **Client-Side Video Upload/Processing** | "Let users upload their own videos" | Not in project scope. This milestone processes specific shoot footage, not user-generated content. | Stick to CLI processing workflow for this specific batch. |
| **Real-Time Preview During Compression** | "See output while encoding" | Encoding is non-interactive batch process. Preview slows encoding and adds UI complexity. | Two-stage workflow: DaVinci Resolve for creative preview, FFmpeg for batch compression. |
| **Automated Audio Normalization** | "Ensure consistent volume levels" | Hero video is muted. Promo video audio comes from DaVinci Resolve mix with music. Normalization conflicts with creative intent. | Handle audio levels in DaVinci Resolve during editing, not during compression. |
| **4K Output** | "Future-proof with highest resolution" | Raw footage is 1080p. Upscaling doesn't add quality. Target audience on slow connections. Hero is 720p, promo is 1080p per requirements. | Output at source resolution or lower. 720p/1080p H.264 is the sweet spot. |
| **Lossless Archival Copies** | "Keep uncompressed versions forever" | Raw footage is already archived. Lossless web formats are 10-50x larger with no perceptual benefit. | Archive raw footage separately. Web outputs are lossy H.264 optimized for delivery. |

## Feature Dependencies

```
Asset Cataloging
    ├──requires──> Trim/Cut Raw Footage (need to know what's being cataloged)
    └──enhances──> Scene Detection (automated cataloging)

Video Compression
    ├──requires──> Format Conversion (must convert before compressing)
    ├──requires──> Resolution Scaling (scale then compress)
    ├──requires──> Metadata Preservation (preserve during compression)
    └──enhances──> Quality Validation (validate compressed output)

Poster Frame Extraction
    └──requires──> Video Compression (extract from final compressed video, not raw)

Multiple Quality Levels
    ├──requires──> Video Compression (compression pipeline must support multiple passes)
    └──conflicts──> HLS/DASH Adaptive Streaming (choose one approach, not both)

WebM Fallback Format
    └──requires──> Video Compression (parallel compression pipeline)

VMAF Quality Metrics
    └──enhances──> Quality Validation (automated quality scoring)

Automated Color Correction
    ├──requires──> Trim/Cut Raw Footage (apply LUT to trimmed clips)
    └──conflicts──> Video Stabilization (LUT first, stabilization second, or quality degrades)

Batch Processing Pipeline
    └──enhances──> ALL compression features (automates entire workflow)
```

### Dependency Notes

- **Poster Frame Extraction requires Video Compression:** Extract poster from final compressed output (not raw footage) to ensure poster matches delivered video quality/aspect ratio.
- **Multiple Quality Levels conflicts with HLS/DASH:** Both solve same problem (adaptive delivery). Static multi-quality files are simpler for short-form content.
- **Automated Color Correction conflicts with Video Stabilization:** LUT application changes pixel values. Apply LUT first, then stabilize, or stabilization quality degrades.
- **Metadata Preservation is critical for drone footage:** DJI stabilization metadata must survive compression or video quality degrades significantly.

## MVP Definition

### Launch With (Phase 3: Video Integration)

Minimum viable product — what's needed to validate the concept.

- [x] **Video Compression** — Core requirement. Raw footage unusable at web scale.
- [x] **Format Conversion** — Must convert to web-compatible H.264 MP4.
- [x] **Resolution Scaling** — Hero requires 720p, promo requires 1080p.
- [x] **Poster Frame Extraction** — HTML5 video best practice. Avoid blank screen.
- [x] **Trim/Cut Raw Footage** — 14min raw footage needs cutting to 15-30s hero, 1-2min promo.
- [x] **Asset Cataloging** — Track which raw clips -> which outputs.
- [x] **Metadata Preservation** — Critical for DJI drone footage quality.
- [x] **Quality Validation** — Automated check: size <5MB (hero), <10MB (promo), playback functional.

### Add After Validation (Post-Launch Optimization)

Features to add once core is working and traffic patterns are known.

- [ ] **Multiple Quality Levels** — Add if analytics show high mobile/slow connection traffic (likely given rural Missouri audience).
- [ ] **WebM Fallback Format** — Add if bandwidth costs become significant or load times are slow.
- [ ] **VMAF Quality Metrics** — Add if quality validation needs to be more objective than visual review.
- [ ] **Batch Processing Pipeline** — Add if processing multiple video updates becomes regular workflow.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Scene Detection** — Useful for cataloging large video libraries, but overkill for one-time shoot processing.
- [ ] **Thumbnail Strip Generation** — Nice for visual storyboards, but not needed for simple homepage video.
- [ ] **Automated Color Correction** — DaVinci Resolve handles this during creative editing. Automation only valuable if processing many shoots.
- [ ] **Video Stabilization** — DJI gimbal + in-camera stabilization likely sufficient. Only needed if footage is shaky.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority | Notes |
|---------|------------|---------------------|----------|-------|
| Video Compression | HIGH | LOW | P1 | Non-negotiable. Core requirement. |
| Format Conversion | HIGH | LOW | P1 | Required for web compatibility. |
| Resolution Scaling | HIGH | LOW | P1 | Hero 720p, promo 1080p per spec. |
| Poster Frame Extraction | HIGH | LOW | P1 | Avoid blank screen, LCP optimization. |
| Trim/Cut Raw Footage | HIGH | LOW | P1 | 14min raw -> 15-30s + 1-2min outputs. |
| Asset Cataloging | MEDIUM | LOW | P1 | Essential for workflow tracking. |
| Metadata Preservation | HIGH | MEDIUM | P1 | Critical for DJI footage quality. |
| Quality Validation | HIGH | LOW | P1 | Ensure outputs meet size/quality requirements. |
| Multiple Quality Levels | HIGH | MEDIUM | P2 | Valuable for rural audience, but validate need first. |
| WebM Fallback Format | MEDIUM | MEDIUM | P2 | 20-30% savings, but add after MP4 working. |
| VMAF Quality Metrics | LOW | MEDIUM | P2 | Nice-to-have. Manual review sufficient initially. |
| Batch Processing Pipeline | MEDIUM | LOW | P2 | Efficiency gain, but manual processing fine for one-time shoot. |
| Scene Detection | LOW | MEDIUM | P3 | Useful for large libraries, overkill for single shoot. |
| Thumbnail Strip Generation | LOW | LOW | P3 | Visual convenience, not core need. |
| Automated Color Correction | MEDIUM | MEDIUM | P3 | DaVinci Resolve handles this. Automate only if recurring. |
| Video Stabilization | LOW | HIGH | P3 | Likely unnecessary given DJI gimbal. |

**Priority key:**
- P1: Must have for launch — delivers core functionality
- P2: Should have when possible — improves user experience or efficiency
- P3: Nice to have, future consideration — workflow enhancements

## Processing Pipeline Workflow

Based on research, the standard web video processing workflow is:

### Stage 1: Preparation (DaVinci Resolve)
1. **Import raw footage** — 4 DJI drone clips, 21 Canon clips, 58 CR3 photos
2. **Creative assembly** — Edit hero (15-30s loop) and promo (1-2min tour)
3. **Color grading** — Apply LUTs for consistent look across drone/Canon footage
4. **Audio mixing** — Add music + ambient to promo (hero is muted)
5. **Export intermediate** — High-quality master (ProRes or DNxHD) for archival
6. **Export LUT** — If applying color correction via FFmpeg later

### Stage 2: Compression (FFmpeg CLI)
1. **Trim/Cut** — Extract usable segments from raw footage (if not done in Resolve)
2. **Apply LUT** — Color correction (if automating)
3. **Scale resolution** — 720p for hero, 1080p for promo
4. **Compress to H.264** — CRF 23, preset slow/medium, profile high, level 4.1
5. **Preserve metadata** — `-map_metadata 0` for DJI stabilization data
6. **Extract poster frame** — Single frame at 3-5s mark, 1280x720px, <2MB
7. **Optional: WebM version** — VP9/AV1 encoding for modern browsers
8. **Optional: Multiple qualities** — Generate 480p, 720p, 1080p bitrate ladder

### Stage 3: Validation (Automated Scripts)
1. **File size check** — Hero <5MB, promo <10MB
2. **Resolution check** — Hero 720p, promo 1080p
3. **Playback test** — Ensure video plays without corruption
4. **Optional: VMAF score** — Target 90+ for web quality

### Stage 4: Deployment (Manual)
1. **Copy to output directory** — `public/assets/videos/`
2. **Update asset catalog** — Document source -> output mapping
3. **Commit to git** — Version control for video assets

## Real-World Benchmarks

Based on research, expected compression results:

| Input | Output (H.264 CRF 23) | Compression Ratio | Quality |
|-------|----------------------|-------------------|---------|
| 1080p@30fps, 9min drone | ~100-150MB | ~10:1 | Visually lossless |
| 1080p@60fps, 5min Canon | ~80-120MB | ~8:1 | Visually lossless |
| 720p@30fps, 30s hero | ~3-5MB | ~15:1 | High quality |
| 1080p@30fps, 2min promo | ~8-12MB | ~12:1 | High quality |

**WebM VP9 improvement:** 20-30% smaller files at same quality (e.g., 720p hero ~2-3.5MB)

**Rural connection context:** Target audience may have 1-5 Mbps connections. 5MB hero loads in ~8-40 seconds. Consider 480p fallback if analytics show slow load times.

## Browser Compatibility

| Format | Chrome | Firefox | Safari | Edge | Mobile |
|--------|--------|---------|--------|------|--------|
| MP4 (H.264) | ✅ | ✅ | ✅ | ✅ | ✅ Universal |
| WebM (VP9) | ✅ | ✅ | ❌ | ✅ | ⚠️ Android only |
| WebM (AV1) | ✅ | ✅ | ❌ | ✅ | ⚠️ Limited |

**Recommendation:** Serve MP4 H.264 for universal compatibility. Add WebM VP9 as `<source>` option for modern browsers. Safari/iOS will fallback to MP4 automatically.

## Sources

### Video Processing Pipeline
- [Real-Time Video Pipelines: Techniques & Best Practices - it-jim](https://www.it-jim.com/blog/practical-aspects-of-real-time-video-pipelines/)
- [Understanding Video Pipelines for Developers - Fastpix](https://www.fastpix.io/blog/a-complete-guide-to-video-pipelines)
- [Building a scalable video processing pipeline - AWS](https://aws.amazon.com/blogs/machine-learning/building-a-scalable-and-adaptable-video-processing-pipeline-with-amazon-rekognition-video/)

### FFmpeg Compression
- [How to compress video files with ffmpeg - Mux](https://www.mux.com/articles/how-to-compress-video-files-while-maintaining-quality-with-ffmpeg)
- [Reducing video file size with FFmpeg - Transloadit](https://transloadit.com/devtips/reducing-video-file-size-with-ffmpeg-for-web-optimization/)
- [FFmpeg Compress Video Guide - Cloudinary](https://cloudinary.com/guides/video-effects/ffmpeg-compress-video)
- [Video Transcoding for web with FFmpeg - Medium](https://antongd.medium.com/video-transcoding-and-optimization-for-web-with-ffmpeg-made-easy-511635214df0)

### Drone Footage Compression
- [Compress Drone Video - MiniTool](https://videoconvert.minitool.com/news/compress-drone-video.html)
- [Best Export Settings for Drone Videos - Man and Drone](https://www.mananddrone.com/best-drone-video-export-settings/)
- [Encoding Drone Video for the Web - UC Davis](https://igis.ucanr.edu/Tech_Notes/Encode_Drone_Video/)
- [Compress Drone Videos Without Losing Stabilization Metadata - Alibaba](https://lifetips.alibaba.com/tech-efficiency/compress-drone-videos-without-losing-stabilization-metadata)

### Poster Frame Extraction
- [Extract thumbnails from a video - Mux](https://www.mux.com/articles/extract-thumbnails-from-a-video-with-ffmpeg)
- [App Preview Poster Frame Best Practices - Apptamin](https://www.apptamin.com/blog/app-previews-poster-frames/)
- [Lazy loading video - web.dev](https://web.dev/patterns/web-vitals-patterns/video/video)

### Quality Metrics
- [Making Sense of PSNR, SSIM, VMAF - Visionular](https://visionular.ai/vmaf-ssim-psnr-quality-metrics/)
- [VMAF vs. PSNR vs. SSIM - Fastpix](https://www.fastpix.io/blog/understanding-vmaf-psnr-and-ssim-full-reference-video-quality-metrics)
- [Calculating Video Quality Using NVIDIA GPUs and VMAF - NVIDIA](https://developer.nvidia.com/blog/calculating-video-quality-using-nvidia-gpus-and-vmaf-cuda/)
- [GitHub - Netflix/vmaf](https://github.com/Netflix/vmaf)

### WebM and Format Fallback
- [MP4 vs WebM vs AV1 Guide - Practical Web Tools](https://practicalwebtools.com/blog/video-format-conversion-web-2025-guide)
- [WebM vs. MP4 - Cloudinary](https://cloudinary.com/guides/video-formats/mp4-vs-webm)
- [How to Create WebM videos with FFmpeg - Mux](https://www.mux.com/articles/how-to-create-webm-videos-with-ffmpeg)

### Scene Detection
- [Notes on scene detection with FFMPEG - GitHub](https://gist.github.com/dudewheresmycode/054c8de34762091b43530af248b369e7)
- [PySceneDetect](https://www.scenedetect.com/)
- [12 Best Scene & Cut Detection Tools - OpusClip](https://www.opus.pro/blog/best-scene-cut-detection-tools-for-editors)

### Color Grading and LUTs
- [What is a LUT? Ultimate Guide - StudioBinder](https://www.studiobinder.com/blog/what-is-lut/)
- [How To Apply Color Grading LUTs - Noam Kroll](https://noamkroll.com/how-to-apply-color-grading-luts-professionally-my-workflow-explained/)
- [Best Free LUTs for Color Grading in 2026 - PresetPro](https://www.presetpro.com/best-free-luts-color-grading-2026/)

### Video Stabilization
- [How to Stabilize Action Camera Footage - Medium](https://medium.com/@kashafshahid467/how-to-stabilize-action-camera-footage-in-post-production-10a0afadc49f)
- [Best Video Stabilization Software in 2026 - Movavi](https://www.movavi.com/learning-portal/video-stabilization-software.html)
- [Gyroflow v1.6.3](https://gyroflow.xyz/)

### Asset Management
- [Digital Asset Management Best Practices - Cloudinary](https://cloudinary.com/guides/digital-asset-management/digital-asset-management)
- [Video asset management best practices - LucidLink](https://www.lucidlink.com/blog/video-asset-management)
- [What Is Media Asset Management? - AWS](https://aws.amazon.com/what-is/media-asset-management/)

### Automated Quality Testing
- [AI in Video Testing and Monitoring - Witbe](https://www.witbe.net/articles/ai-real-device-video-testing-monitoring/)
- [Automated Testing for Video Streaming Apps - Fastpix](https://www.fastpix.io/blog/how-to-automate-testing-for-video-streaming-platform)
- [Automated file-based quality control - Telestream](https://www.telestream.net/vidchecker/overview.htm)

---
*Feature research for: Web Video Processing Pipeline (Raw Footage to Web-Ready Deliverables)*
*Researched: 2026-02-16*
*Research confidence: HIGH — FFmpeg and web video standards well-documented across official sources and industry best practices*
