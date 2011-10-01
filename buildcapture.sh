#!/bin/sh

source buildshared.sh

prepareOutput

# =============================================================================
# Capture library
# =============================================================================
echo "Building capture library..."

compileLibrary capture gli.capture
compileLibraryOptimized capture gli.capture

wrapInScope __gli_capture bin/capture-all.js
wrapInScope __gli_capture bin/capture-compiled.js

echo ""
