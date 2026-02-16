# Pitfalls Research

**Domain:** Video compression pipeline for web delivery (drone/camera footage to web-ready video)
**Researched:** 2026-02-16
**Confidence:** HIGH

> **Note:** This document focuses on **video processing pipeline pitfalls** (FFmpeg compression, DaVinci Resolve workflows, file size targeting). For broader project pitfalls (Vercel deployment, Cloudinary migration, Next.js integration), see the original general pitfalls research.

## Critical Pitfalls

### Pitfall 1: File Size Unpredictability with CRF-Only Encoding

**What goes wrong:**
Using CRF (Constant Rate Factor) alone to hit specific file size targets (<5MB hero, <10MB promo) produces unpredictable results. A CRF 23 setting might yield 3MB for one clip and 8MB for another with identical settings. This makes it impossible to reliably hit tight file size constraints without test encoding every clip.

**Why it happens:**
CRF prioritizes constant quality over constant bitrate. The resulting file size varies dramatically based on content complexity—drone panning shots compress better than detailed foliage or water textures. You cannot reliably estimate the resulting bitrate for a given CRF without analyzing each individual source. A change of ±6 in CRF should result in about half/double the file size, but the baseline varies per clip.

**How to avoid:**
Use **two-pass encoding with target bitrate** for final web delivery when file size constraints are non-negotiable:

```bash
# Calculate target bitrate from file size constraint
# Formula: (target_size_MB × 8192) / duration_seconds = bitrate_kbps
# Example: 5MB in 20 seconds = (5 × 8192) / 20 = 2048 kbps

# Pass 1 (analysis)
ffmpeg -i input.mp4 -c:v libx264 -b:v 2048k -pass 1 -an -f null /dev/null

# Pass 2 (encoding)
ffmpeg -i input.mp4 -c:v libx264 -b:v 2048k -pass 2 \
  -c:a aac -b:a 128k -movflags +faststart output.mp4
```

**Workflow recommendation:**
- Use **CRF** for DaVinci Resolve editing workflows (quality matters more than size)
- Use **two-pass** for final web compression (size constraints non-negotiable)
- Start with CRF + preset; switch to 2-pass only when you must hit a file size

**Warning signs:**
- Test encodes at CRF 23 vary by >30% file size across clips
- Client asks "can you guarantee it's under X MB?"
- Multiple re-encode rounds trying to dial in CRF value
- Using CRF for final delivery with strict file size targets

**Phase to address:**
Phase 1 (Video Processing Setup) — establish two-pass encoding for web delivery targets, CRF for intermediate/archival formats

---

### Pitfall 2: Losing DJI Stabilization Metadata During Compression

**What goes wrong:**
Compressing DJI drone footage with naive FFmpeg commands or consumer apps (iMovie, online converters) strips gyroscopic timestamps, acceleration vectors, lens distortion profiles, and electronic image stabilization parameters. This breaks advanced stabilization features in DaVinci Resolve and makes footage unusable for advanced color grading or stabilization workflows.

**Why it happens:**
FFmpeg doesn't preserve metadata by default. Consumer tools prioritize file size reduction and silently discard non-video streams. DJI embeds rich stabilization metadata that requires explicit flags to retain during transcoding. FFmpeg 6.0+ requires explicit `-map_metadata` flags to avoid losing this critical data.

**How to avoid:**
**Always preserve metadata when processing DJI footage:**

```bash
# Correct approach — explicitly preserve metadata
ffmpeg -i DJI_0001.MP4 -c:v libx264 -crf 18 -preset medium \
  -map_metadata 0 -map_metadata:s:v 0:s:v \
  -c:a copy -movflags +faststart output.mp4
```

**Verification workflow:**
1. **Never compress original DJI files before importing to DaVinci Resolve**
2. Use DaVinci's proxy/optimized media workflow instead (no metadata loss)
3. If compression is necessary (archival, transfer), test one clip first
4. Verify stabilization works in Resolve before batch processing
5. Retain original files until stabilized playback confirmed

**Bottom line:**
If your editing workflow uses proxy media like DaVinci Resolve's optimized media, compressing originals adds zero benefit and introduces risk. Don't do it.

**Warning signs:**
- DaVinci Resolve stabilization features grayed out or produce artifacts
- Footage feels "shaky" compared to original preview on drone controller
- Missing metadata warnings in professional editing tools
- Using consumer apps for "quick compression" before import

**Phase to address:**
Phase 1 (Video Processing Setup) — handle corrupt DJI_0018.MP4, establish metadata-preserving workflows for archival only (not editing)

---

