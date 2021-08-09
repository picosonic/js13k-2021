#!/bin/bash

zipfile="js13k.zip"
buildpath="tmpbuild"

# Create clean build folder
rm -Rf "${buildpath}" >/dev/null 2>&1
rm -Rf "${zipfile}" >/dev/null 2>&1
mkdir "${buildpath}"

# Concatenate the JS files

# Add the index header

# Inject the concatenated and minified CSS files

# Add on the rest of the index file

# Inject the closure-ised and minified JS

# Add on the rest of the index file

# Remove the minified JS

# Zip everything up

# Re-Zip with advzip to save a bit more

# Determine file sizes and compression
