# Stack Research: Video Processing Pipeline

**Domain:** CLI video processing pipeline for raw drone/camera footage conversion to web-ready videos
**Researched:** 2026-02-16
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **FFmpeg** | 8.0.1 "Huffman" (latest stable) | Video transcoding, compression, thumbnail extraction | Industry standard for video processing. Stable release from November 2025. Supports H.264/H.265 encoding via libx264/libx265, AAC audio encoding, poster frame extraction, scene detection, and comprehensive format conversion. Used by YouTube, Netflix, and virtually all video platforms. 30+ years of production use. |
| **DaVinci Resolve** | 20.3.2 (latest) | Creative editing, color grading, music timing | Professional-grade NLE (Non-Linear Editor). Free version has no watermark and includes most features. Native support for H.264/H.265. Handles 4K drone footage efficiently. AI-powered features in v20+ (IntelliScript, Audio Assistant). Industry standard for color grading. Released Feb 2026 with improved trim editor and metadata retention. |
| **Python** | 3.11+ | Scripting for batch processing, CLI tooling | Already system-installed (Arch Linux). Required for auto-editor. Modern async support for parallel FFmpeg jobs. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **auto-editor** | 29.7.0+ (GitHub latest) | Automated silence detection and timeline creation | **Use for initial silence detection**. Analyzes audio to identify quiet sections. Exports XML timeline for DaVinci Resolve. Written in Nim with Python wrapper. No longer published to PyPI - install from GitHub. Latest release: Feb 6, 2026. |
| **libx264** | Included in FFmpeg 8.0.1 | H.264 video encoding | **Primary web video codec**. Universal browser support. CRF 23 balances quality/size. Use `preset: slow` for 10-20% smaller files. Include `-movflags +faststart` for web streaming. |
| **libx265** | Included in FFmpeg 8.0.1 | H.265 (HEVC) encoding (optional) | **Only if DJI footage is H.265**. 50% more efficient than H.264, same bitrate = better quality. More CPU-intensive to decode. Browser support: Safari (all), Chrome 107+, Firefox 120+. Consider H.264 for wider compatibility. |
| **FFmpeg AAC encoder** | Included in FFmpeg 8.0.1 | Audio compression | **Use for all audio tracks**. 128 kbps for music, 64 kbps for speech. Native FFmpeg encoder is production-quality (no need for libfdk_aac). |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **mediainfo** | Video/audio file analysis | `pacman -S mediainfo`. Inspect codec, bitrate, resolution, frame rate of DJI/Canon footage. Verify FFmpeg output specs. CLI: `mediainfo --Inform="Video;%Format% %Width%x%Height% %FrameRate%fps %BitRate/String%"` |
| **ffprobe** | Frame-accurate video inspection | Included with FFmpeg. Query duration, keyframes, scenes. Essential for poster frame extraction: `ffprobe -select_streams v:0 -show_entries stream=duration` |
| **Bash scripts** | Batch processing automation | For loop over `drone-clips/*.mp4` → FFmpeg compress → `output/`. Pattern: Catalog → Trim → Extract Poster → Compress → Export for Resolve. |

## Installation

### Arch Linux (Current System)

```bash
# Core: FFmpeg with all codecs
sudo pacman -S ffmpeg

# Verification tool
sudo pacman -S mediainfo

# Python (likely already installed)
sudo pacman -S python python-pip

# auto-editor (install from GitHub, NOT pip)
# Method 1: Using pipx (recommended for isolated installs)
sudo pacman -S python-pipx
pipx install auto-editor@git+https://github.com/WyattBlue/auto-editor.git

# Method 2: Direct GitHub clone (for development)
git clone https://github.com/WyattBlue/auto-editor.git
cd auto-editor
pip install --user .

# DaVinci Resolve (manual download)
# Download from: https://www.blackmagicdesign.com/products/davinciresolve
# Free version: No watermark, 4K support, full color grading
# Studio version: Not needed for this project (adds HDR, AI features, collaboration)
```

### macOS Alternative

```bash
# Install via Homebrew
brew install ffmpeg
brew install mediainfo
brew install python@3.11

# auto-editor from GitHub
pip3 install git+https://github.com/WyattBlue/auto-editor.git

# DaVinci Resolve: Download .dmg from Blackmagic Design
```

### Windows Alternative

