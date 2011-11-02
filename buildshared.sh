#!/bin/sh

CLOSURE_LIBRARY=deps/closure-library
CLOSURE_COMPILER=deps/closure-compiler

# Setup output path
prepareOutput() {
  if [ ! -d "bin" ]; then mkdir bin; fi
}

# Generate dependencies
# $1 = name
# $2 = root namespace
# $3 = source path
generateDeps() {
  $CLOSURE_LIBRARY/closure/bin/build/depswriter.py  \
    --root_with_prefix="$3 $3" \
    --output_file=$3/deps.js
}

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