### Pitfall 3: Missing Faststart Flag Breaks Progressive Web Playback

**What goes wrong:**
Videos encoded without `-movflags +faststart` place the MOOV atom (metadata container describing video structure, codec info, frame locations) at the end of the file. Web browsers must download the entire file before playback begins, creating 5-10 second delays on slower rural connections and appearing "broken" to users.

**Why it happens:**
FFmpeg's default MP4 structure writes the MOOV atom last for encoding efficiency. This works fine for local playback but cripples web delivery. The MOOV atom is needed to understand the video structure—when it's at the end, the browser can't start playback until it downloads everything. Moving it to the beginning enables progressive download and immediate playback as the video streams.

**How to avoid:**
**Always include `-movflags +faststart` for any video destined for web delivery:**

```bash
# For new encodes
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -c:a aac -b:a 128k \
  -movflags +faststart output_web.mp4

# For existing videos (no re-encode, just container optimization)
ffmpeg -i existing.mp4 -c copy -movflags +faststart output_web.mp4
```

**Performance impact:**
- Without faststart: 5-10 second delay before playback on rural connections
- With faststart: Playback begins within 16-24ms for clips under 8MB

**Warning signs:**
- Video appears to "hang" before playing on first load
- Browser network tab shows complete file download before playback starts
- Rural users (Missouri target audience) report "video won't play"
- Video starts immediately on localhost but delays on deployed site
- FFmpeg command doesn't include `-movflags +faststart`

**Phase to address:**
Phase 1 (Video Processing Setup) — include in all web delivery encoding scripts, verify on deployed preview

---

### Pitfall 4: Wrong Pixel Format Breaks Safari Playback

**What goes wrong:**
Videos encoded with pixel formats other than `yuv420p` (like `yuv422p`, `yuv444p`, or `yuv420p10le`) fail to play in Safari or display visual glitches (green artifacts, black screen). Since Safari uses hardware decoding with stricter format requirements than Chrome/Firefox, videos work during testing on Chrome but break for iPhone/iPad users (30-40% of traffic).

**Why it happens:**
Canon interior footage at 1080p@60fps may use 4:2:2 or other pixel formats for higher quality. FFmpeg preserves the source format unless explicitly told otherwise. Safari and many mobile devices only support 4:2:0 pixel formats (yuv420p) for hardware-accelerated playback. Browsers including Chrome and Firefox support 4:2:0 properly, but yuv420p is the only universally supported format.

**How to avoid:**
**Always explicitly specify `-pix_fmt yuv420p` for web video:**

```bash
ffmpeg -i canon_interior.mp4 -c:v libx264 -crf 23 \
  -pix_fmt yuv420p \
  -c:a aac -b:a 128k -movflags +faststart output.mp4
```

**Why yuv420p:**
- Universal browser support (Chrome, Firefox, Safari, Edge)
- Hardware decoding support on all modern devices
- Most non-FFmpeg based players don't support anything else
- Safari works for some 10-bit formats but fails on others (yuv420p is guaranteed)

**Warning signs:**
- Video plays in Chrome/Firefox but not Safari
- Mobile devices (iPhone/iPad) show black screen or green artifacts
- Browser console shows video codec errors
- Video plays but consumes excessive CPU (software fallback)
- Not explicitly setting `-pix_fmt` in FFmpeg commands

**Phase to address:**
Phase 1 (Video Processing Setup) — include in all encoding commands, test on Safari/iOS before deployment

---

### Pitfall 5: Seamless Loop Mismatch Creates Jarring Hero Video Restart

**What goes wrong:**
A 15-30s hero background loop has visually different first and last frames, creating a jarring "jump" every loop cycle. This breaks the illusion of continuous motion and makes the site feel low-quality, especially noticeable with drone footage that doesn't naturally return to starting position.

**Why it happens:**
Random clip trimming creates arbitrary endpoints. Drone footage rarely starts and ends on identical frames without intentional planning. The browser's 16-24ms restart delay (tested on Chrome 120+, Safari 17+, Firefox 121+) is invisible for matched frames but obvious for mismatched ones.

**How to avoid:**
**Option 1: Find natural loop point in footage**
```bash
# Analyze frame similarity to find loop candidates
# Compare every frame with a black frame to find similar frames
ffmpeg -i drone.mp4 -vf "blackframe=threshold=0" -f null - 2>&1 | grep blackframe
# Frames with similar difference scores are good loop candidates
```