```bash
# FFmpeg: Download from https://www.gyan.dev/ffmpeg/builds/
# Extract to C:\ffmpeg, add C:\ffmpeg\bin to PATH

# Python: https://python.org (ensure "Add to PATH" checked)
# pip install git+https://github.com/WyattBlue/auto-editor.git

# DaVinci Resolve: Download .exe from Blackmagic Design
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **FFmpeg** | HandBrake | If GUI preferred over CLI. HandBrake uses FFmpeg under the hood but adds presets. Slower workflow for batch processing. NOT recommended for scripted pipeline. |
| **FFmpeg** | Adobe Media Encoder | If already paying for Adobe CC. Overkill for this project. $22.99/month. FFmpeg does everything needed for free. |
| **auto-editor** | Manual silence trimming in Resolve | If silence patterns are simple (e.g., only intro/outro). auto-editor saves hours on 9+ min of drone footage with wind/prop noise. |
| **DaVinci Resolve** | Final Cut Pro | If on macOS and already own it ($299 one-time). Similar capabilities but Resolve's free version is more generous. |
| **DaVinci Resolve** | Adobe Premiere Pro | If already paying for Adobe CC. $22.99/month. Resolve Free has equivalent features for this use case. |
| **libx264 (H.264)** | libx265 (H.265) | If DJI footage is already H.265 AND target audience uses modern browsers. Check input format with `mediainfo`. H.264 has wider compatibility. |
| **Python scripts** | Node.js + fluent-ffmpeg | If JavaScript is strongly preferred. FFmpeg CLI is simpler for shell scripts. Node adds dependency overhead. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **pip install auto-editor** | PyPI version is outdated (22.17.1 from April 2022). Project moved development to GitHub. Missing 3+ years of updates including v29.x features. | **Install from GitHub** - `pipx install auto-editor@git+https://github.com/WyattBlue/auto-editor.git` or clone repository. |
| **FFmpeg with libfdk_aac** | Requires compiling FFmpeg from source with non-free flag. Native FFmpeg AAC encoder is production-quality as of 2020+. Adds build complexity for negligible quality gain. | **FFmpeg native AAC encoder** - `-c:a aac -b:a 128k` for music, `-b:a 64k` for speech. |
| **GIF for video previews** | 10-50x larger than equivalent H.264. No compression, no streaming. Outdated format for video content. | **MP4 with H.264** - Better compression, universal support, streaming-capable. |
| **FFmpeg with CRF < 18** | Diminishing returns. CRF 18 is "visually lossless" for most content. Lower CRF creates massive files (4-8x larger) with imperceptible quality gain on typical displays. | **CRF 20-23** - Sweet spot for web video. CRF 23 is YouTube/Vimeo standard. CRF 20 for high-motion drone footage. |
| **FFmpeg ultrafast preset** | Saves encoding time but produces 20-40% larger files at same CRF. Bad compression efficiency. Only use for testing, never production. | **FFmpeg slow/slower preset** - 10-20% smaller files. Encoding time acceptable for one-time compression. `preset: medium` if time-constrained. |
| **FFmpeg without -movflags +faststart** | Video metadata (moov atom) at end of file. Browser must download entire file before playback. Terrible UX for web video. | **Always add -movflags +faststart** - Moves metadata to file start. Enables immediate playback while downloading. |
| **Raw CR3 files in video editing** | DaVinci Resolve doesn't directly support Canon CR3 raw photos. Importing fails or shows black frames. | **Convert CR3 → JPEG/PNG first** - `ffmpeg -i IMG_1234.CR3 -q:v 2 output.jpg` OR use LibRaw's `dcraw_emu -w -T IMG_1234.CR3` for 16-bit TIFF. |
| **H.265 for hero background video** | Older browsers lack support (Chrome <107, Firefox <120). iOS Safari supports it, but decoding is CPU-intensive on older devices. Autoplay may stutter. | **H.264 for maximum compatibility** - Universal browser support. Lower decode cost. Background videos should be <5MB anyway. |
| **Variable frame rate (VFR) output** | Can cause A/V sync issues, timeline problems in editors, playback stuttering. FFmpeg sometimes produces VFR when using filters. | **Constant frame rate (CFR)** - Add `-vsync cfr` or `-r 30` to force constant frame rate. Matches source frame rate (DJI: 30fps, Canon: 60fps). |
| **Audio sample rate ≠ 48kHz** | Web standard is 48kHz. Other rates (44.1kHz, 22.05kHz) may cause compatibility issues with certain browsers/devices. | **Always resample to 48kHz** - `-ar 48000` in FFmpeg. Matches video production standard. |

## Stack Patterns by Use Case

### Pattern 1: Catalog Raw Footage (Discovery Phase)

**Scenario:** Received 4 DJI drone clips + 21 Canon clips. Need to understand what's in each file.

**Tools:**
```bash
# Quick metadata for all files
for file in drone-clips/*.mp4; do
  echo "=== $file ==="
  mediainfo --Inform="Video;%Format% %Width%x%Height% %FrameRate%fps %Duration/String3% %BitRate/String%" "$file"
  mediainfo --Inform="Audio;%Format% %Channels% channels %SamplingRate/String% %BitRate/String%" "$file"
done

# Detailed analysis with ffprobe
ffprobe -v quiet -print_format json -show_format -show_streams "drone-clips/DJI_0001.mp4" > metadata.json
```

**Why:** Before processing, verify codec (H.264 vs H.265), resolution (1080p vs 4K), frame rate (30fps vs 60fps), duration, bitrate. Informs compression strategy.

### Pattern 2: Silence Detection + Timeline Export (Auto-editor)

**Scenario:** 9 minutes of drone footage with prop noise, wind gusts, silence during hovering. Manually scrubbing is tedious.

**Command:**
```bash
# Analyze audio, detect silence, export DaVinci Resolve XML
auto-editor drone-clips/DJI_0001.mp4 \
  --edit audio:threshold=0.03 \
  --margin 0.5sec \
  --export resolve \
  --output-file drone-clips/DJI_0001_timeline.xml

# Options explained:
# --edit audio:threshold=0.03 → Detect audio below 3% volume as silence
# --margin 0.5sec → Keep 0.5s padding before/after non-silent sections
# --export resolve → Output DaVinci Resolve XML timeline
# --output-file → Save XML (import into Resolve)
```

**Workflow:**
1. Run auto-editor on all drone clips → generates XML timelines
2. Import XMLs into DaVinci Resolve → pre-trimmed timelines
3. Manual creative edit: Arrange clips, add music, color grade
4. Export master video from Resolve

