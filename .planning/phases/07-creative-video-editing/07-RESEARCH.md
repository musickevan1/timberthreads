# Phase 7: Creative Video Editing - Research

**Researched:** 2026-02-16
**Domain:** DaVinci Resolve Creative Video Editing & Color Grading
**Confidence:** MEDIUM-HIGH

## Summary

Phase 7 transitions from CLI automation (Phase 6) to human-driven creative editing in DaVinci Resolve. This is a MANUAL phase where the human editor performs creative decisions that cannot be automated: shot selection, pacing, storytelling, color grading aesthetic choices, and music synchronization. Claude Code's role is limited to preparing inputs, providing guidance, and processing outputs.

The industry-standard workflow separates creative editing from web compression to preserve quality: preprocessed clips → creative editing in high-quality intermediate codec → master export → web compression. DaVinci Resolve is the professional tool for this work, combining editing, color grading, and audio mixing in one application used by Hollywood studios and professional editors worldwide.

Phase 7 outputs: 2-3 hero loop candidates (15-30s each, requirement conflicts with 6-8s web research) and 1 full promo timeline (1-2min), all color graded with warm tones (increased oranges, reduced blues) for peaceful/cozy aesthetic. Master exports use ProRes 422 or DNxHR HQ to avoid double compression when Phase 8 creates web deliverables.

Available inputs from Phase 6: 5 drone clips (1080p30, 110-350s each), 21 Canon interior clips (1080p60, 1.5-130s each), trimmed to processing/trimmed/ with DJI metadata preserved. Silence analysis shows most Canon clips have active audio (96-100% non-silent), with MVI_4254 having significant silent segments.

**Primary recommendation:** Structure Phase 7 as human action checkpoints with preparation and verification tasks. Claude Code creates DaVinci Resolve project structure, documents workflows, and verifies outputs, but CANNOT perform creative editing. Plans must clearly delineate "USER ACTION REQUIRED" sections with step-by-step guidance for Resolve operations.

**Critical gap:** Hero loop duration requirement (15-30s) conflicts with web best practices research (6-8s optimal, 10-15s maximum). User must confirm target duration before assembling hero candidates.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| DaVinci Resolve | 20+ (latest: Aug 2025) | Professional non-linear editing, color grading, audio mixing | Industry standard used by Netflix, Hollywood studios, professional editors. Free version sufficient for this project. Combines Cut/Edit, Color, Fairlight (audio), and Deliver pages. |
| ProRes 422 or DNxHR HQ | N/A (codec) | Master export intermediate codec | Lossless/near-lossless quality for archival and prevents double compression. ProRes is Apple standard (better macOS), DNxHR is Avid standard (cross-platform). Both preserve quality for Phase 8 web compression. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Royalty-free music (Artlist, TunePocket, Bensound) | N/A | Acoustic/gentle piano background track for promo | Required for EDIT-02 (music sync). License must allow commercial use. Artlist/TunePocket offer subscription unlimited licenses. |
| Color grading LUTs (optional) | N/A | Preset warm tone starting points | Optional for faster color grading workflow. Can create custom look from scratch using Color Wheels. |
| Reference images (optional) | N/A | Peaceful/cozy aesthetic examples | Useful for visualizing target warm tone aesthetic before grading. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| DaVinci Resolve | Adobe Premiere Pro | Premiere is popular but weaker color grading tools. Resolve's Color page is industry-leading. Free Resolve version has no time limits. |
| DaVinci Resolve | Final Cut Pro X | FCPX is macOS-only, requires purchase. Resolve is cross-platform and free. FCPX lacks Resolve's professional color tools. |
| ProRes 422 | H.264 master | H.264 is delivery codec, not intermediate. Re-encoding H.264 to web H.264 (Phase 8) causes generation loss. ProRes prevents this. |
| Manual bin organization | Smart Bins (AI auto-sort) | Smart Bins are powerful but overkill for 26 clips. Manual bins (Drone, Canon, Audio, Graphics) are clearer and faster to set up. |

**Installation:**

