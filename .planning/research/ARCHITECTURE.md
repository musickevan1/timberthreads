# Architecture Research: Video Processing Pipeline

**Domain:** CLI-based video processing pipeline integrated with DaVinci Resolve
**Researched:** 2026-02-16
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌────────────────────────────────────────────────────────────────────────┐
│                       RAW FOOTAGE LAYER                                │
│  (Source: Camera SD cards, unprocessed, large files)                   │
├────────────────────────────────────────────────────────────────────────┤
│  drone-clips/100MEDIA/              timberandthreads-promo-clips/     │
│    ├── DJI_0014.MP4 (665MB)           DCIM/100CANON/                  │
│    ├── DJI_0015.MP4 (578MB)             ├── MVI_4248.MP4              │
│    ├── DJI_0016.MP4 (479MB)             ├── MVI_4249.MP4              │
│    ├── DJI_0017.MP4 (681MB)             ├── ... (21 video clips)      │
│    └── DJI_0018.MP4 (CORRUPT)           └── IMG_*.CR3 (58 photos)     │
│                                                                        │
│                              ↓                                         │
├────────────────────────────────────────────────────────────────────────┤
│                    CATALOGING LAYER (FFmpeg CLI)                       │
│  (Generate thumbnails, extract metadata, verify integrity)            │
├────────────────────────────────────────────────────────────────────────┤
│  processing/                                                           │
│    ├── catalog/                                                        │
│    │   ├── drone/                                                      │
│    │   │   ├── DJI_0014-thumb.jpg     # Thumbnail preview             │
│    │   │   ├── DJI_0014-metadata.json # Duration, resolution, codec   │
│    │   │   └── ...                                                     │
│    │   └── canon/                                                      │
│    │       ├── MVI_4248-thumb.jpg                                      │
│    │       └── ...                                                     │
│    │                                                                   │
│    └── catalog-index.json  # Master catalog with all clips            │
│                                                                        │
│                              ↓                                         │
├────────────────────────────────────────────────────────────────────────┤
│              SILENCE DETECTION LAYER (auto-editor)                     │
│  (Analyze audio, detect silence/dead space, generate cut lists)       │
├────────────────────────────────────────────────────────────────────────┤
│  processing/                                                           │
│    └── silence-analysis/                                               │
│        ├── DJI_0014-silence.json    # Silence timestamps              │
│        ├── MVI_4248-silence.json                                       │
│        └── ...                                                         │
│                                                                        │
│                              ↓                                         │
├────────────────────────────────────────────────────────────────────────┤
│                 TRIMMED SEGMENTS LAYER (FFmpeg CLI)                    │
│  (Batch trim based on silence detection, remove dead space)           │
├────────────────────────────────────────────────────────────────────────┤
│  processing/                                                           │
│    └── trimmed/                                                        │
│        ├── drone/                                                      │
│        │   ├── DJI_0014_trimmed.mp4                                    │
│        │   └── ...                                                     │
│        └── canon/                                                      │
│            ├── MVI_4248_trimmed.mp4                                    │
│            └── ...                                                     │
│                                                                        │
│                              ↓                                         │
├────────────────────────────────────────────────────────────────────────┤
│              CREATIVE EDIT LAYER (DaVinci Resolve)                     │
│  (Manual assembly, color grading, pacing, music, transitions)         │
├────────────────────────────────────────────────────────────────────────┤
│  resolve-projects/                                                     │
│    └── TimberThreads_Promo/                                            │
│        ├── TimberThreads_Promo.drp        # Resolve project file      │
│        ├── FOOTAGE/         → links to processing/trimmed/            │
│        ├── TIMELINES/                                                  │
│        │   ├── Hero_Background_v1                                      │
│        │   ├── Hero_Background_FINAL                                   │
│        │   ├── Promo_Full_v1                                           │
│        │   └── Promo_Full_FINAL                                        │
│        ├── GFX/                                                        │
│        │   └── (titles, lower-thirds, overlays)                        │
│        └── AUDIO/                                                      │
│            └── (music, ambient sound)                                  │
│                                                                        │
│  Exports from Resolve:                                                │
│    ├── hero-background-MASTER.mov (ProRes/DNxHR)                      │
│    └── promo-full-MASTER.mov (ProRes/DNxHR)                           │
│                                                                        │
│                              ↓                                         │
├────────────────────────────────────────────────────────────────────────┤
│              COMPRESSION LAYER (FFmpeg CLI)                            │
│  (Final web-optimized compression with H.264 CRF)                     │
├────────────────────────────────────────────────────────────────────────┤
│  processing/                                                           │
│    └── compressed/                                                     │
│        ├── hero-background.mp4 (<5MB, 720p, CRF 23)                   │
│        └── promo-full.mp4 (<10MB, 1080p, CRF 23)                      │
│                                                                        │
│                              ↓                                         │
├────────────────────────────────────────────────────────────────────────┤
│                   WEB DELIVERY LAYER (Vercel)                          │
├────────────────────────────────────────────────────────────────────────┤
│  public/assets/videos/                                                │
│    ├── hero-background.mp4        ← Copy from processing/compressed/  │
│    ├── hero-poster.jpg            ← Extract with FFmpeg               │
│    ├── promo-full.mp4             ← Copy from processing/compressed/  │
│    └── promo-poster.jpg           ← Extract with FFmpeg               │
│                                                                        │
│  Served via Vercel Edge Network (static assets)                       │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **Raw Footage Storage** | Preserve original camera files untouched | Camera SD card directories (drone-clips/, timberandthreads-promo-clips/) |
| **Cataloging System** | Generate thumbnails, extract metadata, create searchable index | FFmpeg for thumbnail extraction, ffprobe for metadata, JSON index file |
| **Silence Detector** | Analyze audio tracks, identify silence/dead space, generate cut lists | auto-editor Python CLI with configurable threshold and margin |
| **Batch Trimmer** | Apply silence detection results to remove dead space | FFmpeg with cut list input, stream copy for fast processing |
| **Creative Editor** | Manual assembly, color grading, pacing, music integration | DaVinci Resolve with organized project structure |
| **Web Compressor** | Final compression for web delivery with size targets | FFmpeg with H.264 CRF 23, faststart flag, target resolution |
| **Poster Extractor** | Generate fallback images for video elements | FFmpeg single frame extraction at key timestamp |