**Why:** Saves hours vs manual silence trimming. auto-editor handles detection, Resolve handles creative decisions (music timing, color, transitions).

### Pattern 3: Poster Frame Extraction (FFmpeg)

**Scenario:** Need hero background poster image (fallback before video loads) + thumbnail for promo video.

**Commands:**
```bash
# Method 1: Extract frame at specific time (manual selection)
ffmpeg -ss 00:00:15.5 -i hero-background.mp4 \
  -frames:v 1 \
  -q:v 2 \
  -y public/assets/videos/hero-poster.jpg

# Method 2: Auto-select most representative frame (thumbnail filter)
ffmpeg -i hero-background.mp4 \
  -vf "thumbnail,scale=1920:1080" \
  -frames:v 1 \
  -q:v 2 \
  -y public/assets/videos/hero-poster.jpg

# Method 3: Extract multiple options, pick best manually
ffmpeg -i promo-video.mp4 \
  -vf "select='eq(pict_type\,I)',scale=1920:1080" \
  -frames:v 5 \
  -q:v 2 \
  public/assets/videos/promo-poster-%03d.jpg

# PNG for lossless (if transparency needed, though unlikely for video poster)
ffmpeg -ss 00:00:10 -i hero-background.mp4 \
  -frames:v 1 \
  -y public/assets/videos/hero-poster.png
```

**Quality flag:** `-q:v 2` = highest JPEG quality. Range: 2-31 (2 = best, 31 = worst).

**Why:** `thumbnail` filter uses perceptual analysis to find representative frame. Better than grabbing first frame (often black) or random frame (could be motion blur).

### Pattern 4: Hero Background Video (15-30s loop, <5MB)

**Scenario:** Looping drone footage behind hero section. Muted autoplay, must be <5MB for performance.

**Target specs:**
- Duration: 15-30 seconds
- Resolution: 1280x720 (720p, not 1080p)
- Codec: H.264 (libx264)
- Bitrate: ~1.5 Mbps (achieves <5MB for 30s)
- Audio: Remove (muted background)
- Frame rate: 30fps
- Format: MP4 with faststart

**Command:**
```bash
ffmpeg -i drone-clips/DJI_0001.mp4 \
  -ss 00:01:23 -t 30 \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black" \
  -c:v libx264 \
  -preset slow \
  -crf 23 \
  -maxrate 1.5M -bufsize 3M \
  -an \
  -movflags +faststart \
  -y public/assets/videos/hero-background.mp4

# Options explained:
# -ss 00:01:23 → Start at 1min 23sec (skip intro)
# -t 30 → Extract 30 seconds
# -vf scale=... → Resize to 720p, maintain aspect ratio, pad if needed
# -c:v libx264 → H.264 codec
# -preset slow → Better compression (10-20% smaller files)
# -crf 23 → Quality (lower = better, 23 is web standard)
# -maxrate 1.5M -bufsize 3M → Constrain bitrate to ~1.5 Mbps
# -an → Remove audio (background videos are muted)
# -movflags +faststart → Enable instant playback

# Verify file size
ls -lh public/assets/videos/hero-background.mp4
# Should be ~3-5 MB for 30s
```

**File size calculation:**
- Formula: (Bitrate in Mbps × Duration in seconds) ÷ 8 = File size in MB
- Target: (1.5 Mbps × 30s) ÷ 8 = 5.625 MB
- Actual: ~4-5 MB due to CRF mode (variable bitrate)

**Why 720p not 1080p:** Background videos don't need full HD. 720p at 1.5 Mbps looks excellent for motion-blurred drone footage. Saves 50% file size vs 1080p.

### Pattern 5: Full Promo Video (1-2 min, <10MB, 1080p)

**Scenario:** Property tour video with music + ambient sound. Created in DaVinci Resolve, exported as master file, needs web compression.

**Input:** `promo-master.mov` (exported from DaVinci Resolve, ~500MB ProRes/DNxHD)

**Target specs:**
- Duration: 1-2 minutes
- Resolution: 1920x1080 (1080p)
- Codec: H.264 (libx264)
- Bitrate: ~3-5 Mbps (achieves <10MB for 2min)
- Audio: AAC 128 kbps stereo (music + ambient)
- Frame rate: 30fps (match source)
- Format: MP4 with faststart

**Command:**
```bash
ffmpeg -i promo-master.mov \
  -c:v libx264 \
  -preset slow \
  -crf 20 \
  -maxrate 5M -bufsize 10M \
  -c:a aac -b:a 128k -ar 48000 \
  -movflags +faststart \
  -y public/assets/videos/promo-video.mp4

# Options explained:
# -crf 20 → Higher quality than hero background (20 vs 23)
# -maxrate 5M → Allow up to 5 Mbps bitrate
# -c:a aac -b:a 128k → AAC audio, 128 kbps (good for music)
# -ar 48000 → Resample audio to 48kHz (web standard)

# Verify file size and quality
ls -lh public/assets/videos/promo-video.mp4
mediainfo public/assets/videos/promo-video.mp4
```

**File size estimate:**
- Video: (4 Mbps × 120s) ÷ 8 = 60 MB → compressed to ~8 MB with CRF 20
- Audio: (128 kbps × 120s) ÷ 8 = 1.92 MB
- Total: ~8-10 MB

**Why CRF 20 not 23:** Promo video is primary content (not background). Users will scrutinize quality. CRF 20 provides near-lossless quality with reasonable file size.

