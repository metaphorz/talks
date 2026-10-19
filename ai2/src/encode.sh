#!/bin/sh
# usage: encode.sh <model-key> <render-dir>   (render-dir holds the PNGs from render_glb.py)
k=$1; S=$2; D=$(dirname "$0")/../img/3d/$k; mkdir -p "$D"
for s in hero front profile back low detail; do ffmpeg -loglevel error -y -i "$S/$s.png" -q:v 4 "$D/$s.jpg"; done
ffmpeg -loglevel error -y -framerate 24 -i "$S/orbit/f%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 25 -preset slow -g 8 -movflags +faststart -an "$D/orbit.mp4"
