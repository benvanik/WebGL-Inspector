// Copyright 2011 Ben Vanik. All Rights Reserved..

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.capture.resources.Program');
goog.provide('gli.capture.resources.UniformInfo');

goog.require('gli.capture.Resource');


/**
 * Uniform information.
 * @typedef {{
 *   program: !gli.capture.resources.Program,
 *   name: string
 * }}
 */
gli.capture.resources.UniformInfo;



/**
 * Base capture resource wrapper.
 * All tracked resources refer to one of these instances, which
 * contains all information needed for version tracking.
 *
 * @constructor
 * @extends {gli.capture.Resource}
 */
gli.capture.resources.Program = function() {
  goog.base(this);
};
goog.inherits(gli.capture.resources.Program, gli.capture.Resource);


/**
 * Gets the uniform information from a WebGL uniform location.
 * @param {WebGLUniformLocation} uniformLocation WebGL uniform location.
 * @return {gli.capture.resources.UniformInfo} Uniform information, if valid.
 */
gli.capture.resources.Program.getUniformInfo = function(uniformLocation) {
  if (uniformLocation && uniformLocation['trackedUniformInfo_']) {
    return /** @type {!gli.capture.resources.UniformInfo} */ (
        uniformLocation['trackedUniformInfo_']);
  }
  return null;
};