### Pattern 6: Batch Compression (Process All Clips)

**Scenario:** 4 drone clips + 21 Canon clips need compression for archival or editing proxy files.

**Bash script:**
```bash
#!/bin/bash
# compress-all.sh - Batch compress raw footage

INPUT_DIR="raw-footage"
OUTPUT_DIR="compressed-footage"
mkdir -p "$OUTPUT_DIR"

# Process all MP4 files
for input_file in "$INPUT_DIR"/*.{mp4,MP4,mov,MOV}; do
  # Skip if file doesn't exist (glob expansion failure)
  [ -e "$input_file" ] || continue

  # Extract filename without path/extension
  filename=$(basename "$input_file")
  name="${filename%.*}"

  echo "Processing: $filename"

  ffmpeg -i "$input_file" \
    -c:v libx264 \
    -preset medium \
    -crf 22 \
    -c:a aac -b:a 128k -ar 48000 \
    -movflags +faststart \
    -y "$OUTPUT_DIR/${name}_compressed.mp4"

  echo "✓ Completed: ${name}_compressed.mp4"
done

echo "All files processed!"
```

**Usage:**
```bash
chmod +x compress-all.sh
./compress-all.sh
```

**Why:** Automates repetitive FFmpeg commands. Use `preset: medium` (not `slow`) for batch jobs to balance time vs quality. CRF 22 is middle ground.

### Pattern 7: DJI Footage Handling (H.265 → H.264 Conversion)

**Scenario:** DJI Mavic Air may record in H.265 (HEVC). Need to convert to H.264 for universal compatibility.

**Check input codec:**
```bash
mediainfo --Inform="Video;%Format%" drone-clips/DJI_0001.mp4
# Output: "HEVC" → H.265
# Output: "AVC" → H.264
```

**If H.265, convert to H.264:**
```bash
ffmpeg -i drone-clips/DJI_0001.mp4 \
  -c:v libx264 \
  -preset slow \
  -crf 20 \
  -c:a copy \
  -movflags +faststart \
  -y drone-clips/DJI_0001_h264.mp4

# -c:a copy → Don't re-encode audio (saves time, no quality loss)
# -crf 20 → Slightly higher quality to compensate for H.265→H.264 conversion
```

**Why convert:** H.265 has 50% better compression, but older browsers lack support (Chrome <107, Firefox <120). H.264 is universally supported. DaVinci Resolve Free also has better H.264 performance on Linux.

### Pattern 8: Canon Interior Clips (60fps → 30fps Conversion)

**Scenario:** Canon shoots 1080p@60fps. Web video typically uses 30fps. Convert for consistency and smaller file size.

**Command:**
```bash
ffmpeg -i canon-clips/MVI_1234.mp4 \
  -vf "fps=30" \
  -c:v libx264 \
  -preset slow \
  -crf 22 \
  -c:a aac -b:a 128k -ar 48000 \
  -movflags +faststart \
  -y canon-clips/MVI_1234_30fps.mp4

# -vf "fps=30" → Frame rate conversion filter (60fps → 30fps)
```

**Alternative: Keep 60fps for slow-motion effects in Resolve**
```bash
# Don't convert frame rate, just compress
ffmpeg -i canon-clips/MVI_1234.mp4 \
  -c:v libx264 \
  -preset slow \
  -crf 22 \
  -c:a aac -b:a 128k -ar 48000 \
  -movflags +faststart \
  -y canon-clips/MVI_1234_60fps.mp4
```

**Why 30fps:** Smaller file size (~40% reduction), matches drone footage frame rate, standard web video. Keep 60fps only if planning slow-motion effects in Resolve.

## FFmpeg Encoding Reference

### CRF (Constant Rate Factor) Guide

| CRF Value | Quality | Use Case | File Size (relative) |
|-----------|---------|----------|----------------------|
| 18 | Visually lossless | Archival, master files | 200% |
| 20 | Excellent | Promo videos, primary content | 140% |
| 22 | Very good | General web video | 100% (baseline) |
| 23 | Good | YouTube/Vimeo standard | 85% |
| 25 | Acceptable | Background videos, lower priority | 60% |
| 28 | Noticeable compression | Not recommended for this project | 40% |

**Rule:** Change of ±6 CRF doubles/halves file size. CRF 23 → 17 = 2x larger. CRF 23 → 29 = 2x smaller.

### Preset Comparison (libx264)

| Preset | Encoding Speed | File Size | Quality at same CRF | When to Use |
|--------|---------------|-----------|---------------------|-------------|
| ultrafast | 10x faster | 140% | Worse | Testing only |
| fast | 2x faster | 115% | Slightly worse | Time-constrained, drafts |
| medium | Baseline | 100% | Baseline | Batch processing, balanced |
| slow | 0.5x slower | 90% | Better | **Recommended for final output** |
| slower | 0.3x slower | 85% | Better | Master files, archival |
| veryslow | 0.1x slower | 82% | Best | Overkill for web video |

**Recommendation:** Use `slow` for final web videos. 10-20% smaller files, acceptable encoding time for one-time compression.

### Audio Bitrate Guide

| Content Type | Bitrate | Channels | Sample Rate | Notes |
|--------------|---------|----------|-------------|-------|
| Speech/Voiceover | 64 kbps | Mono | 48 kHz | Intelligible, small file |
| Ambient sound | 96 kbps | Stereo | 48 kHz | Nature sounds, wind, etc. |
| Music | 128 kbps | Stereo | 48 kHz | **Recommended for promo video** |
| High-quality music | 192 kbps | Stereo | 48 kHz | Overkill for web, use only if source is lossless |