```bash
# DaVinci Resolve (if not installed)
# Download from: https://www.blackmagicdesign.com/products/davinciresolve/
# Free version sufficient (Studio version adds noise reduction, HDR tools not needed here)

# Verify system requirements:
# - 16GB RAM minimum (32GB recommended for 1080p60 Canon clips)
# - NVIDIA/AMD GPU with 4GB VRAM (color grading accelerated)
# - 50GB free disk space for cache and renders
```

## Architecture Patterns

### Recommended Project Structure

```
DaVinci Resolve Project: Timber & Threads Promo
├── Media Pool
│   ├── Master (root bin - contains all media)
│   ├── Drone/                   # 5 DJI clips from processing/trimmed/drone/
│   ├── Canon/                   # 21 interior clips from processing/trimmed/interior/
│   ├── Audio/                   # Music track (acoustic/piano)
│   └── Graphics/                # Optional: title cards, logo (if needed)
│
├── Timelines
│   ├── Hero_v1                  # First hero loop candidate (15-30s)
│   ├── Hero_v2                  # Second hero loop candidate
│   ├── Hero_v3                  # Third hero loop candidate (optional)
│   ├── Promo_v1                 # Full promo video first pass
│   ├── Promo_v2                 # Promo revision (after feedback)
│   └── Promo_FINAL              # Final approved promo timeline
│
└── Exports (Deliver page outputs)
    ├── Hero_v1_master.mov       # ProRes 422 or DNxHR HQ
    ├── Hero_v2_master.mov
    ├── Promo_v1_master.mov
    └── Promo_FINAL_master.mov
```

**Note:** DaVinci Resolve stores project database separately from media files. Media remains in `processing/trimmed/` directories (linked, not copied).

### Pattern 1: Bin Organization for Small Projects

**What:** Organize Media Pool into logical bins based on camera/content type.

**When to use:** Projects with <100 clips where manual organization is faster than Smart Bins.

**Example:**

```
User Action in DaVinci Resolve:
1. Media Page → Media Pool panel (top-left)
2. Right-click Master bin → New Bin → "Drone"
3. Repeat for "Canon", "Audio", "Graphics"
4. Drag clips from file browser into appropriate bins
5. Verify all clips linked successfully (no red "Media Offline" icons)
```