**Option 2: Create seamless loop with reverse (ping-pong effect)**
```bash
# Create reversed version
ffmpeg -i original.mp4 -vf reverse -an reversed.mp4

# Concatenate forward + backward for seamless loop
echo "file 'original.mp4'" > filelist.txt
echo "file 'reversed.mp4'" >> filelist.txt
ffmpeg -f concat -safe 0 -i filelist.txt -c copy loop_seamless.mp4
```

**Option 3: Fade to black transition (last resort)**
```bash
# Add fade out/in at loop point
ffmpeg -i input.mp4 -vf "fade=t=out:st=14:d=1,fade=t=in:st=0:d=1" output.mp4
```

**Design principles for loop selection:**
- Use continuous motion (drifting clouds, slow pan, rotating object)
- Avoid hard cuts or sudden direction changes
- Keep loops short: **6-8 seconds feels natural**, 20+ seconds reveals mismatch
- Match first and last frame: composition, lighting, subject position

**Optimal loop length for web:**
- 3-8 seconds: sweet spot for background videos
- 6-second loop encoded as H.264 in 1080p ~3-6MB
- 720p version with tighter settings: 1.2-2.5MB
- **Target under 2.5MB** for default background assets

**Warning signs:**
- Visible "jump" every 15-30 seconds during playback
- Motion doesn't flow continuously through restart
- QA notes mention "video stutters" or "glitches"
- Loop duration >10 seconds (too long to hide mismatch)

**Phase to address:**
Phase 2 (Hero Video Creation) — select and trim footage with loop matching as primary criterion

---

### Pitfall 6: Incorrect Frame Rate Conversion Changes Playback Speed

**What goes wrong:**
Converting Canon 60fps footage to 30fps using simple `-r 30` flag doubles playback speed, making 10 seconds of footage play in 5 seconds. This ruins timing for the promo video and makes motion appear unnatural and jerky.

**Why it happens:**
The `-r` flag changes container frame rate metadata without generating intermediate frames or adjusting presentation timestamps (PTS). FFmpeg drops or duplicates frames to match the target rate, changing playback duration. Pure FPS conversion affects playback speed—without the `fps` filter or PTS adjustment, the video plays faster.

**How to avoid:**
**For 60fps → 30fps conversion (web delivery standard):**

```bash
# CORRECT: fps filter maintains duration, intelligently selects frames
ffmpeg -i canon_60fps.mp4 -filter:v "fps=30" -c:v libx264 -crf 23 \
  -pix_fmt yuv420p -c:a copy -movflags +faststart output_30fps.mp4
```

**For 60fps → 24fps (cinematic look):**
```bash
ffmpeg -i canon_60fps.mp4 -filter:v "fps=24" -c:v libx264 -crf 23 \
  -pix_fmt yuv420p -c:a copy -movflags +faststart output_24fps.mp4
```

**Understanding the difference:**
- `-r 30` = change container metadata (WRONG for conversion)
- `-filter:v "fps=30"` = intelligently select frames to maintain duration (CORRECT)
- `fps` filter uses motion-aware frame selection to minimize judder

**Web delivery recommendations:**
- Most web video is 24-30fps (not 60fps)
- 60fps increases file size significantly for marginal visual benefit on web
- Convert Canon 60fps → 30fps for web delivery
- Convert DJI 30fps → keep at 30fps (no conversion needed)

**Warning signs:**
- Output video duration is half of input duration
- Motion appears sped up or jerky
- Audio/video sync issues (if audio preserved at original speed)
- Client says "this feels rushed" or "motion looks weird"
- Using `-r` flag instead of `-filter:v "fps=X"`

**Phase to address:**
Phase 1 (Video Processing Setup) — establish frame rate conversion standards for Canon 60fps footage

---

### Pitfall 7: Unoptimized Audio Bloats File Size

**What goes wrong:**
Preserving original audio codec/bitrate from source footage wastes 30-50% of file size budget on inaudible quality. For a muted hero video, including audio at all wastes space. For promo video with music, 320kbps audio is overkill when 128kbps AAC is transparent for web delivery.

**Why it happens:**
Using `-c:a copy` preserves original audio settings. Source footage may have high bitrate audio (256-320kbps) suitable for editing but excessive for web delivery. Developers focus on video compression and ignore audio optimization.

**How to avoid:**
**For muted hero background video:**
```bash
# Strip audio entirely with -an
ffmpeg -i input.mp4 -c:v libx264 -crf 23 -an -movflags +faststart output_muted.mp4
```

**For promo video with music/ambient sound:**
```bash
# Optimize audio to AAC 128kbps (music) or 96kbps (ambient)
ffmpeg -i input.mp4 -c:v libx264 -crf 23 \
  -c:a aac -b:a 128k -movflags +faststart output.mp4
```

