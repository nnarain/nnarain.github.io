#!/bin/sh

ffmpeg -i "$1".mp4 -an -c:v libvpx-vp9 -crf 32 -b:v 0 "$1".webm
