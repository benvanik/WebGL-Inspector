// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.util');

goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.math.Size');


/**
 * Constrains the given size to the given maximum dimension, preserving the
 * aspect ratio.
 * @param {!goog.math.Size} size Input size.
 * @param {number} maxDimension Maximum value for any dimension.
 * @return {!goog.math.Size} Constrained size.
 */
gli.util.constrainSize = function(size, maxDimension) {
  var newSize = new goog.math.Size(size.width, size.height);
  if (size.width > size.height) {
    if (size.width <= maxDimension) {
      return size;
    }
    newSize.width = maxDimension;
    newSize.height = size.height / size.width * maxDimension;
  } else {
    if (size.height <= maxDimension) {
      return size;
    }
    newSize.height = maxDimension;
    newSize.width = size.width / size.height * maxDimension;
  }
  return newSize;
};


/**
 * Returns true if the specified value is a TypedArray.
 * @param {*} value Value to test.
 * @return {boolean} Whether the value is a TypedArray.
 */
gli.util.isTypedArray = function(value) {
  return (value instanceof Int8Array) ||
      (value instanceof Uint8Array) ||
      (value instanceof Int16Array) ||
      (value instanceof Uint16Array) ||
      (value instanceof Int32Array) ||
      (value instanceof Uint32Array) ||
      (value instanceof Float32Array);
};


/**
 * Default maximum number of elements to put in the output string when using
 * {@see gli.util#typedArrayToString}.
 * @private
 * @const
 * @type {number}
 */
gli.util.TYPED_ARRAY_MAX_ELEMENTS_ = 64;


/**
 * Converts a TypedArray to a string in a consistent way, clamping large arrays
 * so that things don't hang.
 * @param {ArrayBufferView} buffer Buffer view.
 * @param {number=} opt_maxElements Maximum number of elements to return in the
 *     string.
 * @return {string} A string representation of the buffer view.
 */
gli.util.typedArrayToString = function(buffer, opt_maxElements) {
  if (!buffer) {
    return '(null)';
  }
  var maxIndex = goog.isDef(opt_maxElements) ? opt_maxElements :
      gli.util.TYPED_ARRAY_MAX_ELEMENTS_;
  maxIndex = Math.min(maxIndex, buffer.length);
  var s = '';
  for (var n = 0; n < maxIndex; n++) {
    s += buffer[n];
    if (n < buffer.length - 1) {
      s += ',';
    }
  }
  if (maxIndex < buffer.length) {
    s += ',... (' + (buffer.length) + ' total)';
  }
  return s;
};


/**
 * Converts a TypedArray to an array.
 * @param {!ArrayBufferView} buffer Buffer view.
 * @return {!Array} New array containing all of the elements in the source
 *     buffer.
 */
gli.util.typedArrayToArray = function(buffer) {
  var result = new Array(buffer.length);
  for (var n = 0; n < buffer.length; n++) {
    result[n] = buffer[n];
  }
  return result;
};


/**
 * Clones a TypedArray value, preserving the type.
 * @param {!ArrayBufferView} value Source array buffer view.
 * @return {!ArrayBufferView} Cloned array buffer view.
 */
gli.util.cloneTypedArray = function(value) {
  if (value instanceof Int8Array) {
    return new Int8Array(value);
  } else if (value instanceof Uint8Array) {
    return new Uint8Array(value);
  } else if (value instanceof Int16Array) {
    return new Int16Array(value);
  } else if (value instanceof Uint16Array) {
    return new Uint16Array(value);
  } else if (value instanceof Int32Array) {
    return new Int32Array(value);
  } else if (value instanceof Uint32Array) {
    return new Uint32Array(value);
  } else if (value instanceof Float32Array) {
    return new Float32Array(value);
  }
  goog.asserts.fail('unknown array type: ' + goog.typeOf(value));
};


/**
 * Returns true if the specified value is a WebGL resource.
 * @param {*} value Value to test.
 * @return {boolean} Whether the value is a WebGL resource.
 */
gli.util.isWebGLResource = function(value) {
  return (value instanceof WebGLBuffer) ||
      (value instanceof WebGLFramebuffer) ||
      (value instanceof WebGLProgram) ||
      (value instanceof WebGLRenderbuffer) ||
      (value instanceof WebGLShader) ||
      (value instanceof WebGLTexture);
};


/**
 * Gets a WebGL context for debug playback purposes.
 * @param {!HTMLCanvasElement} canvas Canvas to get context from.
 * @return {!WebGLRenderingContext} A WebGL context.
 */
gli.util.getWebGLContext = function(canvas) {
  // TODO(benvanik): build common attributes/take as args
  var attrs = {};

  /** @type {WebGLRenderingContext} */
  var gl = null;
  try {
    var contextName = 'experimental-webgl';

    // getContextRaw is present if we have hijacked getContext,
    // and should always be used instead
    if (canvas.getContextRaw) {
      gl = canvas.getContextRaw(contextName, attrs);
    } else {
      gl = canvas.getContext(contextName, attrs);
    }
  } catch (e) {
    window.console.log('unable to get WebGL context:');
    window.console.log(e);
    goog.asserts.fail('unable to get WebGL context');
  }

  // Enable all extensions on the context
  // TODO(benvanik): better extension tracking to more accurately match host
  // app behavior (so that we can error when using disabled extensions/etc)
  var extensionNames = gl.getSupportedExtensions();
  goog.array.forEach(extensionNames, function(name) {
    gl.getExtension(name);
  });

  return gl;
};


/**
 * Clones the given argument.
 * The behavior of this method is largely undefined, but the hope is that it
 * will be able to do deep clones of the given argument with as high of
 * fidelity as possible.
 * @param {*} value Source value.
 * @return {*} Cloned value.
 */
gli.util.clone = function(value) {
  // null | undefined
  if (!value) {
    return value;
  }

  // Primitive
  if (!goog.isObject(value)) {
    return value;
  }

  // Arrays/TypedArrays
  if (value instanceof ArrayBuffer) {
    // There may be a better way to do this, but I don't know it
    var target = new ArrayBuffer(value.byteLength);
    var sourceView = new DataView(value, 0, value.byteLength);
    var targetView = new DataView(target, 0, value.byteLength);
    for (var n = 0; n < value.byteLength; n++) {
      targetView.setUint8(n, sourceView.getUint8(n));
    }
    return target;
  } else if (gli.util.isTypedArray(value)) {
    return gli.util.cloneTypedArray(value);
  } else if (gli.util.isArrayLike(value)) {
    return goog.array.clone(value);
  }

  // DOM elements
  if (value instanceof HTMLCanvasElement) {
    var target = value.cloneNode(true);
    var ctx = target.getContext('2d');
    ctx.drawImage(value, 0, 0);
    return target;
  } else if (value instanceof HTMLImageElement) {
    var target = value.cloneNode(true);
    target.crossOrigin = value.crossOrigin || '';
    target.width = value.width;
    target.height = value.height;
    return target;
  } else if (value instanceof HTMLVideoElement) {
    var target = value.cloneNode(true);
    // TODO(benvanik): clone video elements
    // Need all properties (src/etc) as well as time
    return target;
  }

  // Image data (from <canvas>)
  if (goog.typeOf(value) == 'ImageData') {
    var dummyCanvas = goog.dom.createElement('canvas');
    gli.util.ensureInDocument(dummyCanvas);
    var dummyContext = dummyCanvas.getContext('2d');
    var target = dummyContext.createImageData(value);
    for (var n = 0; n < value.data.length; n++) {
      target.data[n] = value.data[n];
    }
    return target;
  }

  return value;
};