**Audio bitrate guidelines:**
- **64kbps:** Speech-only (interviews, narration)
- **96kbps:** Ambient sound (nature sounds, background audio, interior ambience)
- **128kbps:** Music (standard web quality, transparent for most listeners)
- **192kbps+:** Unnecessary for web delivery, wastes file size

**File size impact on 30-second video:**
- 320kbps audio: ~1.2MB
- 128kbps audio: ~480KB
- No audio (-an): 0KB
- **Savings: 480KB-1.2MB** (10-24% of 5MB budget)

**Recommended workflow:**
- **Hero video (muted autoplay):** Strip audio entirely (`-an`)
- **Promo video (music + ambient):** AAC 128kbps (`-b:a 128k`)
- **Interior clips (ambient only):** AAC 96kbps (`-b:a 96k`)

**Warning signs:**
- Hero video file size is 4.5MB with `-an` flag, 6MB without
- Using `-c:a copy` on final web delivery encodes
- Audio track present on muted background videos
- File size budget exceeded despite video quality reduction
- Not considering audio in file size calculations

**Phase to address:**
Phase 1 (Video Processing Setup) — establish audio encoding standards for different video types (hero vs promo)

---

### Pitfall 8: Corrupt DJI File Processing Blocks Entire Pipeline

**What goes wrong:**
Processing script fails on corrupt DJI_0018.MP4 and stops, blocking processing of remaining 3 good drone clips. The corrupt file produces FFmpeg errors like "moov atom not found" or "invalid data found when processing input," and the entire batch processing halts.

**Why it happens:**
DJI drones write video files in real-time. If the drone crashes, battery dies, or recording stops unexpectedly, the MP4 file isn't properly "finalized"—the MOOV atom at the file tail is incomplete or missing. When a DJI video file isn't properly finalized, the tail of the file following the 'mdat' (movie data) atom can be incorrect. Batch processing scripts assume all inputs are valid and don't handle errors gracefully.

**How to avoid:**
**Pre-processing validation:**
```bash
# Test file validity before processing
ffprobe DJI_0018.MP4 2>&1 | grep -q "moov atom not found" && echo "CORRUPT" || echo "OK"

# Automated validation in batch script
for file in DJI_*.MP4; do
  if ffprobe "$file" 2>&1 | grep -q "Invalid\|moov atom not found"; then
    echo "Skipping corrupt file: $file" >> processing.log
    continue
  fi
  # Process valid file
  ffmpeg -i "$file" ...
done
```

**Repair workflow (if footage is critical):**
```bash
# 1. Use DJIFIX tool to extract raw H.264 stream
# Download from: https://djifix.live555.com/
djifix DJI_0018.MP4  # Creates DJI_0018-repaired.h264

# 2. Convert to MP4 with FFmpeg
ffmpeg -i DJI_0018-repaired.h264 -c copy DJI_0018-repaired.mp4

# 3. Verify and fix potential 2x fps issue
# The file may be produced with 2x fps (48fps instead of 24fps)
ffprobe DJI_0018-repaired.mp4  # Check actual fps
# If fps is doubled, re-encode with correct rate
```

**Prevention strategy:**
1. Document known corrupt files (DJI_0018.MP4) in project notes
2. Implement validation checks in processing scripts
3. Use **graceful failure** (skip + log) instead of hard stop
4. Verify file integrity immediately after drone landing (QuickTime/VLC test)
5. Keep original SD card files until final delivery

**Warning signs:**
- FFmpeg errors mentioning "moov atom," "invalid data," or "could not find codec parameters"
- Video file won't open in QuickTime or VLC
- File size seems wrong (much smaller than other clips of similar duration)
- Batch processing stops at specific file every time
- DJI app showed "recording interrupted" or battery warning during flight

**Phase to address:**
Phase 1 (Video Processing Setup) — validate inputs, skip corrupt DJI_0018.MP4, document decision in processing notes

---

### Pitfall 9: Poor Keyframe Interval Breaks Web Video Scrubbing

**What goes wrong:**
Users try to scrub (seek) through the promo video but experience 2-5 second delays before playback resumes at the new position. The video appears "stuck" when dragging the progress bar, creating a frustrating user experience, especially on mobile.

**Why it happens:**
FFmpeg's default keyframe interval may be 10+ seconds (300 frames at 30fps). When a user seeks to a non-keyframe position, the browser must download from the previous keyframe and decode forward to the target position. Long GOP (Group of Pictures) distances require downloading and processing significant data before playback resumes. More keyframes need to be placed throughout a video to allow viewers to begin watching from random points (random access points).

