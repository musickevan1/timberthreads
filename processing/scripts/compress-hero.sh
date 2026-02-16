#!/usr/bin/env bash
set -euo pipefail

# compress-hero.sh - Compress video for hero section (<5MB, 720p, muted)
#
# Usage: ./compress-hero.sh INPUT [OUTPUT]
#
# Produces 720p H.264 MP4 under 5MB using two-pass encoding with calculated bitrate.
# Hero video is MUTED (no audio track) per HERO-01 requirement.
# Uses browser-compatible flags: faststart, yuv420p, baseline profile.

# Cleanup function for two-pass log files
cleanup() {
  rm -f ffmpeg2pass-*.log
}
trap cleanup EXIT

# Validate arguments
if [ $# -lt 1 ]; then
  echo "Error: Missing input file"
  echo "Usage: $0 INPUT [OUTPUT]"
  exit 1
fi

INPUT="$1"
OUTPUT="${2:-${INPUT%.*}_hero_720p.mp4}"

# Validate input file exists and is readable
if [ ! -f "$INPUT" ]; then
  echo "Error: Input file '$INPUT' does not exist"
  exit 1
fi

if [ ! -r "$INPUT" ]; then
  echo "Error: Input file '$INPUT' is not readable"
  exit 1
fi

echo "=== Hero Video Compression ==="
echo "Input:  $INPUT"
echo "Output: $OUTPUT"
echo ""

# Extract duration using ffprobe
duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$INPUT")

if [ -z "$duration" ]; then
  echo "Error: Could not extract duration from input file"
  exit 1
fi

echo "Duration: ${duration}s"

# Calculate bitrate using awk (NOT bc - not installed on this system)
TARGET_SIZE_KB=4800  # 4.8MB (leave 200KB headroom under 5MB limit)
AUDIO_BITRATE_KBPS=0  # Hero is muted (-an flag)

# Formula: (target_size_kb * 8) / duration_seconds = total_bitrate_kbps
video_bitrate=$(echo "$TARGET_SIZE_KB $duration" | awk '{printf "%.0f", ($1 * 8) / $2}')

echo "Target size: ${TARGET_SIZE_KB}KB (< 5MB)"
echo "Video bitrate: ${video_bitrate}kbps"
echo ""

# Pass 1: Analysis pass (must use same profile/level as pass 2)
echo "Running pass 1 (analysis)..."
ffmpeg -i "$INPUT" \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 \
  -b:v ${video_bitrate}k \
  -profile:v baseline \
  -level 3.0 \
  -pix_fmt yuv420p \
  -pass 1 \
  -an \
  -f null \
  /dev/null \
  -y

# Pass 2: Encoding pass with all browser compatibility flags
echo "Running pass 2 (encoding)..."
ffmpeg -i "$INPUT" \
  -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" \
  -c:v libx264 \
  -b:v ${video_bitrate}k \
  -pass 2 \
  -movflags +faststart \
  -pix_fmt yuv420p \
  -profile:v baseline \
  -level 3.0 \
  -an \
  "$OUTPUT" \
  -y

# Validate output file size
if [ ! -f "$OUTPUT" ]; then
  echo "Error: Output file was not created"
  exit 1
fi

output_size=$(stat -c%s "$OUTPUT")
output_size_mb=$(echo "$output_size" | awk '{printf "%.2f", $1 / 1048576}')
output_size_kb=$(echo "$output_size" | awk '{printf "%.0f", $1 / 1024}')

echo ""
echo "=== Compression Complete ==="
echo "Output file: $OUTPUT"
echo "File size: ${output_size_mb}MB (${output_size_kb}KB)"

# Check if target was achieved
TARGET_SIZE_BYTES=5242880  # 5MB in bytes
if [ "$output_size" -lt "$TARGET_SIZE_BYTES" ]; then
  echo "Target achieved: YES (< 5MB)"
else
  echo "Target achieved: NO (>= 5MB) - WARNING: File exceeds target size"
fi

echo ""
echo "Summary:"
echo "- Input duration: ${duration}s"
echo "- Output size: ${output_size_mb}MB"
echo "- Target: < 5MB"
