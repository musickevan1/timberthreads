# DaVinci Resolve Workflow Guide - Timber & Threads Promo

**Phase 7 Plan 01 - Hero Loop Creation**

This guide accompanies Phase 7 creative editing work. Follow sections in order for creating hero loop candidates in DaVinci Resolve. Duration placeholder [HERO_DURATION] will be filled after Task 2 decision.

---

## Section 1: Project Setup

### 1.1 Create New Project

1. Launch DaVinci Resolve
2. Project Manager > New Project
3. Name: "Timber & Threads Promo"
4. Click Create

### 1.2 Configure Project Settings

1. File > Project Settings (or gear icon in bottom-right)
2. Master Settings tab:
   - **Timeline resolution:** 1920x1080 HD
   - **Timeline frame rate:** 30fps (matches drone footage)
   - **Playback frame rate:** 30fps
3. Click Save

**Why 30fps:** Drone clips are 30fps. Canon interior clips are 60fps but will auto-conform in 30fps timeline using optical flow interpolation (decided in Phase 6).

### 1.3 Create Media Pool Bins

1. Media Page (bottom tab bar)
2. Media Pool panel (top-left)
3. Right-click "Master" bin > New Bin > Name: "Drone"
4. Repeat to create bins:
   - **Canon** (interior clips)
   - **Audio** (music tracks)
   - **Graphics** (optional - title cards, logo)

---

## Section 2: Media Import

### 2.1 Import Drone Clips

1. Media Page > Media Pool
2. File browser (bottom-left) navigate to project root
3. Navigate to: `processing/trimmed/drone/`
4. Select all 5 DJI_*.MP4 files:
   - DJI_0014.MP4 (154.0s)
   - DJI_0015.MP4 (133.9s)
   - DJI_0016.MP4 (110.9s)
   - DJI_0017.MP4 (157.7s)
   - DJI_0018.MP4_fixed.MP4 (349.8s) — longest clip, most options
5. Drag all 5 clips into "Drone" bin

**Total drone footage:** 15.1 minutes (906 seconds)

### 2.2 Import Canon Interior Clips

1. File browser navigate to: `processing/trimmed/interior/`
2. Select all 21 MVI_*.MP4 files
3. Drag all 21 clips into "Canon" bin

**Total Canon footage:** 6.7 minutes (403 seconds)

### 2.3 Verify Import Success

1. Check Media Pool for red "Media Offline" icons
2. If any clips show offline: right-click > Relink Clips > navigate to correct path
3. For DJI clips: check stabilization metadata preserved
   - Select DJI clip in Media Pool
   - Inspector panel (top-right) > Stabilization tab
   - Should show "Gyroscope data found" (not "No data")
4. If gyroscope data missing: DJI metadata not preserved, may need to re-import from `drone-clips/100MEDIA/` directory

---

## Section 3: Hero Loop Workflow

### 3.1 Available Drone Clips

**Best for looping:** Smooth pan/orbit/tilt motion (consistent speed, no jarring stops)

| Clip | Duration | Notes |
|------|----------|-------|
| DJI_0014.MP4 | 154.0s | Scrub for best [HERO_DURATION]s segment |
| DJI_0015.MP4 | 133.9s | Scrub for best [HERO_DURATION]s segment |
| DJI_0016.MP4 | 110.9s | Scrub for best [HERO_DURATION]s segment |
| DJI_0017.MP4 | 157.7s | Scrub for best [HERO_DURATION]s segment |
| DJI_0018.MP4_fixed.MP4 | 349.8s | Longest — most segment options |

**Recommendation:** Preview each clip, identify segments with smooth consistent motion. Look for:
- 360-degree orbit around property (natural loop point when camera returns to start position)
- Slow pan across property (find start/end frames with similar visual elements)
- Rising/descending motion (match ground/sky framing at start/end)

### 3.2 Create First Hero Timeline (Hero_v1)

1. Edit Page (bottom tab bar)
2. Right-click in Media Pool timeline area > Create New Timeline
3. Name: "Hero_v1"
4. Settings:
   - Use Project Settings (1920x1080, 30fps) - click Use Project Settings button
   - Click Create