**How to avoid:**
**Set explicit keyframe interval for web video:**

```bash
# 2-second keyframe interval (good balance for web)
# At 30fps: 60 frames per GOP
ffmpeg -i input.mp4 -c:v libx264 -crf 23 \
  -g 60 -keyint_min 60 \
  -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart output.mp4
```

**Keyframe interval guidelines:**
- **1 second (30 frames @ 30fps):** Best scrubbing, larger file size (+10-15%)
- **2 seconds (60 frames):** Good balance (recommended for web)
- **4 seconds (120 frames):** Acceptable for bandwidth-constrained delivery
- **10+ seconds:** Poor scrubbing experience, avoid for web

**Tradeoffs:**
- More keyframes = better scrubbing + larger file size
- Fewer keyframes = smaller file size + worse scrubbing
- For 1-2 minute promo video, 2-second interval adds ~200-300KB
- This keeps quality intact without inflating file size too much

**Recommended settings:**
- `-g 60`: Keyframe every 60 frames (2 seconds at 30fps)
- `-keyint_min 60`: Minimum interval between keyframes (prevents too many)
- Combined: ensures consistent 2-second GOP structure

**Warning signs:**
- Dragging progress bar shows "buffering" or delay before resuming
- Mobile users report "video freezes when I try to skip ahead"
- Browser network tab shows large downloads when seeking short distances
- Comparison with YouTube/Vimeo shows significantly slower scrubbing
- Not setting `-g` flag in FFmpeg commands (using defaults)

**Phase to address:**
Phase 1 (Video Processing Setup) — include `-g` flag in all web encoding commands, test scrubbing on deployed preview

---

### Pitfall 10: DaVinci Resolve Export → FFmpeg Re-encode Doubles Quality Loss

**What goes wrong:**
Export from DaVinci Resolve as H.264 with "High Quality" preset, then re-encode with FFmpeg for file size targeting. This double compression (generation loss) introduces visible artifacts (banding in skies, blockiness in shadows, detail loss in foliage) that weren't present in the timeline.

**Why it happens:**
Each lossy compression pass degrades quality. DaVinci's "High Quality" H.264 is already compressed (CRF ~18-20 equivalent). Re-encoding with FFmpeg at CRF 23-25 compounds generation loss. The final output is effectively "third generation" (source → Resolve edit → FFmpeg compress). For H.264 specifically, x264 in single-pass CRF mode delivers the same quality as two-pass VBR, but double compression is always worse than single compression.

**How to avoid:**
**Option 1: Export intermediate codec from Resolve, compress once with FFmpeg (RECOMMENDED)**

```bash
# DaVinci Resolve export settings:
# Format: QuickTime
# Codec: DNxHR HQ (or ProRes 422 if on Mac)
# Purpose: Lossless intermediate for FFmpeg final compression

# Then compress ONCE with FFmpeg
ffmpeg -i resolve_export_dnxhr.mov -c:v libx264 -crf 23 \
  -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart final_web.mp4
```

**Option 2: Export directly from Resolve with tight settings (if no file size targeting needed)**

```bash
# DaVinci Resolve export settings for direct web delivery:
# Format: MP4
# Codec: H.264
# Quality: Custom bitrate (calculate from file size requirement)
# Advanced: Enable "Fast start" (equivalent to FFmpeg's faststart)
# Audio: AAC, 128kbps

# No FFmpeg re-encode needed
```

**Option 3: Use FFmpeg plugin for DaVinci Resolve Studio**

Third-party FFmpeg encoder plugin enables exporting with FFmpeg directly from Resolve, giving access to all FFmpeg flags (faststart, specific CRF, bitrate targeting, keyframe intervals) without re-encode step.

**Recommended workflow:**
1. **Creative edit in DaVinci Resolve** (color grading, transitions, music sync)
2. **Export as DNxHR HQ or ProRes 422** (lossless intermediate)
3. **Single FFmpeg compression pass** with two-pass encoding for file size targeting
4. **Result:** Source → Resolve (lossless) → FFmpeg (one lossy pass) = minimal generation loss

**Why this matters:**
- DaVinci Resolve renders files in MOV format with high video/audio codec settings
- FFmpeg converts these into smaller MP4 files
- But only ONE lossy compression pass, not two

**Warning signs:**
- Final video has visible compression artifacts not seen in Resolve preview
- Sky gradients show banding that wasn't present in timeline
- Foliage/texture detail looks "mushy" or over-smoothed
- File size is smaller than target but quality is poor
- Workflow involves H.264 → H.264 re-encoding

