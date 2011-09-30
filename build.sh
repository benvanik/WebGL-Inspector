#!/bin/sh

CLOSURE_LIBRARY=deps/closure-library
CLOSURE_COMPILER=deps/closure-compiler

# Adds a (function name() { ... })(window); wrapper around
# $1 = name
# $2 = filename
wrapInScope() {
  echo '(function '$1'(window) { this.goog = {}; with (this) {' | cat - $2 > $2.t
  echo '}}).call({}, window);' | cat $2.t - > $2
  rm $2.t
}

# Compiles in simple mode (basically file cat)
# $1 = name
# $2 = root namespace
compileLibrary() {
  $CLOSURE_LIBRARY/closure/bin/build/closurebuilder.py \
    --root=$CLOSURE_LIBRARY \
    --root=src/gli/ \
    --namespace=$2 \
    --output_mode=script \
    --output_file=bin/$1-all.js
}

# Compiles with advanced optimizations
# $1 = name
# $2 = root namespace
compileLibraryOptimized() {
  $CLOSURE_LIBRARY/closure/bin/build/closurebuilder.py \
    --root=$CLOSURE_LIBRARY \
    --root=src/gli/ \
    --namespace=$2 \
    --output_mode=compiled \
    --compiler_jar=$CLOSURE_COMPILER/compiler.jar \
    --compiler_flags="--compilation_level=ADVANCED_OPTIMIZATIONS" \
    --output_file=bin/$1-compiled.js
}

# Setup output path
if [ ! -d "bin" ]; then mkdir bin; fi

# =============================================================================
# Capture library
# =============================================================================
echo "Building capture library..."

compileLibrary capture gli.capture
compileLibraryOptimized capture gli.capture

wrapInScope __gli_capture bin/capture-all.js
wrapInScope __gli_capture bin/capture-compiled.js

echo ""
# =============================================================================
# Debugger library
# =============================================================================
echo "Building debug library..."

compileLibrary debug gli.debug
compileLibraryOptimized debug gli.debug

echo ""
# =============================================================================
# Extensions : Chrome
# =============================================================================
echo "Assembling Chrome extension..."

# Ensure assets directory exists and copy all assets
if [ ! -d "extensions/chrome/assets" ]; then mkdir extensions/chrome/assets; fi
cp -R assets/ extensions/chrome/assets

# Copy compiled binaries
if [ ! -d "extensions/chrome/bin" ]; then mkdir extensions/chrome/bin; fi
cp -R bin/ extensions/chrome/bin/

echo ""
