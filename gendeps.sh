#!/bin/sh

source buildshared.sh

# =============================================================================
# Capture library
# =============================================================================
# NOTE(benvanik): not required, as the capture library must be compiled
#echo "Generating capture deps.js..."

#generateDeps capture gli.capture src/gli/capture/

#echo ""
# =============================================================================
# Capture library
# =============================================================================
echo "Generating debug deps.js..."

generateDeps debug gli.debug src/gli/debug/

echo ""