**Phase to address:**
Phase 2 (Video Editing & Compression) — establish export codec workflow, avoid double compression, test with sample clip first

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Using CRF without file size validation | Faster encoding (no two-pass) | Unpredictable file sizes, may exceed limits, re-encode rounds | Never for web delivery with size constraints; OK for archival/editing intermediates |
| Skipping `-movflags +faststart` | Slightly faster encode | Broken progressive playback, 5-10s delays on rural connections | Never for web video; OK for local-only playback |
| Preserving original frame rate (60fps) | Simpler workflow, no conversion needed | 2x larger files, potential mobile playback issues | Never for web delivery; convert 60fps → 30fps for web |
| Using `-c:a copy` for audio | Faster encode, no audio re-encoding | Wasted file size on inaudible quality (320kbps → 128kbps) | Only for intermediate/archival files; never for final web delivery |
| Compressing DJI originals before edit | "Saves storage space" | Lost metadata, broken stabilization in Resolve | Never — use Resolve's proxy workflow instead; keep originals pristine |
| Single-pass encoding for tight file size targets | 50% faster encoding | Missed file size targets, unpredictable results | Only for quick tests; never for final delivery with size constraints |
| Skipping Safari testing | Faster QA cycle | Videos broken for 30-40% of users (wrong pixel format) | Never for client deliverables; always test Safari desktop + iOS |
| Using consumer apps for "quick" compression | Easier than FFmpeg learning | Lost metadata, poor quality, wrong formats | Never for professional delivery; invest time in FFmpeg proficiency |

## Integration Gotchas

Common mistakes when connecting to external services and tools.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| DaVinci Resolve → FFmpeg | Exporting H.264 from Resolve, re-encoding with FFmpeg | Export DNxHR/ProRes from Resolve, encode once with FFmpeg |
| DJI footage processing | Compressing before import to Resolve | Import originals, use Resolve's optimized/proxy media workflow |
| FFmpeg frame rate conversion | Using `-r 30` flag (changes speed) | Use `-filter:v "fps=30"` (maintains duration) |
| Web video streaming | Skipping `-movflags +faststart` | Always include for progressive playback |
| Safari compatibility | Not specifying pixel format | Always use `-pix_fmt yuv420p` for universal compatibility |
| Audio optimization | Using `-c:a copy` on final delivery | Strip audio (`-an`) for muted videos, or AAC 128kbps for music |
| File size targeting | Using CRF and hoping for best | Calculate bitrate, use two-pass encoding for guaranteed file size |
| Corrupt DJI files | Assuming all inputs valid | Implement validation, graceful failure (skip + log), document known corrupt files |
| Keyframe intervals | Using FFmpeg defaults (10s+) | Set `-g 60` (2-second intervals) for responsive web scrubbing |
| Video looping | Random trim points | Select footage with matched start/end frames, test 3+ loop cycles |

## Performance Traps

Patterns that work at small scale but fail as usage grows or reveal issues in real-world conditions.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Long keyframe intervals (>5s) | Slow scrubbing, 2-5s delays when seeking | Set `-g 60` (2s intervals at 30fps) | Any user trying to scrub through video, especially mobile |
| Wrong pixel format (not yuv420p) | Works in Chrome, broken in Safari/iOS | Always specify `-pix_fmt yuv420p` | 30-40% of users (Safari desktop + iOS devices) |
| Missing faststart flag | Works localhost, delays on deployed site | Always include `-movflags +faststart` | Rural users, slow connections, first-time loads |
| Unoptimized audio in muted video | Wastes 20-30% of file size budget | Strip audio with `-an` for muted videos | Tight file size constraints (<5MB hero video) |
| Using only CRF for size targeting | Unpredictable file sizes | Two-pass encoding with calculated bitrate | Any project with non-negotiable file size limits |
| Poor loop selection (>10s, mismatched endpoints) | Jarring restart every loop cycle | 6-8s loops with matched start/end frames | Every loop cycle (users notice within 30 seconds) |
| Double compression (Resolve H.264 → FFmpeg H.264) | Quality loss, banding, artifacts | Export DNxHR/ProRes, compress once | High-quality deliverables, gradient-heavy footage (skies, water) |

## UX Pitfalls

