#!/usr/bin/env bash
set -euo pipefail

# compress-promo.sh - Compress video for promo section (<10MB, 1080p, with audio)
#
# Usage: ./compress-promo.sh INPUT [OUTPUT]
#
# Produces 1080p H.264 MP4 with AAC audio under 10MB using two-pass encoding.
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
OUTPUT="${2:-${INPUT%.*}_promo_1080p.mp4}"

# Validate input file exists and is readable
if [ ! -f "$INPUT" ]; then
  echo "Error: Input file '$INPUT' does not exist"
  exit 1
fi

if [ ! -r "$INPUT" ]; then
  echo "Error: Input file '$INPUT' is not readable"
  exit 1
fi

echo "=== Promo Video Compression ==="
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
TARGET_SIZE_KB=9600  # 9.6MB (leave 400KB headroom under 10MB limit)
AUDIO_BITRATE_KBPS=128  # AAC audio for promo

# Formula: (target_size_kb * 8) / duration_seconds = total_bitrate_kbps
# Then subtract audio bitrate to get video bitrate
total_bitrate=$(echo "$TARGET_SIZE_KB $duration" | awk '{printf "%.0f", ($1 * 8) / $2}')
video_bitrate=$(echo "$total_bitrate $AUDIO_BITRATE_KBPS" | awk '{printf "%.0f", $1 - $2}')

echo "Target size: ${TARGET_SIZE_KB}KB (< 10MB)"
echo "Total bitrate: ${total_bitrate}kbps"
echo "Audio bitrate: ${AUDIO_BITRATE_KBPS}kbps (AAC)"
echo "Video bitrate: ${video_bitrate}kbps"
echo ""

# Pass 1: Analysis pass (must use same profile/level as pass 2)
echo "Running pass 1 (analysis)..."
ffmpeg -i "$INPUT" \
  -vf "scale=-2:1080" \
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

# Pass 2: Encoding pass with all browser compatibility flags and audio
echo "Running pass 2 (encoding)..."
ffmpeg -i "$INPUT" \
  -vf "scale=-2:1080" \
  -c:v libx264 \
  -b:v ${video_bitrate}k \
  -pass 2 \
  -movflags +faststart \
  -pix_fmt yuv420p \
  -profile:v baseline \
  -level 3.0 \
  -c:a aac \
  -b:a 128k \
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
TARGET_SIZE_BYTES=10485760  # 10MB in bytes
if [ "$output_size" -lt "$TARGET_SIZE_BYTES" ]; then
  echo "Target achieved: YES (< 10MB)"
else
  echo "Target achieved: NO (>= 10MB) - WARNING: File exceeds target size"
fi

echo ""
echo "Summary:"
echo "- Input duration: ${duration}s"
echo "- Output size: ${output_size_mb}MB"
echo "- Target: < 10MB"