5. Drag selected drone clip from Drone bin onto timeline
6. Scrub through clip to find best [HERO_DURATION]s segment for looping
7. Set In point (I key) at start of desired segment
8. Set Out point (O key) at end of segment (approximately [HERO_DURATION] seconds later)
9. Trim timeline to In/Out points

### 3.3 Test Loop Seamlessness

1. Right-click timeline name in timeline panel > Loop Playback (checkmark appears)
2. Position playhead at start of timeline
3. Press Spacebar to play
4. Watch end-to-start transition carefully (loop will repeat continuously)
5. Look for:
   - Visual jump (camera position or subject placement changes abruptly)
   - Motion discontinuity (smooth pan suddenly jerks or stops)
   - Lighting shift (bright to dark or vice versa)
6. Play loop **3+ cycles minimum** to verify seamlessness

**If transition is jarring:**
- Adjust Out point backward/forward by 1-2 seconds (find better match frame)
- Try different clip or segment
- Add crossfade transition (see Section 3.4)

### 3.4 Add Crossfade (If Needed)

If end-to-start transition has slight visual jump but motion is good:

1. Effects Library panel (top-left) > Video Transitions > Dissolve > Cross Dissolve
2. Drag Cross Dissolve to end of timeline (between last frame and loop restart)
3. Duration: 0.5-1.0 seconds (subtle blend, not obvious fade)
4. Test loop again (3+ cycles) to verify crossfade smooths transition

**Note:** Best loops don't need crossfades. Use only if frames don't match perfectly.

### 3.5 Create Additional Hero Candidates (Hero_v2, Hero_v3)

**Minimum required:** 2 hero loop candidates
**Recommended:** 3 candidates (gives client choice)

1. Right-click Hero_v1 timeline in Media Pool > Duplicate Timeline
2. Rename to "Hero_v2"
3. Replace clip with different drone clip OR different segment from same clip
4. Repeat loop testing process (Section 3.3)
5. Optionally create Hero_v3 using third clip/segment

**Goal:** Give client 2-3 distinct hero loop options showcasing different property views or motion styles.

---

## Section 4: Warm Color Grading (Hero)

### 4.1 Apply Warm Tone Aesthetic

**Objective:** Create peaceful, cozy, inviting feel. Increase oranges/yellows, reduce blues. NOT Hollywood orange-and-teal — think warm sunset, cabin glow.

### 4.2 Color Page Workflow

1. Color Page (bottom tab bar)
2. Select first clip in Hero_v1 timeline
3. Primary Wheels panel (right side):

   **Temperature/Tint:**
   - Temperature slider: Move right (+10 to +20 for subtle warmth)
   - Don't overdo — +30+ looks over-saturated

   **Lift Wheel (Shadows):**
   - Click center dot, drag toward orange (lower-right quadrant)
   - Reduces blue cast in shadows
   - Subtle movement — 10-20% of wheel radius

   **Gamma Wheel (Midtones):**
   - Click center dot, drag toward yellow-orange (right side)
   - Warms ambient lighting and mid-range tones
   - 15-25% of wheel radius

   **Gain Wheel (Highlights):**
   - Optional: slight orange push (5-10% of wheel radius)
   - Be careful — highlights saturate quickly
   - Goal: warm sunlight, not blown-out orange

4. Scopes panel (top-right): Check waveform and vectorscope
   - Waveform: No clipping at 100 IRE (highlights) or 0 IRE (shadows)
   - Vectorscope: Shift toward orange/yellow quadrant, reduced blue

### 4.3 Save Grade as Still for Reuse

1. Right-click clip in timeline > Grab Still (or middle mouse drag to Gallery)
2. Gallery panel (top-left) shows saved grade
3. To apply to other clips:
   - Select next clip in timeline
   - Middle mouse drag Still from Gallery onto clip in timeline
4. Saved grade will be reused in Plan 07-02 for promo video consistency

### 4.4 Check Consistency Across Clips

1. Split Screen mode: View > Split Screen > 2 Up (or Ctrl+\)
2. Load Hero_v1 in left screen, Hero_v2 in right screen
3. Compare warm tone intensity side-by-side
4. Adjust if one timeline looks significantly warmer/cooler than other
5. Goal: Consistent warm aesthetic across all hero candidates

---

