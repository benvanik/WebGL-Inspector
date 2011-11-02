#!/bin/sh

source buildshared.sh

prepareOutput

# =============================================================================
# Capture library
# =============================================================================
echo "Building capture library..."

compileLibrary capture gli.capture
wrapInScope __gli_capture bin/capture-all.js

if [[ $1 != fast ]]; then
  compileLibraryOptimized capture gli.capture
  wrapInScope __gli_capture bin/capture-compiled.js
fi

echo ""