Common user experience mistakes specific to video compression and delivery.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No progressive playback (missing faststart) | 5-10s "hang" before video plays, appears broken | Always `-movflags +faststart` |
| Jarring loop restart | Video "jumps" every 15-30s, low-quality feel | Select footage with matched start/end, keep loops short (6-8s) |
| Slow video scrubbing | 2-5s delay when dragging progress bar | Set keyframe interval to 2s (`-g 60` at 30fps) |
| Wrong pixel format | Black screen or green artifacts on Safari/iOS | Always `-pix_fmt yuv420p` |
| Oversized file (poor compression) | Slow loading on rural/cellular connections | Two-pass encoding with calculated bitrate for tight targets |
| Incorrect frame rate conversion | Sped-up playback, unnatural motion | Use `fps` filter, not `-r` flag |
| Unoptimized audio in muted video | Slower loading, wasted bandwidth | Strip audio with `-an` for muted background videos |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces for video processing pipeline.

- [ ] **Faststart flag:** Often missing from FFmpeg commands — verify `-movflags +faststart` in all web delivery encodes
- [ ] **Pixel format:** Often using source format instead of yuv420p — verify `-pix_fmt yuv420p` specified explicitly
- [ ] **Frame rate conversion:** Often using `-r` instead of `fps` filter — verify output duration matches input duration
- [ ] **Audio optimization:** Often using `-c:a copy` — verify hero video has `-an`, promo has `-b:a 128k`
- [ ] **File size validation:** Often assuming CRF hits target — verify actual file size ≤ target before deployment
- [ ] **Keyframe interval:** Often using FFmpeg defaults — verify `-g 60` for 2-second intervals at 30fps
- [ ] **Safari testing:** Often tested Chrome-only — verify video plays cleanly on Safari desktop + iOS
- [ ] **Metadata preservation:** Often stripped on DJI compression — verify original files imported to Resolve, not compressed versions
- [ ] **Corrupt file handling:** Often assumes all inputs valid — verify script skips/handles corrupt DJI_0018.MP4 gracefully
- [ ] **Loop quality:** Often random trim points — verify first/last frames match, play 3+ loop cycles to confirm smooth restart
- [ ] **Double compression:** Often H.264 → H.264 — verify Resolve exports DNxHR/ProRes for single FFmpeg compression pass

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| File size exceeded | LOW | Re-encode with two-pass targeting calculated bitrate: `(target_MB × 8192) / duration_sec = bitrate_kbps` |
| Missing faststart | LOW | Run `ffmpeg -i input.mp4 -c copy -movflags +faststart output.mp4` (no re-encode, just container fix) |
| Wrong pixel format | MEDIUM | Re-encode with `-pix_fmt yuv420p` (full re-encode required, 15-30 min per clip) |
| Wrong frame rate | MEDIUM | Re-encode with `fps` filter: `-filter:v "fps=30"` (full re-encode required) |
| Lost DJI metadata | HIGH | Re-import original files, re-edit, re-export (if originals preserved) or IMPOSSIBLE (if originals deleted/overwritten) |
| Double compression artifacts | HIGH | Re-export from Resolve as DNxHR, re-compress with FFmpeg (requires source project files) |
| Poor seamless loop | MEDIUM | Re-select footage segment with matched endpoints, re-encode (requires source footage) |
| No keyframe optimization | LOW | Re-encode with `-g` flag (full re-encode, but straightforward) |
| Unoptimized audio | LOW | Re-encode with `-c:a aac -b:a 128k` or strip with `-an` (full re-encode) |
| Corrupt file blocking pipeline | LOW | Add validation check to skip corrupt file, document in processing notes, continue with remaining files |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| File size unpredictability | Phase 1: Processing Setup | Test encode both videos, verify sizes ≤ targets (hero <5MB, promo <10MB) |
| Lost DJI metadata | Phase 1: Processing Setup | Import originals to Resolve, verify stabilization features work, use proxy workflow |
| Missing faststart | Phase 1: Processing Setup | Test deployed preview video, verify playback starts before full download |
| Wrong pixel format | Phase 1: Processing Setup | Test on Safari desktop + iOS, verify clean playback with no artifacts |
| Seamless loop issues | Phase 2: Hero Video Creation | Play hero video for 3+ minutes, verify no jarring restart |
| Frame rate conversion errors | Phase 1: Processing Setup | Compare output duration to input, verify 1:1 match (no speed change) |
| Unoptimized audio | Phase 1: Processing Setup | Check file sizes, verify audio stripped (hero) or 128kbps (promo) |
| Corrupt file blocking | Phase 1: Processing Setup | Run batch processing, verify DJI_0018.MP4 skipped gracefully with log entry |
| Poor keyframe interval | Phase 1: Processing Setup | Test scrubbing in deployed video, verify <2s seek delay |
| Double compression | Phase 2: Video Editing | Export DNxHR from Resolve, verify single FFmpeg compression pass workflow |