## Recommended Project Structure

```
timberandthreads/
├── drone-clips/                     # RAW: Original drone footage (preserve)
│   └── 100MEDIA/
│       ├── DJI_0014.MP4            # 665MB, 1920x1080, H.264, 154s
│       ├── DJI_0015.MP4            # 578MB
│       ├── DJI_0016.MP4            # 479MB
│       ├── DJI_0017.MP4            # 681MB
│       └── DJI_0018.MP4            # CORRUPT - skip
│
├── timberandthreads-promo-clips/   # RAW: Original Canon footage
│   └── DCIM/100CANON/
│       ├── MVI_4248.MP4            # 21 video clips
│       ├── MVI_4249.MP4
│       ├── ... (19 more)
│       └── IMG_*.CR3               # 58 photos (for gallery)
│
├── processing/                      # WORKSPACE: All processing artifacts
│   ├── catalog/                    # Stage 1: Thumbnails + metadata
│   │   ├── drone/
│   │   │   ├── DJI_0014-thumb.jpg
│   │   │   ├── DJI_0014-metadata.json
│   │   │   └── ...
│   │   ├── canon/
│   │   │   ├── MVI_4248-thumb.jpg
│   │   │   └── ...
│   │   └── catalog-index.json      # Master index
│   │
│   ├── silence-analysis/           # Stage 2: Silence detection results
│   │   ├── DJI_0014-silence.json
│   │   ├── MVI_4248-silence.json
│   │   └── ...
│   │
│   ├── trimmed/                    # Stage 3: Trimmed segments
│   │   ├── drone/
│   │   │   ├── DJI_0014_trimmed.mp4
│   │   │   └── ...
│   │   └── canon/
│   │       ├── MVI_4248_trimmed.mp4
│   │       └── ...
│   │
│   └── compressed/                 # Stage 5: Final web-ready files
│       ├── hero-background.mp4
│       └── promo-full.mp4
│
├── resolve-projects/               # CREATIVE: DaVinci Resolve workspace
│   └── TimberThreads_Promo/
│       ├── TimberThreads_Promo.drp # Resolve project file
│       ├── FOOTAGE/                # Links to processing/trimmed/
│       ├── TIMELINES/
│       │   ├── Hero_Background_v1
│       │   ├── Hero_Background_FINAL
│       │   ├── Promo_Full_v1
│       │   └── Promo_Full_FINAL
│       ├── GFX/                    # Graphics, titles
│       ├── AUDIO/                  # Music, ambient
│       └── TEMP/                   # Temporary work
│
├── exports/                        # MASTER: High-quality exports from Resolve
│   ├── hero-background-MASTER.mov  # ProRes/DNxHR from Resolve
│   └── promo-full-MASTER.mov
│
└── public/assets/videos/           # DELIVERY: Final web files
    ├── hero-background.mp4         # <5MB, 720p, H.264
    ├── hero-poster.jpg
    ├── promo-full.mp4              # <10MB, 1080p, H.264
    └── promo-poster.jpg
```

### Structure Rationale

- **Preserve raw footage**: Never modify original camera files. Keep them in separate directories for archival.
- **Workspace separation**: `processing/` contains all CLI-generated artifacts, separate from creative work.
- **Stage-based organization**: Each processing stage has its own directory (catalog → silence-analysis → trimmed → compressed).
- **Resolve project isolation**: DaVinci Resolve projects in dedicated directory, linking to trimmed clips via FOOTAGE/.
- **Master exports**: High-quality intermediate files from Resolve stored in `exports/`, separate from web-compressed deliverables.
- **Public deployment**: Only final compressed videos and posters go to `public/assets/videos/` for web delivery.

## Architectural Patterns

### Pattern 1: Two-Pass Workflow (CLI Preprocessing + Creative Editing)

**What:** Separate automated CLI preprocessing (trimming, metadata extraction) from manual creative editing in DaVinci Resolve.

**When to use:** When dealing with large volumes of raw footage that need efficiency gains before creative work.

**Trade-offs:**
- ✅ Dramatically reduces manual labor for repetitive tasks (silence removal)
- ✅ Faster creative editing with pre-trimmed clips
- ✅ Cleaner timeline organization in Resolve
- ✅ Reproducible preprocessing via CLI scripts
- ❌ Additional complexity with multiple tool chain
- ❌ Requires understanding of FFmpeg and auto-editor CLI
- ❌ Two-stage workflow means more file management

**Example:**
```bash
# Stage 1: CLI preprocessing (auto-editor for silence detection)
auto-editor drone-clips/100MEDIA/DJI_0014.MP4 \
  --margin 0.3sec \
  --output processing/trimmed/drone/DJI_0014_trimmed.mp4

# Stage 2: Import trimmed clips into DaVinci Resolve for creative editing
# (Manual work: assembly, color grading, music, pacing)

# Stage 3: Export master from Resolve, then compress for web
ffmpeg -i exports/hero-background-MASTER.mov \
  -c:v libx264 -crf 23 -preset medium \
  -vf "scale=1280:720" \
  -movflags +faststart \
  public/assets/videos/hero-background.mp4
```