**AAC is efficient:** 128 kbps AAC ≈ 192 kbps MP3 in perceived quality.

### Resolution & Bitrate Targets

| Resolution | Frame Rate | Bitrate (CRF 22-23) | Use Case |
|------------|-----------|---------------------|----------|
| 1280x720 (720p) | 30fps | 1.5-2.5 Mbps | Hero background, mobile-first |
| 1920x1080 (1080p) | 30fps | 3-5 Mbps | Promo video, primary content |
| 1920x1080 (1080p) | 60fps | 5-8 Mbps | Slow-motion capable, overkill for web |
| 3840x2160 (4K) | 30fps | 25-50 Mbps | Archival only, NOT for web delivery |

**Why not 4K for web:** File size explodes (50+ MB for 2min video). Most users watch on 1080p displays. Cloudinary/CDN costs increase. No perceptible quality gain for typical viewing distances.

## Workflow Integration: FFmpeg ↔ DaVinci Resolve

### Recommended Workflow

```
┌─────────────────┐
│ Raw Footage     │
│ - DJI drone 1080p@30fps H.264/H.265
│ - Canon interior 1080p@60fps H.264
│ - Total: ~14 min footage
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 1. Catalog      │  Tools: mediainfo, ffprobe, bash script
│ - Inspect codecs│  Output: metadata.txt with duration, resolution, bitrate
│ - List duration │
│ - Check quality │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 2. Silence Trim │  Tool: auto-editor
│ - Detect silence│  Command: auto-editor --edit audio:0.03 --export resolve
│ - Export XML    │  Output: XML timeline files for Resolve
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 3. Creative Edit│  Tool: DaVinci Resolve
│ (MANUAL)        │  - Import XML timelines (pre-trimmed)
│ - Arrange clips │  - Add music, adjust timing
│ - Add music     │  - Color grading (log → Rec.709)
│ - Color grade   │  - Transitions, titles
│ - Transitions   │  Export: ProRes/DNxHD master (500MB+)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 4. Compress     │  Tool: FFmpeg
│ - Hero: 720p <5MB │ Commands: See Pattern 4 & 5
│ - Promo: 1080p <10MB │ Output: public/assets/videos/
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 5. Extract Posters│ Tool: FFmpeg
│ - Hero poster.jpg│  Command: ffmpeg -vf thumbnail -frames:v 1 -q:v 2
│ - Promo poster.jpg│ Output: public/assets/videos/*.jpg
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Final Assets    │
│ public/assets/videos/
│ ├── hero-background.mp4 (720p, <5MB)
│ ├── hero-poster.jpg (1280x720)
│ ├── promo-video.mp4 (1080p, <10MB)
│ └── promo-poster.jpg (1920x1080)
└─────────────────┘
```

### Why This Split?

**CLI (FFmpeg/auto-editor) handles:**
- Automated tasks: batch compression, silence detection, poster extraction
- Technical requirements: codecs, bitrates, file size targets
- Scriptable: Repeatable, version-controlled bash scripts

**DaVinci Resolve handles:**
- Creative decisions: Music timing, scene selection, pacing
- Color grading: Log → Rec.709, contrast, saturation
- Polish: Transitions, titles, final aesthetic

**Anti-pattern:** Trying to do everything in Resolve (no automation) or everything in FFmpeg (no creative tools).

## CR3 Raw Photo Handling (Bonus)

**Context:** 58 CR3 raw photos from Canon camera. DaVinci Resolve doesn't support CR3 import.

**Solution: Convert CR3 → JPEG/TIFF**

### Option 1: FFmpeg (Fast, Good Quality)

```bash
# Single file
ffmpeg -i IMG_1234.CR3 -q:v 2 IMG_1234.jpg

# Batch convert all CR3 files
for cr3 in raw-photos/*.CR3; do
  name=$(basename "$cr3" .CR3)
  ffmpeg -i "$cr3" -q:v 2 "converted-photos/${name}.jpg"
done
```

**Quality:** `-q:v 2` = highest JPEG quality (range: 2-31).

### Option 2: LibRaw (16-bit TIFF, Best Quality)

```bash
# Install LibRaw (includes dcraw_emu)
sudo pacman -S libraw

# Single file (16-bit TIFF)
dcraw_emu -w -T IMG_1234.CR3
# Output: IMG_1234.tiff

# Batch convert
for cr3 in raw-photos/*.CR3; do
  dcraw_emu -w -T "$cr3"
done
```

**Options:**
- `-w` = Use camera white balance
- `-T` = Output TIFF (default is PPM)

**Why TIFF:** 16-bit color depth, lossless. Ideal for color grading in Resolve. Large files (~50MB each).

### Recommendation

- **For Resolve import:** Convert to JPEG (`ffmpeg -q:v 2`). Faster, smaller files, sufficient quality.
- **For archival/serious color work:** Convert to TIFF (`dcraw_emu -T`). Maximum quality, larger files.

## Version Compatibility

