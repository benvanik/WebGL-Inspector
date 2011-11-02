#!/bin/sh

source buildshared.sh

# =============================================================================
# Cleanup existing binaries
# =============================================================================

./clean.sh

# =============================================================================
# Generate dependencies
# =============================================================================

./gendeps.sh

# =============================================================================
# Build all libraries
# =============================================================================

./buildcapture.sh
./builddebug.sh

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