### Pattern 2: Catalog-First Processing

**What:** Generate thumbnails and metadata catalog before any editing, enabling visual selection and organization.

**When to use:** When working with many clips (20+ files) where visual browsing is more efficient than filename inspection.

**Trade-offs:**
- ✅ Quick visual overview of all footage
- ✅ Searchable metadata (duration, resolution, codec)
- ✅ Easy identification of corrupted files
- ✅ Provides reference for creative decisions
- ❌ Upfront time investment before editing
- ❌ Requires additional catalog management code

**Example:**
```bash
# Generate thumbnail at 5-second mark
ffmpeg -i drone-clips/100MEDIA/DJI_0014.MP4 \
  -ss 00:00:05 \
  -frames:v 1 \
  -vf "scale=320:180" \
  -q:v 2 \
  processing/catalog/drone/DJI_0014-thumb.jpg

# Extract metadata to JSON
ffprobe -v quiet -print_format json \
  -show_format -show_streams \
  drone-clips/100MEDIA/DJI_0014.MP4 \
  > processing/catalog/drone/DJI_0014-metadata.json

# Build master catalog index
cat > processing/catalog/catalog-index.json << 'EOF'
{
  "drone": [
    {
      "filename": "DJI_0014.MP4",
      "duration": 153.99,
      "resolution": "1920x1080",
      "size_mb": 665,
      "thumbnail": "processing/catalog/drone/DJI_0014-thumb.jpg",
      "metadata": "processing/catalog/drone/DJI_0014-metadata.json"
    }
  ],
  "canon": [...]
}
EOF
```

### Pattern 3: Silence Detection with Margins

**What:** Use auto-editor to detect silence/dead space, but preserve small margins around speech/action for natural pacing.

**When to use:** For interview/dialogue footage or clips with natural pauses that shouldn't be completely removed.

**Trade-offs:**
- ✅ Preserves natural pacing and rhythm
- ✅ Avoids jarring jump cuts
- ✅ Faster than manual trimming
- ❌ Less aggressive compression than hard silence removal
- ❌ Requires tuning margin values per content type

**Example:**
```bash
# Detect silence with 0.3-second margins (keeps natural breathing room)
auto-editor timberandthreads-promo-clips/DCIM/100CANON/MVI_4248.MP4 \
  --margin 0.3sec \
  --output processing/trimmed/canon/MVI_4248_trimmed.mp4

# For drone footage (mostly ambient), smaller margins work better
auto-editor drone-clips/100MEDIA/DJI_0014.MP4 \
  --margin 0.1sec \
  --output processing/trimmed/drone/DJI_0014_trimmed.mp4
```

### Pattern 4: DaVinci Resolve Reference Workflow

**What:** DaVinci Resolve project references trimmed clips from `processing/trimmed/` instead of copying files into project.

**When to use:** Always, to avoid duplication and maintain single source of truth for processed clips.

**Trade-offs:**
- ✅ No file duplication (saves disk space)
- ✅ Single source of truth for trimmed clips
- ✅ CLI updates automatically reflected in Resolve
- ❌ Resolve project depends on external file structure
- ❌ Breaking file paths causes relinking issues

**Example DaVinci Resolve Project Structure:**
```
resolve-projects/TimberThreads_Promo/
├── TimberThreads_Promo.drp        # Project file
├── FOOTAGE/                       # Bin structure mirrors processing/
│   ├── Drone/                     → Link to processing/trimmed/drone/
│   └── Canon/                     → Link to processing/trimmed/canon/
├── TIMELINES/
│   ├── Hero_Background_v1         # Work-in-progress versions
│   ├── Hero_Background_FINAL      # Final approved timeline
│   ├── Promo_Full_v1
│   └── Promo_Full_FINAL
├── GFX/
│   └── (imported graphics, titles)
├── AUDIO/
│   └── (music tracks, ambient sound)
└── TEMP/
    └── (temporary work, nothing should stay here)
```

