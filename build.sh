#!/bin/bash

# Check for work folder specified
if [ $# -eq 1 ]
then
  workdir=$1
  echo "Entering ${workdir}"
  cd "${workdir}"
fi

zipfile="js13k.zip"
models="models.js"
buildpath="tmpbuild"
jscat="${buildpath}/min.js"
indexcat="${buildpath}/index.html"

# Create clean build folder
rm -Rf "${buildpath}" >/dev/null 2>&1
rm -Rf "${zipfile}" >/dev/null 2>&1
mkdir "${buildpath}"

# Create a 3D models bundle
echo "var models=[" > "${models}"
for file in "dev/stealth.obj" "dev/cvn-65.obj"
do
  php obj2js.php "${file}" "-" "set" >> "${models}"
  echo -n "," >> "${models}"
done
echo "];" >> "${models}"

# Concatenate the JS files
touch "${jscat}" >/dev/null 2>&1
for file in "random.js" "timeline.js" "font.js" "writer.js" "hudfont.js" "hudwriter.js" "models.js" "3dsvg.js" "hud.js" "main.js"
do
  cat "${file}" >> "${jscat}"
done

# Add the index header
echo -n '<!DOCTYPE html><html><head><meta charset="utf-8"/><meta http-equiv="Content-Type" content="text/html;charset=utf-8"/><title>Airspace Alpha Zulu</title><style>' > "${indexcat}"

# Inject the concatenated and minified CSS files
for file in "main.css"
do
  JAVA_CMD=java yui-compressor "${file}" >> "${indexcat}"
done

# Add on the rest of the index file
echo -n '</style><script type="text/javascript">' >> "${indexcat}"

# Inject the closure-ised and minified JS
./closeyoureyes.sh "${jscat}" >> "${indexcat}"

# Add on the rest of the index file
echo -n '</script><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"/></head><body><div id="wrapper"><svg id="svg" style="width:1280px; height:720px;" viewbox="0 0 640 360"><defs><clipPath id="crop"><rect x="0" y="0" width="640" height="360" /></clipPath><linearGradient id="skygradient" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" style="stop-color:rgb(45,145,194);stop-opacity:1" /><stop offset="100%" style="stop-color:rgb(30,82,142);stop-opacity:1" /></linearGradient></defs><rect width="640" height="360" fill="url(#skygradient)" /><g id="playfield" shaperendering="optimizeSpeed" clip-path="url(#crop)"></g><g id="txthud" shaperendering="optimizeSpeed" clip-path="url(#crop)"></g></svg><canvas id="static_hud" width="640" height="480"></canvas><canvas id="dynamic_hud" width="640" height="480"></canvas></div></body></html>' >> "${indexcat}"

# Remove the minified JS
rm "${jscat}" >/dev/null 2>&1

# Zip everything up
zip -j "${zipfile}" "${buildpath}"/*

# Re-Zip with advzip to save a bit more
advzip -i 200 -k -z -4 "${zipfile}"

# Determine file sizes and compression
unzip -lv "${zipfile}"
stat "${zipfile}"

zipsize=`stat -c %s "${zipfile}"`
maxsize=$((13*1024))
bytesleft=$((${maxsize}-${zipsize}))
percent=$((200*${zipsize}/${maxsize} % 2 + 100*${zipsize}/${maxsize}))

if [ ${bytesleft} -ge 0 ]
then
  echo "YAY ${percent}% used - it fits with ${bytesleft} bytes spare"
else
  echo "OH NO ${percent}% used - it's gone ovey by "$((0-${bytesleft}))" bytes"
fi
