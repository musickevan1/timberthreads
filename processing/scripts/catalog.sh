#!/usr/bin/env bash
#
# catalog.sh - Catalog all raw video clips and generate thumbnails
#
# Extracts metadata from DJI drone clips and Canon interior clips,
# generates mid-point thumbnails, and outputs structured JSON.
#
# Handles:
# - Corrupt DJI_0018.MP4 (MOOV atom missing)
# - DJI_0018.MP4_fixed.MP4 validation
# - All Canon MVI_*.MP4 clips (ignores CR3 photo files)
#

set -euo pipefail

# Trap errors
trap 'echo "ERROR: Script failed at line $LINENO" >&2' ERR

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
DRONE_DIR="$PROJECT_ROOT/drone-clips/100MEDIA"
CANON_DIR="$PROJECT_ROOT/timberandthreads-promo-clips/DCIM/100CANON"
CATALOG_DIR="$PROJECT_ROOT/processing/catalog"
THUMBS_DIR="$CATALOG_DIR/thumbs"
METADATA_FILE="$CATALOG_DIR/metadata.json"

# Counters
total_clips=0
valid_clips=0
corrupt_clips=0
error_clips=0
total_duration=0

# JSON array
json_array="[]"

echo "=========================================="
echo "Video Catalog Generator"
echo "=========================================="
echo ""

# Function to add clip to JSON
add_clip_to_json() {
    local filename="$1"
    local filepath="$2"
    local source="$3"
    local status="$4"
    local duration="${5:-0}"
    local codec="${6:-}"
    local width="${7:-0}"
    local height="${8:-0}"
    local framerate="${9:-}"
    local bitrate="${10:-0}"
    local filesize_bytes="${11:-0}"
    local thumbnail="${12:-}"

    # Calculate filesize in MB
    local filesize_mb=$(echo "$filesize_bytes" | awk '{printf "%.2f", $1/1024/1024}')

    # Build resolution string
    local resolution="${width}x${height}"

    # Convert bitrate from bits/sec to kbps
    local bitrate_kbps=$(echo "$bitrate" | awk '{printf "%.0f", $1/1000}')

    # Build JSON object
    local json_obj=$(jq -n \
        --arg filename "$filename" \
        --arg path "$filepath" \
        --arg source "$source" \
        --arg duration "$duration" \
        --arg codec "$codec" \
        --arg resolution "$resolution" \
        --arg framerate "$framerate" \
        --arg bitrate "$bitrate_kbps" \
        --arg filesize_bytes "$filesize_bytes" \
        --arg filesize_mb "$filesize_mb" \
        --arg thumbnail "$thumbnail" \
        --arg status "$status" \
        '{
            filename: $filename,
            path: $path,
            source: $source,
            duration_sec: ($duration | tonumber),
            codec: $codec,
            resolution: $resolution,
            framerate: $framerate,
            bitrate_kbps: ($bitrate | tonumber),
            filesize_bytes: ($filesize_bytes | tonumber),
            filesize_mb: ($filesize_mb | tonumber),
            thumbnail: $thumbnail,
            status: $status
        }')

    # Add to array
    json_array=$(echo "$json_array" | jq --argjson obj "$json_obj" '. += [$obj]')
}

# Process DJI drone clips
echo "Processing DJI drone clips..."
echo "--------------------------------------"