**Source:** [DaVinci Resolve Manual - Organizing Media into Bins](https://www.steakunderwater.com/VFXPedia/__man/Resolve18-6/DaVinciResolve18_Manual_files/part630.htm)

### Pattern 2: Timeline Versioning with Duplication

**What:** Duplicate timelines before major changes to preserve edit history without undo limits.

**When to use:** Before starting each editing pass, after client feedback, before final export.

**Example:**

```
User Action in DaVinci Resolve:
1. Edit Page → Right-click timeline in Media Pool → Duplicate Timeline
2. Rename duplicated timeline to increment version: "Promo_v1" → "Promo_v2"
3. Disable original timeline (right-click → Disable) to prevent accidental edits
4. Work on new version timeline
5. Keep all versions until project completion
```

**Source:** [Backup Timeline in DaVinci Resolve 18.5](https://beginnersapproach.com/davinci-resolve-backup-timeline/)

**Critical:** DaVinci Resolve 18.5+ has automatic timeline backups (GFS scheme), but manual duplication is still best practice for major milestones. Enable in Preferences → User → Project Save and Load → Timeline Backups.

### Pattern 3: Seamless Video Loop Creation

**What:** Create hero background video that loops continuously without visible jump from end to start.

**When to use:** Hero video requirement (HERO-04) needs seamless looping for website autoplay.

**Technique:**

1. **Frame Matching:** Find start and end frames with similar visual elements (camera position, subject placement, lighting). The more alike the frames, the more seamless the loop.
2. **Trim to Match:** Set In/Out points where motion/lighting cycles naturally repeat. Drone pan/tilt movements work well (full 360° rotation or return to origin).
3. **Crossfade Transition:** Apply 0.5-1s crossfade between end and start if frames don't match perfectly. Test by looping timeline 3+ times.
4. **Audio:** Hero video is muted (HERO-01 requirement), so audio sync irrelevant.

**Example:**

```
User Action in DaVinci Resolve:
1. Edit Page → Create timeline "Hero_v1_test_loop"
2. Add selected drone clip to timeline
3. Scrub through footage to find visually similar start/end points
4. Trim timeline to selected segment (15-30s)
5. Right-click timeline → Loop Playback
6. Play and watch transition from end to start
7. If jarring: adjust Out point or add crossfade (Effects Library → Video Transitions → Cross Dissolve)
8. Test loop 3-5 times to verify seamlessness
```

**Source:** [How to Create a Seamless Video Loop](https://www.oreateai.com/blog/how-to-create-a-seamless-video-loop/d045d09da2657867ea7df8ff84676f38)

**Warning:** Requirements specify 15-30s hero loops, but web research recommends 6-8s (max 10-15s) for performance and user engagement. Longer loops increase file size and delay loop restart. USER MUST CONFIRM target duration before editing.

### Pattern 4: Warm Tone Color Grading

**What:** Apply warm color grading (increased oranges, reduced blues) to create peaceful/cozy aesthetic.

**When to use:** All footage (drone + Canon) per EDIT-01 requirement.

**Technique:**

DaVinci Resolve Color Wheels method:
1. **Lift (Shadows):** Push slightly toward orange/yellow to warm shadows, reduce blue cast
2. **Gamma (Midtones):** Add warmth to skin tones and ambient interior lighting
3. **Gain (Highlights):** Enhance warm highlights (sunlight, window light)
4. **Temperature/Tint:** Shift global temperature toward warm (right on slider), adjust magenta/green if needed

**Example:**

```
User Action in DaVinci Resolve Color Page:
1. Select clip in timeline
2. Color Page → Primary Wheels panel
3. Temperature slider: Move right (+10 to +20 for subtle warmth)
4. Lift Wheel: Push center dot slightly toward orange (lower-right quadrant)
5. Gamma Wheel: Push toward yellow-orange for midtone warmth
6. Gain Wheel: Slight orange in highlights (optional, avoid over-saturation)
7. Reduce blue/teal in shadows: Lift Wheel opposite side (away from blue)
8. Apply to all clips: Right-click clip → Memory → Save Still → Apply to other clips
```

**Source:** [DaVinci Resolve Color Grading Tutorial](https://www.storyblocks.com/resources/tutorials/davinci-resolve-color-grading)

**Note:** Traditional "orange and teal" look pushes blues into shadows and oranges into highlights for contrast. For peaceful/cozy aesthetic, reduce teal/blue entirely and emphasize warm oranges/yellows throughout the tonal range.

### Pattern 5: Music Sync to Visual Pacing

**What:** Synchronize music track beats/phrases with visual cuts for cohesive storytelling.

**When to use:** Promo video (EDIT-02 requirement). Not applicable to muted hero video.

**Technique:**

1. **Waveform Matching:** Import music to timeline, expand audio waveform to see beats/phrases visually
2. **Cut on Beats:** Place visual cuts (drone → interior, scene changes) on music beats or phrase transitions
3. **Pacing:** Match visual pacing to music tempo (slow piano = longer clips, faster acoustic = quicker cuts)
4. **Ambient Audio Mix:** Layer Canon clip ambient audio under music at reduced volume (-12dB to -18dB) for environmental presence

**Example:**

```
User Action in DaVinci Resolve:
1. Edit Page → Add music track to timeline (separate audio track)
2. Expand audio waveform (zoom vertical timeline tracks)
3. Identify beat markers or phrase changes in waveform
4. Scrub video to find compelling cut points
5. Align video cuts with music beats (Edit tool: Blade, Trim, Ripple)
6. Fairlight Page → Mix ambient audio from Canon clips:
   - Music track: 0dB (full volume)
   - Canon ambient: -12dB to -18dB (subtle background)
7. Add crossfades between audio clips to avoid pops/clicks
```

**Source:** [Ultimate Guide to Sync Audio and Video in DaVinci Resolve](https://www.hollyland.com/blog/tips/sync-audio-and-video-in-davinci-resolve)

### Pattern 6: Master Export Settings

**What:** Export finished timelines as high-quality master files for archival and web compression (Phase 8).

**When to use:** After finalizing hero loop candidates and promo timeline.

**Settings:**

```
DaVinci Resolve Deliver Page Export Settings:

Format: QuickTime
Codec: ProRes 422 (or DNxHR HQ if cross-platform needed)
Resolution: Match timeline (1920x1080)
Frame Rate: Match timeline (30fps for hero/drone, 30fps or 60fps for promo)
Quality: ProRes 422 HQ (higher quality) or ProRes 422 (standard, smaller file)

Audio Codec: Linear PCM (uncompressed) or AAC 256kbps
Audio Channels: Stereo (promo), None (hero - muted)

Color Space: Match timeline (Rec.709 for web delivery)

Rendering:
- Single Clip mode (exports entire timeline as one file)
- Filename: [Timeline Name]_master.mov
```

**Source:** [How to Export in DaVinci Resolve | Best Export Settings](https://www.miracamp.com/learn/davinci-resolve/export-settings)

**Critical:** ProRes 422 files are LARGE (1GB+ for 2min 1080p). This is expected for master files. Phase 8 compresses to <5MB/<10MB web targets.

### Anti-Patterns to Avoid

- **Editing raw clips directly:** Never edit from `drone-clips/` or `timberandthreads-promo-clips/` directly. Use trimmed clips from `processing/trimmed/` which preserve metadata and are prepared for Resolve import.
- **Exporting H.264 masters:** H.264 is delivery codec, not intermediate. Always export ProRes/DNxHR masters to avoid generation loss when compressing to web H.264 in Phase 8.
- **Forgetting timeline versions:** Overwriting timelines loses edit history. Always duplicate before major changes.
- **Skipping color grading consistency checks:** Grade one clip, then compare side-by-side with other clips to ensure consistent warm tone aesthetic across entire video.
- **Music licensing mistakes:** Verify royalty-free license allows commercial use. Free personal-use-only tracks can cause legal issues for client business websites.
- **Ignoring audio levels:** Promo video needs balanced music + ambient audio. Avoid music overpowering dialogue or ambient sound being inaudible.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color grading automation | CLI scripts to batch-apply LUTs | DaVinci Resolve Color page with human eye | Color grading requires creative judgment. Automated LUTs can't adapt to lighting variations, skin tones, or aesthetic intent. |
| Video editing automation | FFmpeg concatenation scripts | DaVinci Resolve Edit page with human pacing decisions | Storytelling requires creative shot selection, pacing, and flow that algorithms can't replicate. |
| Music synchronization | Auto-beat detection scripts | Human editor aligning cuts to music by ear/eye | Music pacing is creative decision. Auto-beat detection misses phrase changes, emotional peaks, and subtle timing. |
| Seamless loop detection | Computer vision to find matching frames | Human editor scrubbing footage and testing loops | Loop quality depends on motion flow, not just pixel similarity. Human eye catches jarring transitions computers miss. |
| Quality control | Automated QA checks | Human playback and iteration | Final quality judgment (color, pacing, flow) requires human aesthetic evaluation. |

**Key insight:** Phase 7 is fundamentally about CREATIVE DECISIONS that cannot be automated. AI tools in Resolve (Magic Mask, Smart Reframe) can assist with technical tasks, but creative editing, color aesthetic, and pacing require human judgment. Claude Code's role is documentation and verification, not execution.

## Common Pitfalls

### Pitfall 1: Metadata Loss on Resolve Import

**What goes wrong:** DJI clips imported into Resolve lose stabilization metadata, breaking gyro-based stabilization features.

**Why it happens:** Resolve's media relinking can strip metadata if clips are moved or renamed after import. FFmpeg-trimmed clips may not preserve all DJI metadata streams.

**How to avoid:** Verify metadata preservation immediately after import. Stabilization panel should show gyroscope data for DJI clips. If missing, re-import from original `drone-clips/` directory.

**Warning signs:** Resolve stabilization panel shows "no gyroscope data found" for DJI footage.

### Pitfall 2: Frame Rate Mismatch Between Clips

**What goes wrong:** Timeline mixing 30fps drone and 60fps Canon clips causes stutter or slow motion effects.

**Why it happens:** Resolve timeline frame rate defaults to first clip added. Mixing frame rates without Resolve's optical flow re-timing creates jerky playback.

**How to avoid:** Set timeline frame rate explicitly (30fps recommended to match drone footage). Resolve will automatically conform 60fps Canon clips to 30fps using frame blending or optical flow.

**Warning signs:** Canon clips play in slow motion on 30fps timeline, or stutter during playback.

**Confidence:** HIGH - Phase 6 research noted Canon clips kept at 60fps specifically for Resolve to handle conversion with optical flow.

### Pitfall 3: Hero Loop Duration Conflict

**What goes wrong:** Requirement specifies 15-30s hero loops, but web research shows 6-8s optimal (max 10-15s) for performance and user engagement.

**Why it happens:** Requirements written before web best practices research. Longer loops = larger files, slower page load, delayed loop restart perception.

**How to avoid:** USER MUST CONFIRM target hero loop duration before editing. If 15-30s is firm requirement, client accepts performance tradeoff. If flexible, recommend 8-12s loops.

**Warning signs:** This is a KNOWN conflict flagged during research. Address before starting hero editing.

**Confidence:** HIGH - Multiple web sources ([How to Optimize Background Video](https://designtlc.com/how-to-optimize-a-silent-background-video-for-your-websites-hero-area/), [Best Practices](https://www.thegeckoagency.com/best-practices-for-filming-choosing-and-placing-a-hero-video-on-your-website/)) cite 5-15s range.

### Pitfall 4: Color Grading Inconsistency Across Clips

**What goes wrong:** Drone footage and Canon interior footage have drastically different warm tone grading, breaking visual cohesion.

**Why it happens:** Drone outdoor footage has blue sky and natural light, Canon interior has tungsten/LED lighting. Same color grading settings produce different results.

**How to avoid:** Grade clips in context (side-by-side comparison). Use Resolve's Split Screen mode to compare drone/Canon clips simultaneously. Adjust per-clip to match overall warm aesthetic, not cookie-cutter settings.

**Warning signs:** Promo video has jarring color shifts when cutting from drone to interior footage.

### Pitfall 5: Forgetting to Export Timeline Versions

**What goes wrong:** Only Promo_FINAL is exported. Client requests revision to v2 cut, but v2 master doesn't exist.

**Why it happens:** Exporting is time-consuming (ProRes renders take 5-10min per timeline). Temptation to export only final version.

**How to avoid:** Export master for EVERY timeline version per EDIT-04 requirement. Storage is cheap, re-rendering is expensive.

**Warning signs:** Client asks "can we go back to the cut before the last change?" and no v2 master exists.

### Pitfall 6: Music Licensing Ambiguity

**What goes wrong:** Used free royalty-free track that's personal-use-only, client's commercial website violates license.

**Why it happens:** Many "free" music sites restrict commercial use. Licenses buried in fine print.

**How to avoid:** Verify license explicitly allows commercial use for business websites. Artlist/TunePocket subscriptions include commercial licenses. Free Bensound tracks require attribution unless upgraded.

**Warning signs:** License page says "non-commercial" or "personal use" anywhere.

## Code Examples

N/A - This phase is MANUAL HUMAN WORK in DaVinci Resolve GUI. No code automation possible.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate apps (edit, color, audio) | DaVinci Resolve integrated pages | Resolve 12 (2015) | Edit, Color, Fairlight pages in one app eliminates round-tripping. Faster workflow. |
| Manual color matching clip-to-clip | AI Color Match tools | Resolve 17 (2020) | Magic Mask, AI-based skin tone isolation speeds technical tasks, human still judges aesthetic. |
| Offline/online editing (proxies required) | Native high-res editing on modern GPUs | 2020+ GPU improvements | 1080p60 edits smoothly on mid-range hardware. Proxies optional, not required. |
| LUT-based color grading | Node-based grading with custom curves | Resolve 14+ (2017) | More flexible than LUTs. Still images preserve creative choices. |
| Subscription-only professional tools | DaVinci Resolve Free (no time limits) | Resolve 12+ (2015-present) | Free version rivals paid competitors. Studio version adds HDR/noise reduction (not needed here). |

**Deprecated/outdated:**

- **XML roundtrip workflows:** Legacy method to move projects between Premiere/FCP/Resolve. Modern Resolve is primary NLE, no roundtrip needed.
- **Resolve Lite (legacy free version):** Replaced by DaVinci Resolve Free (no watermark, no time limits, nearly all features of Studio).

## Open Questions

### 1. Hero Loop Duration Confirmation

**What we know:** Requirements specify 15-30s hero loops (HERO-04). Web research recommends 6-8s optimal, 10-15s max for performance.

**What's unclear:** Is 15-30s a firm requirement, or can it be adjusted based on web best practices?

**Recommendation:** USER MUST DECIDE before Phase 7 planning. If 15-30s is flexible, recommend 8-12s target. If firm, document performance tradeoff for client (larger files, slower page load).

**Confidence:** HIGH - This is a clear conflict between requirements and research.

### 2. Music Track Selection

**What we know:** EDIT-02 requires acoustic/gentle piano music synced to visual pacing. No specific track selected.

**What's unclear:** Who selects music track? User/client preference for specific mood within "acoustic/gentle piano" category?

**Recommendation:** Include music selection as USER ACTION REQUIRED in Phase 7 plan. Provide 2-3 track options from Artlist/Bensound for client approval before editing promo timeline.

**Confidence:** MEDIUM - Common workflow is client approves music before editorial lock.

### 3. Canon Clip Frame Rate Handling

**What we know:** Canon clips are 60fps. Phase 6 deliberately kept them at 60fps for Resolve to handle conversion. Drone clips are 30fps.

**What's unclear:** Should hero loops use 60fps Canon clips (if selected), or only 30fps drone clips for consistency?

**Recommendation:** Promo timeline can mix 30fps/60fps (Resolve handles conversion). Hero loops should use ONLY 30fps drone footage to avoid frame rate conversion complexity and ensure smallest file size.

**Confidence:** MEDIUM-HIGH - Web video best practices prefer consistent frame rate, especially for background videos.

### 4. Resolve Project Save Location

**What we know:** DaVinci Resolve stores project database separately from media files. Default location varies by OS.

**What's unclear:** Where should Resolve project database be saved for this project? Same repo, or separate location?

**Recommendation:** Save Resolve project database to `.planning/phases/07-creative-video-editing/resolve-project/` (within repo for version control). Link media from `processing/trimmed/` directories.

**Confidence:** MEDIUM - Resolve projects are small (database only), reasonable to version control alongside plans.

## Workflow Guidance for Phase 7 Plans

Since this phase is MANUAL HUMAN WORK, plans should structure tasks as:

### Preparation Tasks (Claude Code)
- Create directory structure for Resolve project and exports
- Document Resolve project setup steps (bin structure, timeline settings)
- Prepare music track selection guidance

### USER ACTION REQUIRED Sections
- Import media into Resolve bins
- Create hero loop timelines with seamless loop testing
- Color grade footage with warm tone aesthetic
- Assemble promo timeline with music sync
- Export master files (ProRes 422)

### Verification Tasks (Claude Code)
- Validate exported master files (duration, codec, resolution)
- Verify file sizes reasonable for intermediate codecs
- Document exported timeline versions for Phase 8 input

Plans must clearly mark which tasks are automated (Claude Code) vs. manual (USER).

## Sources

### Primary (HIGH confidence)

- [DaVinci Resolve Official](https://www.blackmagicdesign.com/products/davinciresolve) - Current version, features, system requirements
- [DaVinci Resolve Training Resources](https://www.blackmagicdesign.com/products/davinciresolve/training) - Official workflows and tutorials
- [DaVinci Resolve Manual - Organizing Media into Bins](https://www.steakunderwater.com/VFXPedia/__man/Resolve18-6/DaVinciResolve18_Manual_files/part630.htm) - Official documentation
- [DaVinci Resolve Manual - Backing Up Timelines](https://www.steakunderwater.com/VFXPedia/__man/Resolve18-6/DaVinciResolve18_Manual_files/part841.htm) - Official versioning workflow
- [How to Export in DaVinci Resolve - Best Export Settings](https://www.miracamp.com/learn/davinci-resolve/export-settings) - ProRes/DNxHR master export
- [DaVinci Resolve Color Grading Guide](https://www.storyblocks.com/resources/tutorials/davinci-resolve-color-grading) - Color Wheels techniques

### Secondary (MEDIUM confidence)

- [DaVinci Resolve Video Editing Workflow](https://www.skillshare.com/en/classes/davinci-resolve-the-video-editing-workflow/1825684588) - Industry workflow patterns
- [Mastering Media Organization in DaVinci Resolve](https://gotranscript.com/public/mastering-media-organization-in-davinci-resolve-a-beginners-guide) - Bin structure best practices
- [Backup Timeline in DaVinci Resolve 18.5](https://beginnersapproach.com/davinci-resolve-backup-timeline/) - Timeline versioning methods
- [Managing Projects in DaVinci Resolve – Backups](https://larryjordan.com/articles/managing-projects-in-davinci-resolve-backups-exports-and-archives/) - Project management best practices
- [DaVinci Resolve AI Workflow](https://photography.tutsplus.com/articles/davinci-resolve-ai--cms-109186) - AI tools vs. human creative decisions
- [How to Create a Seamless Video Loop](https://www.oreateai.com/blog/how-to-create-a-seamless-video-loop/d045d09da2657867ea7df8ff84676f38) - Loop editing techniques
- [Ultimate Guide to Sync Audio and Video in DaVinci Resolve](https://www.hollyland.com/blog/tips/sync-audio-and-video-in-davinci-resolve) - Music sync workflow
- [Teal and Orange Color Grading](https://www.mauriziomercorella.com/color-grading-blog/teal-and-orange-look-modern-color-grading) - Warm/cool color theory
- [Color Grading Essentials: 5 Styles to Enhance Videos](https://olivetreefilms.com/blog/color-grading-5-styles-to-enhance-your-videos/) - Warm tone techniques
- [How to Optimize Background Video for Hero Area](https://designtlc.com/how-to-optimize-a-silent-background-video-for-your-websites-hero-area/) - Hero video duration best practices (6-8s)
- [Best Practices for Hero Videos](https://www.thegeckoagency.com/best-practices-for-filming-choosing-and-placing-a-hero-video-on-your-website/) - Loop duration recommendations (10-15s max)
- [Royalty Free Music for Video Creators - Artlist](https://artlist.io/royalty-free-music) - Music licensing platforms
- [Royalty Free Music - TunePocket](https://www.tunepocket.com/royalty-free-music/) - Alternative music licensing
- [Tenderness - Gentle Acoustic Music - Bensound](https://www.bensound.com/royalty-free-music/track/tenderness) - Example acoustic/piano track

### Tertiary (LOW confidence - requires validation)

- WebSearch results on DaVinci Resolve workflows - Multiple sources agree on core concepts, but specific version features may vary
- Music licensing platform comparisons - Pricing and licensing terms change frequently, verify current terms before use

## Metadata

**Confidence breakdown:**

- **Standard stack:** HIGH - DaVinci Resolve is undisputed industry standard for color grading and professional editing. ProRes/DNxHR master workflow verified across multiple authoritative sources.
- **Architecture:** MEDIUM-HIGH - Bin structure and timeline versioning patterns verified via official Resolve documentation. Workflow guidance based on professional editing best practices but not project-specific tested.
- **Pitfalls:** MEDIUM - Frame rate mismatch, metadata loss, and export versioning pitfalls verified via official docs and professional forums. Hero loop duration conflict is HIGH confidence (requirements vs. web research contradiction).
- **Creative techniques:** MEDIUM - Color grading and loop creation techniques verified via multiple tutorials and professional guides, but creative execution depends on human skill and aesthetic judgment.
- **Open questions:** HIGH - Hero loop duration conflict is documented in requirements vs. research. Music selection and Resolve project location are standard workflow decisions requiring user input.

**Research date:** 2026-02-16
**Valid until:** 2026-04-16 (60 days - DaVinci Resolve updates quarterly, but core workflow patterns stable. Revalidate if Resolve 21 releases.)

**Critical limitation:** This research cannot provide step-by-step Resolve instructions for every creative decision. Plans must acknowledge USER's creative freedom within documented workflow patterns.
