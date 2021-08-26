#!/bin/bash

cpath="closure-compiler"

# Check if we need closure locally
if [ ! -d "${cpath}" ]
then
  echo "Follow instructions at https://developers.google.com/closure/compiler/docs/gettingstarted_app"
  echo "Downloading the latest JAR from https://mvnrepository.com/artifact/com.google.javascript/closure-compiler"
  exit
fi

# Check for input script name
if [ $# -ne 1 ]
then
  echo "Specify script on command line"
  exit
fi

# Find out the latest jar filename
compiler=`ls -rt ${cpath}/closure-compiler-*.jar | tail -1`

# Use first parameter as JS file, write to stdout with ADVANCED compilation level
java -jar "${compiler}" --compilation_level ADVANCED --js "$1"