| Package | Version | Compatible With | Notes |
|---------|---------|-----------------|-------|
| FFmpeg | 8.0.1 "Huffman" | All Linux, macOS, Windows | Released Nov 2025. Stable release, recommended for production. Includes libx264, libx265, AAC encoder. |
| auto-editor | 29.7.0+ (GitHub) | Python 3.11+ | Latest: Feb 6, 2026. **Install from GitHub, not PyPI**. PyPI version (22.17.1) is outdated by 3+ years. |
| DaVinci Resolve | 20.3.2 (Free) | Linux, macOS, Windows | Released Feb 2026. Free version has no watermark, 4K support. Studio version ($295) not needed. |
| mediainfo | Latest (Arch repo) | CLI tool, universal | No version conflicts. Install via `pacman -S mediainfo`. |
| Python | 3.11+ | Required for auto-editor | Likely already installed on Arch. Check: `python --version`. |
| libx264 | Included in FFmpeg | FFmpeg encoder | No separate install needed. Part of FFmpeg package. |
| LibRaw | 0.21+ (for CR3 support) | Arch Linux, macOS (Homebrew) | For CR3 → TIFF conversion. Optional if using FFmpeg for CR3. |

**Breaking changes to watch:**
- **FFmpeg 8.x → 9.x:** No breaking changes expected. Codec APIs stable.
- **auto-editor:** Major version jumps (e.g., 29.x → 30.x) may change CLI flags. Check changelog.
- **DaVinci Resolve 20 → 21:** Free version feature set unlikely to change. Paid Studio features added.

## Configuration Checklist

### FFmpeg Test Commands

Verify FFmpeg installation and codec support:

```bash
# Check FFmpeg version
ffmpeg -version
# Should show: ffmpeg version 8.0.1 Copyright (c) 2000-2025...

# Check libx264 support
ffmpeg -codecs | grep 264
# Should show: DEV.LS h264 (multiple encoders)

# Check libx265 support (for H.265)
ffmpeg -codecs | grep 265
# Should show: DEV.LS hevc / h265

# Check AAC encoder
ffmpeg -encoders | grep aac
# Should show: aac (multiple encoders including native)

# Test encode (quick smoke test)
ffmpeg -f lavfi -i testsrc=duration=10:size=1920x1080:rate=30 \
  -c:v libx264 -preset medium -crf 23 \
  -movflags +faststart \
  test-output.mp4

# Verify output
ls -lh test-output.mp4
ffprobe test-output.mp4
```

### auto-editor Test Command

```bash
# Check auto-editor installation
auto-editor --version
# Should show: auto-editor version 29.7.0 or newer

# Test on sample video (create test video first)
ffmpeg -f lavfi -i testsrc=duration=30:size=1920x1080:rate=30 \
  -f lavfi -i sine=frequency=1000:duration=15 \
  -f lavfi -i anullsrc=duration=15 \
  -filter_complex "[1][2]concat=n=2:v=0:a=1[a]" -map 0:v -map "[a]" \
  -c:v libx264 -preset fast -crf 23 -c:a aac \
  test-audio.mp4

# Run auto-editor
auto-editor test-audio.mp4 --edit audio:0.03
# Should detect 15s of silence and trim video to ~15s
```

### DaVinci Resolve Setup

1. **Download:** https://www.blackmagicdesign.com/products/davinciresolve
2. **Choose Free version** (NOT Studio unless you need advanced features)
3. **Linux installation:**
   ```bash
   # Extract downloaded .zip
   unzip DaVinci_Resolve_*_Linux.zip

   # Run installer
   sudo ./DaVinci_Resolve_*_Linux.run

   # Launch
   /opt/resolve/bin/resolve
   ```
4. **Import test:** Drag test-output.mp4 into Media Pool → should play without errors
5. **H.265 test:** If DJI footage is H.265, import a clip → verify smooth playback (not choppy)

### Directory Structure

Recommended project structure:

```
/home/evan/Projects/clients/timberandthreads/
├── raw-footage/
│   ├── drone-clips/
│   │   ├── DJI_0001.mp4
│   │   ├── DJI_0002.mp4
│   │   └── ... (4 clips total)
│   ├── canon-clips/
│   │   ├── MVI_1234.mp4
│   │   ├── MVI_1235.mp4
│   │   └── ... (21 clips total)
│   └── raw-photos/
│       ├── IMG_1020.CR3
│       └── ... (58 photos total)
├── processed-footage/
│   ├── compressed/  (FFmpeg output for archival)
│   ├── timelines/  (auto-editor XML files)
│   └── converted-photos/  (CR3 → JPEG/TIFF)
├── resolve-projects/
│   └── timberandthreads-promo.drp  (DaVinci Resolve project)
├── scripts/
│   ├── catalog.sh  (mediainfo scan)
│   ├── compress-all.sh  (batch FFmpeg)
│   ├── extract-posters.sh  (poster frame extraction)
│   └── convert-cr3.sh  (CR3 → JPEG conversion)
└── public/assets/videos/  (final web-ready output)
    ├── hero-background.mp4
    ├── hero-poster.jpg
    ├── promo-video.mp4
    └── promo-poster.jpg
```

### Bash Script Template

Save as `scripts/catalog.sh`:

```bash
#!/bin/bash
# catalog.sh - Generate metadata report for all raw footage

OUTPUT_FILE="footage-catalog.txt"
echo "Timber & Threads Footage Catalog" > "$OUTPUT_FILE"
echo "Generated: $(date)" >> "$OUTPUT_FILE"
echo "======================================" >> "$OUTPUT_FILE"

echo "" >> "$OUTPUT_FILE"
echo "DRONE CLIPS (DJI Mavic Air)" >> "$OUTPUT_FILE"
echo "----------------------------" >> "$OUTPUT_FILE"
for file in raw-footage/drone-clips/*.{mp4,MP4,mov,MOV}; do
  [ -e "$file" ] || continue
  echo "" >> "$OUTPUT_FILE"
  echo "File: $(basename "$file")" >> "$OUTPUT_FILE"
  mediainfo --Inform="Video;  Video: %Format% %Width%x%Height% %FrameRate%fps\n  Duration: %Duration/String3%\n  Bitrate: %BitRate/String%" "$file" >> "$OUTPUT_FILE"
  mediainfo --Inform="Audio;  Audio: %Format% %Channels% channels %SamplingRate/String% %BitRate/String%" "$file" >> "$OUTPUT_FILE"
done

echo "" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "CANON CLIPS (Interior)" >> "$OUTPUT_FILE"
echo "----------------------" >> "$OUTPUT_FILE"
for file in raw-footage/canon-clips/*.{mp4,MP4,mov,MOV}; do
  [ -e "$file" ] || continue
  echo "" >> "$OUTPUT_FILE"
  echo "File: $(basename "$file")" >> "$OUTPUT_FILE"
  mediainfo --Inform="Video;  Video: %Format% %Width%x%Height% %FrameRate%fps\n  Duration: %Duration/String3%\n  Bitrate: %BitRate/String%" "$file" >> "$OUTPUT_FILE"
  mediainfo --Inform="Audio;  Audio: %Format% %Channels% channels %SamplingRate/String% %BitRate/String%" "$file" >> "$OUTPUT_FILE"
done

echo "" >> "$OUTPUT_FILE"
echo "======================================" >> "$OUTPUT_FILE"
echo "Catalog complete! See: $OUTPUT_FILE"
cat "$OUTPUT_FILE"
```

## Cost Analysis

| Item | Cost | Notes |
|------|------|-------|
| **FFmpeg** | $0 (free, open source) | LGPL/GPL license. No restrictions for commercial use. |
| **DaVinci Resolve Free** | $0 (free, proprietary) | No watermark. 4K support. Full color grading. Studio version ($295) not needed. |
| **auto-editor** | $0 (free, open source) | Public domain (Unlicense). |
| **mediainfo** | $0 (free, open source) | BSD-2-Clause license. |
| **Python** | $0 (free, open source) | PSF license. Already system-installed. |
| **LibRaw (optional)** | $0 (free, open source) | LGPL/CDDL license. |
| **Total** | **$0** | No subscription fees. No cloud rendering costs. |

**Comparison:**
- **Adobe Premiere Pro:** $22.99/month = $275/year
- **Adobe Media Encoder:** Included with Premiere, but requires CC subscription
- **Final Cut Pro:** $299 one-time (macOS only)
- **FFmpeg + DaVinci Resolve Free:** $0 (cross-platform, full-featured)

**Verdict:** Recommended stack is 100% free and matches/exceeds paid alternatives for this use case.

## Confidence Assessment