**Resolve Bin Organization:**
- **FOOTAGE/Drone**: All drone clips from `processing/trimmed/drone/`
- **FOOTAGE/Canon**: All Canon clips from `processing/trimmed/canon/`
- **TIMELINES/**: Version-controlled timelines (v1, v2, FINAL)
- **GFX/**: Graphics and titles
- **AUDIO/**: Music and sound effects
- **TEMP/**: Temporary workspace (clean regularly)

### Pattern 5: Master Export → Web Compression

**What:** Export high-quality master files from DaVinci Resolve (ProRes/DNxHR), then compress separately for web delivery.

**When to use:** Always, to preserve flexibility for future re-exports and platform-specific requirements.

**Trade-offs:**
- ✅ Archive-quality master files for future use
- ✅ Separate web compression allows iteration without re-editing
- ✅ Different web targets (720p, 1080p) from single master
- ❌ Requires large storage for master files (10-50GB per video)
- ❌ Two-step export process

**Example:**
```bash
# Step 1: Export master from DaVinci Resolve
# In Resolve: File → Export → Deliver
# Format: QuickTime, Codec: Apple ProRes 422 or DNxHR HQ
# Output: exports/hero-background-MASTER.mov (large file, ~10-20GB)

# Step 2: Compress master for web (hero background - 720p, <5MB)
ffmpeg -i exports/hero-background-MASTER.mov \
  -c:v libx264 \
  -crf 23 \
  -preset medium \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black" \
  -r 30 \
  -movflags +faststart \
  -c:a aac -b:a 128k \
  public/assets/videos/hero-background.mp4

# Step 3: Compress master for web (promo full - 1080p, <10MB)
ffmpeg -i exports/promo-full-MASTER.mov \
  -c:v libx264 \
  -crf 23 \
  -preset medium \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:-1:-1:color=black" \
  -movflags +faststart \
  -c:a aac -b:a 128k \
  public/assets/videos/promo-full.mp4

# Step 4: Extract poster images
ffmpeg -i public/assets/videos/hero-background.mp4 \
  -ss 00:00:03 -frames:v 1 -q:v 2 \
  public/assets/videos/hero-poster.jpg

ffmpeg -i public/assets/videos/promo-full.mp4 \
  -ss 00:00:05 -frames:v 1 -q:v 2 \
  public/assets/videos/promo-poster.jpg
```

### Pattern 6: Storyboard Contact Sheet for Visual Review

**What:** Generate a contact sheet (grid of thumbnails) showing multiple frames from each clip for quick visual review.

**When to use:** When you need to visually scan long clips to identify best segments without playing entire videos.

**Trade-offs:**
- ✅ Quick visual overview of entire clip
- ✅ Easy identification of best moments
- ✅ Useful for stakeholder review without video playback
- ❌ Additional processing time upfront
- ❌ Doesn't replace watching full clips for creative decisions

**Example:**
```bash
# Generate 12-frame storyboard from a clip (1 frame every 10 seconds)
ffmpeg -i drone-clips/100MEDIA/DJI_0014.MP4 \
  -vf "select='not(mod(n\,300))',scale=320:180,tile=4x3" \
  -frames:v 1 \
  -q:v 2 \
  processing/catalog/drone/DJI_0014-storyboard.jpg
```

## Data Flow

### Processing Pipeline Flow

```
1. RAW FOOTAGE INGESTION
   ↓
   User copies files from camera SD cards
   ↓
   drone-clips/100MEDIA/*.MP4
   timberandthreads-promo-clips/DCIM/100CANON/*.MP4

2. CATALOGING (FFmpeg + ffprobe)
   ↓
   For each video file:
     - Extract thumbnail at 5s mark
     - Extract metadata (duration, codec, resolution)
     - Verify file integrity (detect corruption)
   ↓
   processing/catalog/
     ├── drone/DJI_*-thumb.jpg
     ├── drone/DJI_*-metadata.json
     ├── canon/MVI_*-thumb.jpg
     └── catalog-index.json

3. SILENCE DETECTION (auto-editor)
   ↓
   For each video file:
     - Analyze audio track for silence/dead space
     - Generate cut list with timestamps
   ↓
   processing/silence-analysis/
     ├── DJI_*-silence.json
     └── MVI_*-silence.json

4. BATCH TRIMMING (FFmpeg)
   ↓
   For each video file:
     - Apply silence detection results
     - Trim dead space with stream copy (fast)
   ↓
   processing/trimmed/
     ├── drone/DJI_*_trimmed.mp4
     └── canon/MVI_*_trimmed.mp4

5. CREATIVE EDITING (DaVinci Resolve - MANUAL)
   ↓
   User performs:
     - Import trimmed clips into Resolve
     - Assemble hero background (15-30s looping drone)
     - Assemble promo video (1-2 min property tour)
     - Color grading
     - Add music + ambient sound
     - Adjust pacing and transitions
   ↓
   Export master files:
     exports/hero-background-MASTER.mov (ProRes/DNxHR)
     exports/promo-full-MASTER.mov

6. WEB COMPRESSION (FFmpeg)
   ↓
   Hero background:
     - Input: exports/hero-background-MASTER.mov
     - Compress: 720p, H.264 CRF 23, faststart
     - Target: <5MB
   ↓
   Promo full:
     - Input: exports/promo-full-MASTER.mov
     - Compress: 1080p, H.264 CRF 23, faststart
     - Target: <10MB
   ↓
   processing/compressed/
     ├── hero-background.mp4
     └── promo-full.mp4

7. POSTER EXTRACTION (FFmpeg)
   ↓
   Extract single frame from each compressed video
   ↓
   processing/compressed/
     ├── hero-poster.jpg
     └── promo-poster.jpg

8. WEB DEPLOYMENT
   ↓
   Copy final files to Next.js public directory
   ↓
   public/assets/videos/
     ├── hero-background.mp4
     ├── hero-poster.jpg
     ├── promo-full.mp4
     └── promo-poster.jpg
   ↓
   Served via Vercel Edge Network
```

### DaVinci Resolve Integration Flow

```
FFmpeg Processing                  DaVinci Resolve
─────────────────                  ────────────────
processing/trimmed/
├── drone/                         FOOTAGE/ (Bin)
│   ├── DJI_0014_trimmed.mp4  →   ├── Drone/
│   ├── DJI_0015_trimmed.mp4  →   │   └── (linked clips)
│   └── ...                   →   │
└── canon/                         └── Canon/
    ├── MVI_4248_trimmed.mp4  →       └── (linked clips)
    └── ...                   →
                                   TIMELINES/
                                   ├── Hero_Background_v1
                                   │   └── (assemble + edit)
                                   ├── Hero_Background_FINAL
                                   │   └── (approved version)
                                   ├── Promo_Full_v1
                                   └── Promo_Full_FINAL

                                   GFX/
                                   └── (titles, overlays)

                                   AUDIO/
                                   └── (music, ambient)

                                   ↓ Export

exports/                           File → Export → Deliver
├── hero-background-MASTER.mov ←  (ProRes 422 / DNxHR HQ)
└── promo-full-MASTER.mov      ←
```

### Key Data Flows

1. **Raw → Catalog**: FFmpeg thumbnails + ffprobe metadata → JSON index
2. **Raw → Silence Analysis**: auto-editor audio analysis → JSON cut lists
3. **Silence Analysis + Raw → Trimmed**: FFmpeg applies cut lists → trimmed clips
4. **Trimmed → Resolve**: User imports trimmed clips, performs creative edit
5. **Resolve → Master Exports**: High-quality ProRes/DNxHR exports
6. **Master Exports → Web Compressed**: FFmpeg H.264 compression with size targets
7. **Web Compressed → Public**: Copy to Next.js public directory for deployment

## Optimal Processing Order

### Phase 1: Setup & Organization (One-time)

```bash
# 1. Create processing directory structure
mkdir -p processing/{catalog/{drone,canon},silence-analysis,trimmed/{drone,canon},compressed}
mkdir -p resolve-projects exports public/assets/videos

# 2. Verify FFmpeg and auto-editor installation
ffmpeg -version
auto-editor --version  # If missing: pip install auto-editor

# 3. List all video files
find drone-clips/100MEDIA -name "*.MP4"
find timberandthreads-promo-clips/DCIM/100CANON -name "*.MP4"
```

### Phase 2: Cataloging (30-60 minutes for 25 clips)

```bash
# For each drone clip
for file in drone-clips/100MEDIA/*.MP4; do
  basename=$(basename "$file" .MP4)

  # Skip corrupt file
  [ "$basename" = "DJI_0018" ] && continue

  # Extract thumbnail at 5 seconds
  ffmpeg -i "$file" -ss 00:00:05 -frames:v 1 \
    -vf "scale=320:180" -q:v 2 \
    "processing/catalog/drone/${basename}-thumb.jpg"

  # Extract metadata
  ffprobe -v quiet -print_format json -show_format -show_streams "$file" \
    > "processing/catalog/drone/${basename}-metadata.json"
done

# Repeat for Canon clips
for file in timberandthreads-promo-clips/DCIM/100CANON/*.MP4; do
  basename=$(basename "$file" .MP4)

  ffmpeg -i "$file" -ss 00:00:05 -frames:v 1 \
    -vf "scale=320:180" -q:v 2 \
    "processing/catalog/canon/${basename}-thumb.jpg"

  ffprobe -v quiet -print_format json -show_format -show_streams "$file" \
    > "processing/catalog/canon/${basename}-metadata.json"
done

# Review thumbnails to identify best clips
ls -lh processing/catalog/drone/*-thumb.jpg
ls -lh processing/catalog/canon/*-thumb.jpg
```

### Phase 3: Silence Detection (Optional, 15-30 minutes)

Only run if clips have significant dead space (interview footage, long takes with pauses).

```bash
# For clips with spoken content or ambient dead space
auto-editor drone-clips/100MEDIA/DJI_0014.MP4 \
  --margin 0.1sec \
  --output processing/trimmed/drone/DJI_0014_trimmed.mp4

# For Canon clips (likely have more dead space)
for file in timberandthreads-promo-clips/DCIM/100CANON/MVI_*.MP4; do
  basename=$(basename "$file" .MP4)
  auto-editor "$file" \
    --margin 0.3sec \
    --output "processing/trimmed/canon/${basename}_trimmed.mp4"
done
```

**Decision Point:** If drone clips don't have silence (continuous ambient), skip auto-editor and proceed directly to DaVinci Resolve with original files.

### Phase 4: Creative Editing (Manual, 2-4 hours)

**In DaVinci Resolve:**

1. **Create New Project:**
   - File → New Project → "TimberThreads_Promo"
   - Set project location: `resolve-projects/TimberThreads_Promo/`

2. **Set Up Bins:**
   - Create bins: FOOTAGE/Drone, FOOTAGE/Canon, TIMELINES, GFX, AUDIO, TEMP
   - Import trimmed clips (or original files if skipped silence detection):
     - Drone clips → FOOTAGE/Drone bin
     - Canon clips → FOOTAGE/Canon bin

3. **Create Timelines:**
   - **Hero Background Timeline:**
     - Name: "Hero_Background_v1"
     - Resolution: 1920x1080, 30fps
     - Assemble 15-30 second looping drone sequence
     - Select clips with smooth aerial shots, good composition
     - Ensure loop point is seamless (fade or match cut)

   - **Promo Full Timeline:**
     - Name: "Promo_Full_v1"
     - Resolution: 1920x1080, 30fps
     - Assemble 1-2 minute property tour
     - Mix drone aerials with Canon ground footage
     - Add music track (ambient or upbeat depending on tone)
     - Color grade for consistency
     - Adjust pacing with transitions

4. **Color Grading:**
   - Apply consistent color grade across all clips
   - Match drone and Canon footage tonality
   - Enhance natural colors (greenery, wood textures)

5. **Audio Mixing:**
   - Add music track (background, subtle)
   - Mix ambient sound from clips (birds, wind)
   - Balance levels for comfortable listening

6. **Create FINAL Timelines:**
   - Duplicate v1 timelines → rename to FINAL
   - Final review and approval

7. **Export Masters:**
   - File → Export → Deliver
   - Timeline: "Hero_Background_FINAL"
     - Format: QuickTime
     - Codec: Apple ProRes 422 (or DNxHR HQ if on Linux)
     - Resolution: 1920x1080
     - Output: `exports/hero-background-MASTER.mov`

   - Timeline: "Promo_Full_FINAL"
     - Format: QuickTime
     - Codec: Apple ProRes 422
     - Resolution: 1920x1080
     - Output: `exports/promo-full-MASTER.mov`

### Phase 5: Web Compression (15-30 minutes)

```bash
# Compress hero background for web (720p, <5MB target)
ffmpeg -i exports/hero-background-MASTER.mov \
  -c:v libx264 \
  -crf 23 \
  -preset medium \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black" \
  -r 30 \
  -movflags +faststart \
  -c:a aac -b:a 128k \
  processing/compressed/hero-background.mp4

# Check file size
ls -lh processing/compressed/hero-background.mp4

# If >5MB, increase CRF to 24 or 25 and re-encode
# If <3MB and quality is good, can reduce CRF to 22 for better quality

# Compress promo full for web (1080p, <10MB target)
ffmpeg -i exports/promo-full-MASTER.mov \
  -c:v libx264 \
  -crf 23 \
  -preset medium \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:-1:-1:color=black" \
  -movflags +faststart \
  -c:a aac -b:a 128k \
  processing/compressed/promo-full.mp4

# Check file size
ls -lh processing/compressed/promo-full.mp4
```

### Phase 6: Poster Extraction & Deployment (5 minutes)

```bash
# Extract poster images (choose compelling frames)
ffmpeg -i processing/compressed/hero-background.mp4 \
  -ss 00:00:03 -frames:v 1 -q:v 2 \
  processing/compressed/hero-poster.jpg

ffmpeg -i processing/compressed/promo-full.mp4 \
  -ss 00:00:05 -frames:v 1 -q:v 2 \
  processing/compressed/promo-poster.jpg

# Copy final files to public directory
cp processing/compressed/hero-background.mp4 public/assets/videos/
cp processing/compressed/hero-poster.jpg public/assets/videos/
cp processing/compressed/promo-full.mp4 public/assets/videos/
cp processing/compressed/promo-poster.jpg public/assets/videos/

# Verify deployment readiness
ls -lh public/assets/videos/
```

### Processing Order Summary

| Phase | Duration | Parallelizable | Dependencies |
|-------|----------|----------------|--------------|
| 1. Setup & Organization | 5 min | No | None |
| 2. Cataloging | 30-60 min | Yes (per-file) | Phase 1 |
| 3. Silence Detection (optional) | 15-30 min | Yes (per-file) | Phase 2 |
| 4. Creative Editing (Resolve) | 2-4 hours | No | Phase 3 or Phase 2 (if skipping 3) |
| 5. Web Compression | 15-30 min | Yes (per-video) | Phase 4 |
| 6. Poster Extraction & Deployment | 5 min | No | Phase 5 |
| **Total** | **3-6 hours** | - | - |

**Critical Path:** Phase 1 → Phase 2 → Phase 4 (manual) → Phase 5 → Phase 6

**Optional Branch:** Phase 3 (Silence Detection) can be inserted between Phase 2 and Phase 4 if clips have significant dead space.

## Anti-Patterns

### Anti-Pattern 1: Editing Raw Footage Directly in Resolve

**What people do:** Import 20+ raw clips (500-1600MB each) directly into DaVinci Resolve and start editing.

**Why it's wrong:**
- Massive project file size (8+ GB of raw footage)
- Slow playback and rendering in Resolve
- Wasted time scrubbing through dead space
- Difficult to organize and find specific moments
- No archive of which clips were actually used

**Do this instead:** Run cataloging (Phase 2) first to visually browse thumbnails, then optionally trim dead space (Phase 3) before importing into Resolve. Import only the clips you'll actually use.

### Anti-Pattern 2: Exporting Web-Compressed Video Directly from Resolve

**What people do:** Export final timeline directly as H.264 MP4 with web compression settings from DaVinci Resolve.

**Why it's wrong:**
- Can't easily re-export with different compression settings without re-editing
- Difficult to hit exact file size targets (<5MB, <10MB)
- No archive-quality master for future use
- If web requirements change (different resolution, codec, size), must re-export from timeline

**Do this instead:** Export high-quality master (ProRes/DNxHR) from Resolve, then compress separately with FFmpeg. This allows iteration on web compression without touching the creative edit.

### Anti-Pattern 3: Modifying Original Camera Files

**What people do:** Directly trim or compress files in `drone-clips/` and `timberandthreads-promo-clips/` directories.

**Why it's wrong:**
- Destroys original footage
- Can't recover from mistakes
- Violates archival best practices
- May need original files for different projects later

**Do this instead:** Always preserve raw footage untouched. Create processed versions in `processing/` directory. Raw footage is the source of truth.

### Anti-Pattern 4: Skipping Cataloging for "Just a Few Clips"

**What people do:** Skip thumbnail generation and metadata extraction for small projects with 10-25 clips.

**Why it's wrong:**
- Still wastes time opening each file individually to preview
- No quick way to identify best clips
- No verification of file integrity (corrupt files like DJI_0018.MP4)
- Harder to communicate about specific clips with stakeholders

**Do this instead:** Always run cataloging phase. Takes 30-60 minutes upfront, saves hours during editing. Thumbnail contact sheets are invaluable for visual browsing.

### Anti-Pattern 5: Using Resolve's Built-in Delivery for Web Targets

**What people do:** Use DaVinci Resolve's Deliver page to export web-optimized H.264 with file size targets.

**Why it's wrong:**
- Less control over exact compression parameters than FFmpeg
- Harder to script and automate
- Can't easily iterate on compression without re-rendering
- Resolve's H.264 encoder may not match FFmpeg's quality/size balance

**Do this instead:** Use Resolve for creative export (ProRes/DNxHR masters), then FFmpeg for web compression. FFmpeg provides more precise control over CRF, faststart, and file size optimization.

### Anti-Pattern 6: No Version Control for Timelines

**What people do:** Continuously overwrite the same timeline in DaVinci Resolve, or use vague names like "Timeline 1", "Timeline 2".

**Why it's wrong:**
- Can't revert to previous versions if client changes mind
- Unclear which timeline is the approved version
- Difficult to compare different editing approaches

**Do this instead:** Use descriptive, version-controlled timeline names:
- `Hero_Background_v1` → initial edit
- `Hero_Background_v2` → client revisions
- `Hero_Background_FINAL` → approved version for export

Never delete old timeline versions until project is complete and archived.

### Anti-Pattern 7: Storing Master Exports in Resolve Project Directory

**What people do:** Export master files into `resolve-projects/TimberThreads_Promo/exports/` within the Resolve project structure.

**Why it's wrong:**
- Bloats Resolve project directory size
- Harder to share master files independently
- Project backups include massive export files
- Confusing to distinguish project assets from final outputs

**Do this instead:** Store master exports in dedicated `exports/` directory at project root, separate from Resolve project files. Keep project directory clean and focused on creative assets.

## Integration Points

### FFmpeg ↔ DaVinci Resolve

| Integration Point | Pattern | Notes |
|-------------------|---------|-------|
| **Preprocessing: FFmpeg → Resolve** | FFmpeg trimming/silence removal → Resolve imports trimmed clips | Use FFmpeg stream copy (`-c copy`) for lossless trimming before Resolve import |
| **Codec Compatibility: Raw Footage** | DJI drone footage (H.264) and Canon footage (H.264) → Direct import | Both formats natively supported in Resolve 18+ |
| **Codec Compatibility: Master Export** | Resolve exports ProRes/DNxHR → FFmpeg compresses to H.264 | ProRes 422 recommended for macOS, DNxHR HQ for Linux |
| **Metadata Flow** | FFmpeg metadata extraction → User reviews → Resolve import decisions | Use `ffprobe` JSON output to catalog clips before selective import |

### auto-editor ↔ FFmpeg

| Integration Point | Pattern | Notes |
|-------------------|---------|-------|
| **Silence Detection → Trimming** | auto-editor generates cut list → FFmpeg applies cuts | auto-editor can output trimmed video directly, no separate FFmpeg step needed |
| **Margin Configuration** | auto-editor `--margin` flag controls silence padding | Use 0.3sec for dialogue, 0.1sec for ambient footage |
| **Audio Analysis** | auto-editor analyzes audio loudness → identifies silent regions | Threshold configurable, default works for most content |

### Processing Pipeline ↔ Web Deployment

| Integration Point | Pattern | Notes |
|-------------------|---------|-------|
| **Compressed Video → Public** | Copy from `processing/compressed/` to `public/assets/videos/` | Final step before git commit and deployment |
| **Poster Images → Public** | FFmpeg extraction → Copy to `public/assets/videos/` | Extract at compelling timestamp (3-5 seconds) |
| **Size Verification** | Check file sizes before deployment | Hero <5MB, Promo <10MB. Increase CRF if over target. |

### External Tool Dependencies

| Tool | Purpose | Installation | Version Requirements |
|------|---------|--------------|----------------------|
| **FFmpeg** | Video processing, compression, thumbnail extraction, metadata extraction | `brew install ffmpeg` (macOS), `apt install ffmpeg` (Linux) | 4.4+ (current: 6.x recommended) |
| **auto-editor** | Silence detection and automatic trimming | `pip install auto-editor` | Latest from PyPI |
| **DaVinci Resolve** | Creative editing, color grading, timeline assembly | Download from Blackmagic Design | 18.6+ or 19+ (free version sufficient) |
| **ffprobe** | Metadata extraction (included with FFmpeg) | Installed with FFmpeg | Same as FFmpeg |

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| **1-3 projects/year** | Current architecture is perfect. Manual processing, ad-hoc scripts, local storage. |
| **5-10 projects/year** | Create reusable bash scripts for cataloging and compression phases. Standardize Resolve project templates. Consider dedicated processing workstation. |
| **20+ projects/year** | Automate entire CLI pipeline with orchestration scripts. Set up network-attached storage (NAS) for raw footage archive. Create Resolve project templates with pre-configured bins, color grades, and timeline structures. |

### Scaling Priorities

1. **First bottleneck: Manual cataloging for each project**
   - **Fix:** Create bash script to automate thumbnail + metadata extraction for any directory of video files.
   - **When:** After 3-5 projects with this workflow.

2. **Second bottleneck: Repetitive compression parameter tuning**
   - **Fix:** Create compression presets script with predefined CRF values for different size targets (3MB, 5MB, 10MB, 20MB).
   - **When:** When spending >30 minutes per project tweaking compression settings.

3. **Third bottleneck: Raw footage storage management**
   - **Fix:** Implement archival workflow (external drives or NAS) with organized directory structure by project and date.
   - **When:** Local storage exceeds 500GB of raw footage.

### Storage Requirements

| Stage | Storage per Project | Lifecycle |
|-------|---------------------|-----------|
| **Raw Footage** | 4-8 GB | Archive permanently |
| **Processing Workspace** | 2-4 GB | Keep until project complete, then delete |
| **Trimmed Clips** | 2-3 GB | Keep until export complete, then optional |
| **Master Exports** | 10-50 GB | Archive permanently |
| **Web Compressed** | 15-50 MB | Permanent (deployed) |
| **Total per Project** | **15-60 GB** | - |

**Recommendation:** 1TB SSD for active projects + 2-4TB external HDD for raw footage and master export archive.

## Performance Optimization

### FFmpeg Optimization Flags

| Optimization | Flag | Purpose | Trade-off |
|--------------|------|---------|-----------|
| **Preset** | `-preset medium` | Balance encoding speed vs. compression efficiency | `fast` = quicker but larger files, `slow` = smaller files but longer encoding |
| **CRF** | `-crf 23` | Quality vs. file size balance | Lower = better quality + larger file, Higher = worse quality + smaller file |
| **Faststart** | `-movflags +faststart` | Web streaming optimization (moov atom at start) | Slight processing overhead, essential for web video |
| **Hardware Acceleration** | `-hwaccel auto` | Use GPU for encoding (NVIDIA/AMD/Intel) | Not always available, compatibility varies |

### DaVinci Resolve Performance

| Optimization | Technique | Benefit |
|--------------|-----------|---------|
| **Proxy Mode** | Generate optimized media (proxy files) for large raw clips | Smoother playback, faster editing |
| **Timeline Resolution** | Edit at 1080p even if final export is 4K | Faster preview rendering |
| **Render Cache** | Enable Smart Cache for effects-heavy sections | Real-time playback |
| **GPU Acceleration** | Use dedicated GPU (NVIDIA/AMD) | Faster color grading, effects rendering |

### Parallel Processing

**Cataloging phase (Phase 2) - Parallelizable:**
```bash
# Process all drone clips in parallel (requires GNU Parallel)
find drone-clips/100MEDIA -name "*.MP4" | \
  parallel 'ffmpeg -i {} -ss 00:00:05 -frames:v 1 -vf "scale=320:180" -q:v 2 processing/catalog/drone/{/.}-thumb.jpg'
```

**Silence detection (Phase 3) - Parallelizable:**
```bash
# Process multiple clips concurrently
ls timberandthreads-promo-clips/DCIM/100CANON/*.MP4 | \
  parallel 'auto-editor {} --margin 0.3sec --output processing/trimmed/canon/{/.}_trimmed.mp4'
```

**Creative editing (Phase 4) - NOT parallelizable:**
Manual work in DaVinci Resolve, sequential.

**Web compression (Phase 5) - Parallelizable:**
```bash
# Compress hero and promo concurrently
ffmpeg -i exports/hero-background-MASTER.mov ... public/assets/videos/hero-background.mp4 &
ffmpeg -i exports/promo-full-MASTER.mov ... public/assets/videos/promo-full.mp4 &
wait
```

## Sources

### Video Pipeline Architecture
- [Cires21 MediaCopilot streamlines video content creation with AWS](https://aws.amazon.com/blogs/media/cires21-mediacopilot-streamlines-video-content-creation-with-aws/)
- [Scaling Enterprise Production With a 2026 Bay Area Video Pipeline - iStudiosMedia](https://istudiosmedia.com/bay-area-video-pipeline-scaling-enterprise-production/)
- [Understanding Video Pipelines for Developers - Fastpix](https://www.fastpix.io/blog/a-complete-guide-to-video-pipelines)

### FFmpeg & DaVinci Resolve Integration
- [DaVinci Resolve FFmpeg cheatsheet for Linux - Alecaddd](https://alecaddd.com/davinci-resolve-ffmpeg-cheatsheet-for-linux/)
- [Exchanging video between DaVinci Resolve and FFMPEG - Coert Vonk](https://coertvonk.com/other/videoediting/exchanging-video-between-davinci-resolve-and-ffmpeg-32871)
- [Thoughts on using FFMPEG instead of Davinci Resolve - Curio Museum](https://curiosalon.github.io/blog/ffmpeg-vs-davinci-resolve/)

### File Organization Best Practices
- [A Project Folder Structure for DaVinci Resolve - The Post Flow](https://thepostflow.com/post-production/a-project-folder-structure-designed-for-davinci-resolve/)
- [Optimize your DaVinci Resolve workflow: File Structure & Media Management - Rees Gibbons](https://www.reesgibbons.com/cinematic-trails/optimize-your-davinci-resolve-workflow-file-structure-media-management)
- [5 Pro Tips for Organizing Your Video Files - Artgrid](https://artgrid.io/insights/how-to-organize-your-video-files/)
- [Video Post-Production Workflow Guide - Frame.io](https://workflow.frame.io/guide/)

### Silence Detection & Auto-Editing
- [auto-editor PyPI](https://pypi.org/project/auto-editor/)
- [The 5 Best Tools for Cutting Silences from Your Videos - Kapwing](https://www.kapwing.com/resources/the-best-way-to-remove-silences-from-videos-automatically/)
- [AI Video Editing in 2026: Best Tools, Workflows & Automation](https://cutback.video/blog/ai-video-editing-in-2026-best-tools-workflows-automation-explained)

### FFmpeg Thumbnail & Metadata Extraction
- [Extracting video covers, thumbnails and previews with ffmpeg - Tech Couch](https://www.tech-couch.com/post/extracting-video-covers-thumbnails-and-previews-with-ffmpeg)
- [Extract thumbnails from a video with FFmpeg - Mux](https://www.mux.com/articles/extract-thumbnails-from-a-video-with-ffmpeg)
- [FFmpeg Mastery: Extracting Perfect Thumbnails from Videos - Medium](https://medium.com/@sergiu.savva/ffmpeg-mastery-extracting-perfect-thumbnails-from-videos-339a4229bb32)
- [FFprobe Analysis: Extract Media Metadata - FFmpeg API](https://ffmpeg-api.com/docs/ffprobe)

### H.264 Compression Best Practices
- [CRF Guide (Constant Rate Factor in x264, x265 and libvpx) - slhck](https://slhck.info/video/2017/02/24/crf-guide.html)
- [FFmpeg Compress Video Guide for Beginners - Cloudinary](https://cloudinary.com/guides/video-effects/ffmpeg-compress-video)
- [Optimize Video Quality with Capped CRF Streaming - Fastpix](https://www.fastpix.io/blog/video-streaming-with-capped-crf)

---
*Architecture research for: Video editing pipeline integrating FFmpeg + auto-editor CLI with DaVinci Resolve*
*Researched: 2026-02-16*