for file in "$DRONE_DIR"/DJI_*.MP4; do
    [ -e "$file" ] || continue

    filename=$(basename "$file")
    total_clips=$((total_clips + 1))

    echo "Processing: $filename"

    # Special handling for corrupt DJI_0018.MP4
    if [ "$filename" = "DJI_0018.MP4" ]; then
        echo "  Status: CORRUPT - MOOV atom missing (skipping)"
        filesize=$(stat -c%s "$file")
        add_clip_to_json "$filename" "$file" "drone" "CORRUPT - MOOV atom missing" "0" "" "0" "0" "" "0" "$filesize" ""
        corrupt_clips=$((corrupt_clips + 1))
        continue
    fi

    # Special handling for DJI_0018.MP4_fixed.MP4
    if [ "$filename" = "DJI_0018.MP4_fixed.MP4" ]; then
        echo "  Validating fixed file..."
        if ! ffprobe -v error "$file" >/dev/null 2>&1; then
            echo "  Status: ERROR - Fixed file still invalid"
            filesize=$(stat -c%s "$file")
            add_clip_to_json "$filename" "$file" "drone" "ERROR - Invalid after fix" "0" "" "0" "0" "" "0" "$filesize" ""
            error_clips=$((error_clips + 1))
            continue
        fi
        echo "  Status: Valid (repaired file)"
    fi

    # Extract metadata with ffprobe
    if ! metadata=$(ffprobe -v error -print_format json -show_format -show_streams -select_streams v:0 "$file" 2>&1); then
        echo "  Status: ERROR - ffprobe failed"
        filesize=$(stat -c%s "$file")
        add_clip_to_json "$filename" "$file" "drone" "ERROR - ffprobe failed" "0" "" "0" "0" "" "0" "$filesize" ""
        error_clips=$((error_clips + 1))
        continue
    fi

    # Parse metadata
    duration=$(echo "$metadata" | jq -r '.format.duration // "0"')
    codec=$(echo "$metadata" | jq -r '.streams[0].codec_name // "unknown"')
    width=$(echo "$metadata" | jq -r '.streams[0].width // "0"')
    height=$(echo "$metadata" | jq -r '.streams[0].height // "0"')
    framerate=$(echo "$metadata" | jq -r '.streams[0].r_frame_rate // "0/0"')
    bitrate=$(echo "$metadata" | jq -r '.format.bit_rate // "0"')
    filesize=$(stat -c%s "$file")

    echo "  Duration: ${duration}s | Codec: $codec | Resolution: ${width}x${height} | Framerate: $framerate"

    # Generate thumbnail at midpoint
    midpoint=$(echo "$duration" | awk '{printf "%.0f", $1/2}')
    thumb_file="$THUMBS_DIR/${filename}.jpg"

    if ffmpeg -ss "$midpoint" -i "$file" -vframes 1 -q:v 2 "$thumb_file" -y -v error 2>&1; then
        echo "  Thumbnail: Generated at ${midpoint}s"
    else
        echo "  Thumbnail: Failed to generate"
        thumb_file=""
    fi

    # Add to JSON
    add_clip_to_json "$filename" "$file" "drone" "OK" "$duration" "$codec" "$width" "$height" "$framerate" "$bitrate" "$filesize" "$thumb_file"

    valid_clips=$((valid_clips + 1))
    total_duration=$(echo "$total_duration $duration" | awk '{printf "%.2f", $1 + $2}')

    echo ""
done

# Process Canon interior clips
echo "Processing Canon interior clips..."
echo "--------------------------------------"

for file in "$CANON_DIR"/MVI_*.MP4; do
    [ -e "$file" ] || continue

    filename=$(basename "$file")
    total_clips=$((total_clips + 1))

    echo "Processing: $filename"

    # Extract metadata with ffprobe
    if ! metadata=$(ffprobe -v error -print_format json -show_format -show_streams -select_streams v:0 "$file" 2>&1); then
        echo "  Status: ERROR - ffprobe failed"
        filesize=$(stat -c%s "$file")
        add_clip_to_json "$filename" "$file" "canon" "ERROR - ffprobe failed" "0" "" "0" "0" "" "0" "$filesize" ""
        error_clips=$((error_clips + 1))
        continue
    fi

    # Parse metadata
    duration=$(echo "$metadata" | jq -r '.format.duration // "0"')
    codec=$(echo "$metadata" | jq -r '.streams[0].codec_name // "unknown"')
    width=$(echo "$metadata" | jq -r '.streams[0].width // "0"')
    height=$(echo "$metadata" | jq -r '.streams[0].height // "0"')
    framerate=$(echo "$metadata" | jq -r '.streams[0].r_frame_rate // "0/0"')
    bitrate=$(echo "$metadata" | jq -r '.format.bit_rate // "0"')
    filesize=$(stat -c%s "$file")

    echo "  Duration: ${duration}s | Codec: $codec | Resolution: ${width}x${height} | Framerate: $framerate"

    # Generate thumbnail at midpoint
    midpoint=$(echo "$duration" | awk '{printf "%.0f", $1/2}')
    thumb_file="$THUMBS_DIR/${filename}.jpg"

    if ffmpeg -ss "$midpoint" -i "$file" -vframes 1 -q:v 2 "$thumb_file" -y -v error 2>&1; then
        echo "  Thumbnail: Generated at ${midpoint}s"
    else
        echo "  Thumbnail: Failed to generate"
        thumb_file=""
    fi

    # Add to JSON
    add_clip_to_json "$filename" "$file" "canon" "OK" "$duration" "$codec" "$width" "$height" "$framerate" "$bitrate" "$filesize" "$thumb_file"

    valid_clips=$((valid_clips + 1))
    total_duration=$(echo "$total_duration $duration" | awk '{printf "%.2f", $1 + $2}')

    echo ""
done

# Write JSON to file
echo "$json_array" | jq '.' > "$METADATA_FILE"

# Print summary
echo "=========================================="
echo "Catalog Summary"
echo "=========================================="
echo "Total clips found: $total_clips"
echo "Valid clips: $valid_clips"
echo "Corrupt clips: $corrupt_clips"
echo "Error clips: $error_clips"
echo "Total duration: ${total_duration}s ($(echo "$total_duration" | awk '{printf "%.1f", $1/60}') minutes)"
echo ""
echo "Output:"
echo "  Metadata: $METADATA_FILE"
echo "  Thumbnails: $THUMBS_DIR"
echo "=========================================="