## Sources

**File Size Targeting & Compression:**
- [How to compress video files while maintaining quality with ffmpeg | Mux](https://www.mux.com/articles/how-to-compress-video-files-while-maintaining-quality-with-ffmpeg)
- [Reducing video file size with FFmpeg for web optimization | Transloadit](https://transloadit.com/devtips/reducing-video-file-size-with-ffmpeg-for-web-optimization/)
- [CRF Guide (Constant Rate Factor in x264, x265 and libvpx)](https://slhck.info/video/2017/02/24/crf-guide.html)
- [FFMPEG Tutorial: 2-Pass & CRF in x264 & x265 · GitHub](https://gist.github.com/hsab/7c9219c4d57e13a42e06bf1cab90cd44)

**DJI Metadata & Stabilization:**
- [Compress Drone Videos Without Losing Stabilization Metadata](https://lifetips.alibaba.com/tech-efficiency/compress-drone-videos-without-losing-stabilization-metadata)
- [Encoding Drone Video for the Web with ffmpeg](https://igis.ucanr.edu/Tech_Notes/Encode_Drone_Video/)

**Web Optimization:**
- [How to optimize videos for web playback using FFmpeg | Mux](https://www.mux.com/articles/optimize-video-for-web-playback-with-ffmpeg)
- [Make videos start faster · Cookbook](https://code.pixplicity.com/ffmpeg/faststart/)

**Frame Rate Conversion:**
- [FFmpeg to the Rescue: Convert 60fps to 30fps - Streaming Learning Center](https://streaminglearningcenter.com/blogs/ffmpeg-rescue-converting-60-fps-30-fps.html)
- [FFmpeg - Create Smooth Videos With Frame Interpolation | Programster's Blog](https://blog.programster.org/ffmpeg-create-smooth-videos-with-frame-interpolation)

**Poster Frames & Thumbnails:**
- [Extract thumbnails from a video with FFmpeg | Mux](https://www.mux.com/articles/extract-thumbnails-from-a-video-with-ffmpeg)
- [FFmpeg Mastery: Extracting Perfect Thumbnails from Videos | Medium](https://medium.com/@sergiu.savva/ffmpeg-mastery-extracting-perfect-thumbnails-from-videos-339a4229bb32)

**DaVinci Resolve Integration:**
- [Exchanging video between DaVinci Resolve and FFMPEG - Coert Vonk](https://coertvonk.com/other/videoediting/exchanging-video-between-davinci-resolve-and-ffmpeg-32871)
- [DaVinci Resolve FFmpeg cheatsheet for Linux - Alecaddd](https://alecaddd.com/davinci-resolve-ffmpeg-cheatsheet-for-linux/)

**Corrupt File Recovery:**
- [Repairing Corrupt DJI Video Files](https://djifix.live555.com/)
- [How to fix corrupted DJI video from Phantom drone · GitHub](https://gist.github.com/bzamecnik/a3f32bcad1b3739dc773ba9ed58d0e5c)

**Seamless Looping:**
- [HTML video loop Attribute: Practical Patterns for 2026 Frontends – TheLinuxCode](https://thelinuxcode.com/html-video-loop-attribute-practical-patterns-for-2026-frontends/)
- [Use FFmpeg to find a possible loop in a video – Andyland](https://andyland.info/wordpress/use-ffmpeg-to-find-a-possible-loop-in-a-video/)

**Browser Compatibility:**
- [ffmpeg video encoding for web (chrome, firefox, safari, etc) · GitHub](https://gist.github.com/JoelLisenby/a3bb5b60c400283c286550e6c3bdd407)

**Vercel Hosting:**
- [Best Practices for Hosting Video Assets on Vercel](https://vercel.com/guides/best-practices-for-hosting-videos-on-vercel-nextjs-mp4-gif)
- [Vercel Limits Documentation](https://vercel.com/docs/limits)

**GOP & Keyframes:**
- [Smooth Scrubbing Web Video FFMPEG Mega Command · GitHub](https://gist.github.com/jeffpamer/f3134c5145238d0fd4752221b2d75eb7)
- [Back to basics: GOPs explained | Amazon Web Services](https://aws.amazon.com/blogs/media/part-1-back-to-basics-gops-explained/)

**Audio Optimization:**
- [FFmpeg for Audio: Encoding, Filtering & Normalization](https://www.cincopa.com/learn/ffmpeg-for-audio-encoding-filtering-and-normalization)

---
*Pitfalls research for: Timber & Threads video compression pipeline (video processing milestone)*
*Researched: 2026-02-16*
