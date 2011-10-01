#!/bin/sh

source buildshared.sh

prepareOutput

# =============================================================================
# Debugger library
# =============================================================================
echo "Building debug library..."

compileLibrary debug gli.debug
compileLibraryOptimized debug gli.debug

echo ""
