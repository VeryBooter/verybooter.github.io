#!/usr/bin/env bash
set -euo pipefail
# Preserve the supplied master; produce the browser asset used by the cinema.
ffmpeg -hide_banner -i "docs/assets/video/Lens Dwellers (Pitt 24 Hr Film Challenge).mov" \
  -vf scale=1920:-2 -c:v libx264 -preset medium -crf 23 -threads 2 \
  -c:a aac -b:a 128k -movflags +faststart docs/assets/video/lens-dwellers.mp4
