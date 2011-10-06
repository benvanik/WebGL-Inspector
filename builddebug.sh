#!/bin/sh

source buildshared.sh

prepareOutput

# =============================================================================
# Debugger library
# =============================================================================
echo "Building debug library..."

compileLibrary debug gli.debug

if [[ $1 != fast ]]; then
  compileLibraryOptimized debug gli.debug
fi

echo ""