| Recommendation | Confidence | Source | Notes |
|----------------|------------|--------|-------|
| **FFmpeg 8.0.1 for compression** | HIGH | [FFmpeg.org changelog](https://github.com/FFmpeg/FFmpeg/blob/master/Changelog), [Official download](https://www.ffmpeg.org/download.html), [Arch Wiki](https://wiki.archlinux.org/title/FFmpeg) | Latest stable release (Nov 2025). Industry standard. Verified version number from official sources. |
| **libx264 H.264 encoding** | HIGH | [Mux FFmpeg guide](https://www.mux.com/articles/how-to-compress-video-files-while-maintaining-quality-with-ffmpeg), [Cloudinary H.264 best practices](https://cloudinary.com/guides/video-formats/h-264-video-encoding-how-it-works-benefits-and-9-best-practices) | Universal browser support. Web standard. CRF 20-23 confirmed across multiple sources. |
| **-movflags +faststart** | HIGH | [FFmpeg formats docs](https://ffmpeg.org/ffmpeg-formats.html), [Pixplicity faststart guide](https://code.pixplicity.com/ffmpeg/faststart/) | Essential for web video. Moves moov atom to file start. Confirmed in official docs. |
| **auto-editor from GitHub** | HIGH | [auto-editor releases](https://github.com/WyattBlue/auto-editor/releases), [PyPI outdated warning](https://pypi.org/project/auto-editor/22.17.1/) | Latest version 29.7.0 (Feb 6, 2026) confirmed. PyPI version (22.17.1, April 2022) is 3+ years outdated. |
| **DaVinci Resolve 20.3.2** | HIGH | [Blackmagic Design support](https://www.blackmagicdesign.com/support/), [NewsShooter update article](https://www.newsshooter.com/2026/02/11/davinci-resolve-20-3-2-update/) | Latest version (Feb 2026) confirmed. Free version capabilities verified. |
| **CRF 23 for web video** | HIGH | [CRF Guide by slhck](https://slhck.info/video/2017/02/24/crf-guide.html), [YouTube gist settings](https://gist.github.com/mikoim/27e4e0dc64e384adbcb91ff10a2d3678) | YouTube/Vimeo standard. Multiple authoritative sources agree. |
| **Preset: slow for final output** | HIGH | [FFmpeg x264 guide](https://ffmpeg.party/guides/x264/), [Transloadit optimization guide](https://transloadit.com/devtips/reducing-video-file-size-with-ffmpeg-for-web-optimization/) | 10-20% smaller files confirmed. Encoding time acceptable for one-time compression. |
| **AAC 128 kbps for music** | MEDIUM | [FFmpeg codecs docs](https://ffmpeg.org/ffmpeg-codecs.html), [Voukoder AAC discussion](https://www.voukoder.org/forum/thread/476-ffmpeg-aac-cbr/) | Standard web audio bitrate. Native FFmpeg AAC encoder is production-quality (verified in docs). |
| **720p for hero background** | MEDIUM | [Next.js video optimization](https://nextjs.org/docs/app/building-your-application/optimizing/videos), Web search (multiple sources) | Best practice inference from file size constraints (<5MB for 30s). Not explicitly stated in official docs but widely recommended. |
| **DJI H.265 → H.264 conversion** | MEDIUM | [DJI Mavic Air forums](https://mavicpilots.com/threads/h-264-vs-h-265.50152/), [DPReview DJI article](https://www.dpreview.com/news/1769061312/davinci-resolves-latest-version-adds-more-than-100-new-features) | DJI Mavic Air 2 supports H.265. Browser compatibility issues confirmed. Conversion recommended for wider support. |
| **60fps → 30fps for web** | LOW | Web search (best practices inference) | File size reduction (~40%) is logical, but 60fps web video is viable for modern browsers. User preference. |
| **LibRaw for CR3 conversion** | MEDIUM | [LibRaw GitHub issue #202](https://github.com/LibRaw/LibRaw/issues/202), [FastRawViewer CR3 support](https://www.fastrawviewer.com/blog/FastRawViewer-1-5-1) | LibRaw has supported CR3 since 2019. FFmpeg also works for CR3 → JPEG. Either option viable. |

## Sources

### Official Documentation (HIGH confidence)
- [FFmpeg Official Download](https://www.ffmpeg.org/download.html) - Version 8.0.1 stable release
- [FFmpeg Changelog](https://github.com/FFmpeg/FFmpeg/blob/master/Changelog) - Version history, features
- [FFmpeg Formats Documentation](https://ffmpeg.org/ffmpeg-formats.html) - movflags, container options
- [FFmpeg Codecs Documentation](https://ffmpeg.org/ffmpeg-codecs.html) - libx264, AAC encoder options
- [Arch Linux FFmpeg Wiki](https://wiki.archlinux.org/title/FFmpeg) - Installation, usage
- [DaVinci Resolve Downloads](https://www.blackmagicdesign.com/products/davinciresolve) - Latest version
- [DaVinci Resolve What's New](https://www.blackmagicdesign.com/products/davinciresolve/whatsnew) - Feature changelog
- [auto-editor GitHub Releases](https://github.com/WyattBlue/auto-editor/releases) - Version 29.7.0 (Feb 6, 2026)

### Technical Guides (MEDIUM-HIGH confidence)
- [Mux: Compress Video with FFmpeg](https://www.mux.com/articles/how-to-compress-video-files-while-maintaining-quality-with-ffmpeg) - Quality settings, CRF guide
- [Cloudinary: H.264 Best Practices](https://cloudinary.com/guides/video-formats/h-264-video-encoding-how-it-works-benefits-and-9-best-practices) - Web video optimization
- [Transloadit: FFmpeg Web Optimization](https://transloadit.com/devtips/reducing-video-file-size-with-ffmpeg-for-web-optimization/) - File size reduction techniques
- [slhck CRF Guide](https://slhck.info/video/2017/02/24/crf-guide.html) - Definitive CRF explanation
- [FFmpeg x264 Encoder Guide](https://ffmpeg.party/guides/x264/) - Preset comparison, settings
- [Pixplicity: Faststart Flag](https://code.pixplicity.com/ffmpeg/faststart/) - Web streaming optimization
- [Mux: Extract Thumbnails](https://www.mux.com/articles/extract-thumbnails-from-a-video-with-ffmpeg) - Poster frame extraction
- [OTTVerse: FFmpeg Thumbnails](https://ottverse.com/thumbnails-screenshots-using-ffmpeg/) - Thumbnail strategies

### Community Sources (MEDIUM confidence)
- [GitHub Gist: YouTube FFmpeg Settings](https://gist.github.com/mikoim/27e4e0dc64e384adbcb91ff10a2d3678) - CRF 23, preset recommendations
- [DJI Mavic Pilots Forum: H.264 vs H.265](https://mavicpilots.com/threads/h-264-vs-h-265.50152/) - DJI codec discussion
- [Blackmagic Forum: DaVinci Resolve 19](https://forum.blackmagicdesign.com/viewtopic.php?f=21&t=206895) - Version history
- [NewsShooter: Resolve 20.3.2 Update](https://www.newsshooter.com/2026/02/11/davinci-resolve-20-3-2-update/) - Latest release details

### Package Repositories (HIGH confidence for versions)
- [Arch Linux FFmpeg Package](https://archlinux.org/packages/extra/x86_64/ffmpeg/) - Version 8.0.1-6 confirmed
- [PyPI auto-editor](https://pypi.org/project/auto-editor/22.17.1/) - Outdated version (don't use)
- [auto-editor Install Guide](https://auto-editor.com/installing) - Official installation instructions

---

*Stack research for: Timber & Threads Video Processing Pipeline*
*Researched: 2026-02-16*
*Focus: CLI tools for raw footage → web-ready videos*