## Section 5: Hero Master Export

### 5.1 Export Settings

**Critical:** Export as high-quality master (ProRes 422 or DNxHR HQ). Phase 8 will compress to web-optimized <5MB files.

1. Deliver Page (bottom tab bar)
2. Render Settings panel (left side):

   **Format:** QuickTime

   **Codec:** Apple ProRes 422
   - If macOS/ProRes not available: DNxHR HQ (cross-platform alternative)

   **Resolution:** 1920x1080

   **Frame Rate:** 30fps

   **Quality:** ProRes 422 (standard) or ProRes 422 HQ (higher quality, larger file)

   **Audio:** None (hero video is muted per HERO-01 requirement)
   - Uncheck "Export Audio" checkbox

3. Filename:
   - Custom Name: Hero_v1_master
   - File extension: .mov (QuickTime)

4. Output Directory:
   - Browse to project root: `/home/evan/Projects/clients/timberandthreads/`
   - Navigate to: `processing/exports/hero/`
   - Select folder

### 5.2 Render Queue

1. Add to Render Queue button (bottom-right)
2. Verify settings in Render Jobs list:
   - Filename: Hero_v1_master.mov
   - Location: processing/exports/hero/
   - Format: QuickTime ProRes 422
3. Repeat for Hero_v2 and Hero_v3:
   - Change timeline in timeline selector (top)
   - Update filename to Hero_v2_master.mov, Hero_v3_master.mov
   - Add to Render Queue
4. Click "Start Render" (bottom-right)

### 5.3 Verify Render Success

1. Check Render Jobs list for green checkmark (completed) or red X (failed)
2. If failed: check error message, common issues:
   - Disk space (ProRes files are large: ~1-2GB per hero loop master)
   - Codec not available (use DNxHR HQ alternative)
   - Output directory doesn't exist (verify processing/exports/hero/ path)
3. Navigate to `processing/exports/hero/` in file browser
4. Verify 2-3 Hero_v*_master.mov files exist

---

## Expected Output Files

After completing this workflow:

```
processing/exports/hero/
├── Hero_v1_master.mov    (ProRes 422, 1920x1080, 30fps, no audio)
├── Hero_v2_master.mov    (ProRes 422, 1920x1080, 30fps, no audio)
└── Hero_v3_master.mov    (optional - ProRes 422, 1920x1080, 30fps, no audio)
```

**File sizes:** 300-500MB per [HERO_DURATION]s hero loop (normal for ProRes masters)

---

## Troubleshooting

### Media Offline / Red Clips

**Problem:** Clips show red "Media Offline" icon in Media Pool or timeline.

**Solution:** Right-click offline clip > Relink Clips > navigate to `processing/trimmed/drone/` or `processing/trimmed/interior/`

### Playback Stutter / Dropped Frames

**Problem:** Timeline playback is jerky or drops frames.

**Solution 1:** Lower playback quality: Playback > Timeline Proxy Mode > Half Resolution or Quarter Resolution

**Solution 2:** Render timeline cache: Playback > Render Cache > Smart (caches complex clips)

**Solution 3:** System resources: Close other applications, verify 16GB+ RAM available

### Canon Clips Play in Slow Motion

**Problem:** 60fps Canon clips play at half speed on 30fps timeline.

**Solution:** Right-click clip in timeline > Retime Controls > Speed > 100% (should auto-conform but verify)

### Gyroscope Data Not Found (DJI Clips)

**Problem:** Stabilization panel shows "No gyroscope data" for drone clips.

**Solution:** DJI metadata not preserved during trimming. Re-import from original `drone-clips/100MEDIA/DJI_00*.MP4` files.

### ProRes Codec Not Available

**Problem:** Deliver page doesn't show ProRes 422 option.

**Solution:** Use DNxHR HQ instead (Avid codec, cross-platform, equivalent quality to ProRes)

---

## Next Steps

After hero master exports complete:

1. Claude Code verifies exports (Task 3 verification)
2. Phase 7 Plan 02: Promo video assembly with music sync and same warm color grading
3. Phase 8: Web compression (hero masters → <5MB 720p MP4 files)

---

**Created:** 2026-02-16 (Phase 7 Plan 01)
**Last updated:** 2026-02-16
