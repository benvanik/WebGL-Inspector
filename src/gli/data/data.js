// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.data');

goog.require('gli.capture.Resource');
goog.require('gli.capture.resources.Program');
goog.require('gli.util');


/**
 * Converts an argument into a format that can be round-tripped through JSON.
 * Primitives (strings, numbers, etc) are returned directly. Other types
 * are wrapped in anonymous objects with a 'type' field denoting what they
 * are.
 *
 * @param {*} value Source argument.
 * @return {*} JSON argument.
 */
gli.data.valueToJson = function(value) {
  if (!value) {
    return value;
  } else if (value instanceof WebGLUniformLocation) {
    // Uniform location
    var uniformInfo = gli.capture.resources.Program.getUniformInfo(value);
    if (uniformInfo) {
      return {
        'type': 'WebGLUniformLocation',
        'id': uniformInfo.program.id,
        'name': uniformInfo.name
      };
    }
    return null;
  } else if (gli.util.isWebGLResource(value)) {
    // WebGL resource reference
    var resource = gli.capture.Resource.get(value);
    if (resource) {
      return {
        'type': gli.util.getTypeName(value),
        'id': resource.id
      };
    }
    return null;
  } else if (gli.util.isTypedArray(value)) {
    return {
      'type': gli.util.getTypeName(value),
      'data': gli.util.typedArrayToArray(value)
    };
  } else if (goog.typeOf(value) == 'ImageData') {
    return {
      'type': 'ImageData',
      'width': value.width,
      'height': value.height,
      'data': gli.util.typedArrayToArray(value.data)
    };
  } else if (value instanceof HTMLCanvasElement) {
    // NOTE: no way to know if the source canvas was 2D or 3D, so can't get a
    // context and extract the pixels. Draw to one we know is 2D and get from
    // that instead.
    var canvas = (value.ownerDocument || document).createElement('canvas');
    canvas.width = value.width;
    canvas.height = value.height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(value, 0, 0);
    var pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    return {
      'type': 'HTMLCanvasElement',
      'width': pixels.width,
      'height': pixels.height,
      'data': gli.util.typedArrayToArray(pixels.data)
    };
  } else if (value instanceof HTMLImageElement) {
    return {
      'type': 'HTMLImageElement',
      'width': value.width,
      'height': value.height,
      'src': value.src
    };
  } else if (value instanceof HTMLVideoElement) {
    return {
      'type': 'HTMLVideoElement',
      'width': value.width,
      'height': value.height,
      'src': value.src
    };
  } else {
    // Generic arg
    return gli.util.clone(value);
  }
};


/**
 * Converts an argument from JSON to a real value - sometimes recreating
 * DOM elements to grabbing resources from the cache.
 *
 * @param {*} value Source JSON.
 * @return {*} Deserialized value.
 */
gli.data.jsonToValue = function(value) {
  // TODO(benvanik): from gli.playback.data.Converter
  // TODO(benvanik): accept resource cache
  // TODO(benvanik): some way to signal that the result may not be
  // loaded yet (in the case of images/etc)
  return value;
};
