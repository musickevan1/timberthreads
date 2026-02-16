#!/usr/bin/env bash
#
# detect-silence.sh - Analyze Canon interior clips for silence and dead air
#
# Uses FFmpeg's silencedetect filter to identify silent segments in Canon MVI_*.MP4 clips.
# Helps identify clips that need trimming (start/end dead air, long pauses).
#
# Default threshold: -30dB (standard for indoor ambient noise)
# Minimum silence duration: 0.5s
#

set -euo pipefail

# Trap errors
trap 'echo "ERROR: Script failed at line $LINENO" >&2' ERR

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
CANON_DIR="$PROJECT_ROOT/timberandthreads-promo-clips/DCIM/100CANON"
CATALOG_DIR="$PROJECT_ROOT/processing/catalog"
REPORT_FILE="$CATALOG_DIR/silence-report.txt"

# Silence detection parameters
NOISE_THRESHOLD="-30dB"
MIN_SILENCE_DURATION="0.5"

# Counters
total_clips=0
high_silence_clips=0  # >50% silence
low_silence_clips=0   # <10% silence
trim_candidates=0     # start or end has >2s silence

# Initialize report
cat > "$REPORT_FILE" <<EOF
========================================
Canon Interior Clips - Silence Analysis
========================================

Threshold: $NOISE_THRESHOLD
Minimum silence duration: ${MIN_SILENCE_DURATION}s
Generated: $(date -u +"%Y-%m-%d %H:%M:%S UTC")

========================================

EOF

echo "=========================================="
echo "Silence Detection - Canon Interior Clips"
echo "=========================================="
echo "Threshold: $NOISE_THRESHOLD"
echo "Min duration: ${MIN_SILENCE_DURATION}s"
echo ""

