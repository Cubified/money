#!/bin/bash

# from
# http://bergamini.org/computers/creating-favicon.ico-icon-files-with-imagemagick-convert.html

if [ $1 = "" ]; then
  echo "Usage: mkfavicon.sh [png file]"
  exit
fi

mkdir -p favicons
cd favicons

convert ../$1 -resize 256x256 -transparent white favicon-256.png
convert favicon-256.png -resize 16x16 favicon-16.png
convert favicon-256.png -resize 32x32 favicon-32.png
convert favicon-256.png -resize 64x64 favicon-64.png
convert favicon-256.png -resize 128x128 favicon-128.png
convert favicon-16.png favicon-32.png favicon-64.png favicon-128.png favicon-256.png -colors 256 favicon.ico

mv favicon.ico ../favicon.ico
rm -rf favicons
