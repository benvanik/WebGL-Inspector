// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.data');

goog.require('gli.util');


/**
 * Converts an argument into a format that can be round-tripped through JSON.
 * @param {*} value Source argument.
 * @return {*} JSON argument.
 */
gli.data.valueToJson = function(value) {
  if (!value) {
    return value;
  } else if (value.sourceUniformName) {
    // Uniform location
    return {
      gliType: 'UniformLocation',
      id: value.sourceProgram.id,
      name: value.sourceUniformName
    };
  //} else if (gli.util.isWebGLResource(value)) {
  } else if (value.isWebGLObject) {
    // WebGL resource reference
    var tracked = value.tracked;
    return {
      gliType: tracked.type,
      id: tracked.id
    };
  } else if (gli.util.isTypedArray(value)) {
    return {
      arrayType: glitypename(value),
      data: gli.util.typedArrayToArray(value)
    };
  } else if (glitypename(value) == 'ImageData') {
    return {
      domType: 'ImageData',
      width: value.width,
      height: value.height,
      data: gli.util.typedArrayToArray(value.data)
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
      domType: 'HTMLCanvasElement',
      width: pixels.width,
      height: pixels.height,
      data: gli.util.typedArrayToArray(pixels.data)
    };
  } else if (value instanceof HTMLImageElement) {
    return {
      domType: 'HTMLImageElement',
      width: value.width,
      height: value.height,
      src: value.src
    };
  } else if (value instanceof HTMLVideoElement) {
    return {
      domType: 'HTMLVideoElement',
      width: value.width,
      height: value.height,
      src: value.src
    };
  } else {
    // Generic arg
    return gli.util.clone(value);
  }
};