# Process each Canon clip
for file in "$CANON_DIR"/MVI_*.MP4; do
    [ -e "$file" ] || continue

    filename=$(basename "$file")
    total_clips=$((total_clips + 1))

    echo "Analyzing: $filename"

    # Get clip duration
    duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$file")
    duration_rounded=$(echo "$duration" | awk '{printf "%.1f", $1}')

    # Run silence detection
    silence_output=$(ffmpeg -i "$file" -af "silencedetect=noise=${NOISE_THRESHOLD}:d=${MIN_SILENCE_DURATION}" -f null - 2>&1 | grep -E "silence_(start|end|duration)" || true)

    # Parse silence segments
    silence_starts=()
    silence_ends=()
    silence_durations=()

    while IFS= read -r line; do
        if [[ $line =~ silence_start:[[:space:]]*([0-9.]+) ]]; then
            silence_starts+=("${BASH_REMATCH[1]}")
        elif [[ $line =~ silence_end:[[:space:]]*([0-9.]+).*silence_duration:[[:space:]]*([0-9.]+) ]]; then
            silence_ends+=("${BASH_REMATCH[1]}")
            silence_durations+=("${BASH_REMATCH[2]}")
        fi
    done <<< "$silence_output"

    # Count segments
    segment_count=${#silence_ends[@]}

    # Calculate total silence
    total_silence=0
    for dur in "${silence_durations[@]}"; do
        total_silence=$(echo "$total_silence $dur" | awk '{printf "%.2f", $1 + $2}')
    done

    # Calculate active audio
    active_audio=$(echo "$duration $total_silence" | awk '{printf "%.2f", $1 - $2}')
    silence_percent=$(echo "$total_silence $duration" | awk '{if ($2 > 0) printf "%.1f", ($1 / $2) * 100; else print "0.0"}')
    active_percent=$(echo "$active_audio $duration" | awk '{if ($2 > 0) printf "%.1f", ($1 / $2) * 100; else print "0.0"}')

    # Write to report
    cat >> "$REPORT_FILE" <<EOF
=== $filename ===
Duration: ${duration_rounded}s
Silent segments: $segment_count
EOF

    # Check for start/end dead air and classify
    needs_trimming=false

    if [ "$segment_count" -gt 0 ]; then
        for i in "${!silence_ends[@]}"; do
            start="${silence_starts[$i]}"
            end="${silence_ends[$i]}"
            dur="${silence_durations[$i]}"

            # Determine location
            location=""
            start_float=$(echo "$start" | awk '{printf "%.2f", $1}')
            end_float=$(echo "$end" | awk '{printf "%.2f", $1}')
            dur_float=$(echo "$dur" | awk '{printf "%.2f", $1}')

            if (( $(echo "$start_float < 3.0" | awk '{print ($1 < 3.0)}') )); then
                location="[start dead air]"
                if (( $(echo "$dur_float > 2.0" | awk '{print ($1 > 2.0)}') )); then
                    needs_trimming=true
                fi
            elif (( $(echo "$end_float > $duration - 3.0" | awk '{print ($1 > $2 - 3.0)}') )); then
                location="[end dead air]"
                if (( $(echo "$dur_float > 2.0" | awk '{print ($1 > 2.0)}') )); then
                    needs_trimming=true
                fi
            else
                location="[mid-clip silence]"
            fi

            echo "  ${start_float} - ${end_float} (${dur_float}s) $location" >> "$REPORT_FILE"
        done
    else
        echo "  No silence detected" >> "$REPORT_FILE"
    fi

    echo "Active audio: ${active_audio}s (${active_percent}%)" >> "$REPORT_FILE"
    echo "" >> "$REPORT_FILE"

    # Classification
    if (( $(echo "$silence_percent > 50.0" | awk '{print ($1 > 50.0)}') )); then
        high_silence_clips=$((high_silence_clips + 1))
    elif (( $(echo "$silence_percent < 10.0" | awk '{print ($1 < 10.0)}') )); then
        low_silence_clips=$((low_silence_clips + 1))
    fi

    if [ "$needs_trimming" = true ]; then
        trim_candidates=$((trim_candidates + 1))
    fi

    echo "  Segments: $segment_count | Silence: ${total_silence}s (${silence_percent}%) | Active: ${active_audio}s (${active_percent}%)"
    if [ "$needs_trimming" = true ]; then
        echo "  → Trim candidate (>2s start/end dead air)"
    fi
    echo ""
done

# Write summary
cat >> "$REPORT_FILE" <<EOF
========================================
SUMMARY
========================================

Total clips analyzed: $total_clips
Clips with >50% silence: $high_silence_clips
Clips with <10% silence: $low_silence_clips
Trim candidates (>2s start/end dead air): $trim_candidates

RECOMMENDATIONS:
EOF

if [ "$high_silence_clips" -gt 0 ]; then
    cat >> "$REPORT_FILE" <<EOF
- $high_silence_clips clips have >50% silence — review for aggressive trimming or removal
EOF
fi

if [ "$trim_candidates" -gt 0 ]; then
    cat >> "$REPORT_FILE" <<EOF
- $trim_candidates clips have >2s dead air at start/end — recommend trimming these segments
EOF
fi

if [ "$low_silence_clips" -eq "$total_clips" ]; then
    cat >> "$REPORT_FILE" <<EOF
- All clips have <10% silence — mostly active audio, minimal trimming needed
EOF
fi

cat >> "$REPORT_FILE" <<EOF

NOTE: Threshold of $NOISE_THRESHOLD assumes indoor ambient noise floor.
If results show excessive silence (>80% across most clips), the threshold
may be too sensitive. Consider re-running with -40dB.

========================================
EOF

# Print summary
echo "=========================================="
echo "Silence Analysis Summary"
echo "=========================================="
echo "Total clips analyzed: $total_clips"
echo "Clips with >50% silence: $high_silence_clips"
echo "Clips with <10% silence: $low_silence_clips"
echo "Trim candidates: $trim_candidates"
echo ""
echo "Report written to: $REPORT_FILE"
echo "=========================================="
