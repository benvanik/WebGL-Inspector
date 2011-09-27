#!/bin/sh

CLOSURE_LIBRARY=deps/closure-library
CLOSURE_COMPILER=deps/closure-compiler

# $1 = name
# $2 = root namespace
# $3 = source path
compileLibrary() {
  $CLOSURE_LIBRARY/closure/bin/build/closurebuilder.py \
    --root=$CLOSURE_LIBRARY \
    --root=$3/ \
    --namespace=$2 \
    --output_mode=script \
    --output_file=bin/$1-all.js
}

# $1 = name
# $2 = root namespace
# $3 = source path
compileLibraryOptimized() {
  $CLOSURE_LIBRARY/closure/bin/build/closurebuilder.py \
    --root=$CLOSURE_LIBRARY \
    --root=$3/ \
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

compileLibrary capture glcap src/capture/
compileLibraryOptimized capture glcap src/capture/

echo ""
# =============================================================================
# Debugger library
# =============================================================================
echo "Building debugger library..."

compileLibrary debugger gldbg src/debugger/
compileLibraryOptimized debugger gldbg src/debugger/

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
