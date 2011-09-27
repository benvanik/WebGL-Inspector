#!/bin/sh

CLOSURE_LIBRARY=deps/closure-library

# $1 = name
# $2 = root namespace
# $3 = source path
generateDeps() {
  $CLOSURE_LIBRARY/closure/bin/build/depswriter.py  \
    --root_with_prefix="$3 $3" \
    --output_file=$3/deps.js
}

# =============================================================================
# Capture library
# =============================================================================
echo "Generating capture deps.js..."

generateDeps capture gli.capture src/gli/capture/

echo ""
# =============================================================================
# Capture library
# =============================================================================
echo "Generating debug deps.js..."

generateDeps debug gli.debug src/gli/debug/

echo ""
