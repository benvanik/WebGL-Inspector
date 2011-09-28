// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.capture.extensions.GLI_debugger');

goog.require('gli.capture.Extension');



/**
 * GLI_debugger extension implementation.
 * Provides basic control over the debugger, and can be used by applications
 * to more accurately capture relevant information.
 *
 * @constructor
 * @extends {gli.capture.Extension}
 * @param {!gli.capture.WebGLCapturingContext} ctx Capture context.
 */
gli.capture.extensions.GLI_debugger = function(ctx) {
  goog.base(this, ctx, 'GLI_debugger');
};
goog.inherits(gli.capture.extensions.GLI_debugger,
    gli.capture.Extension);


/**
 * Clears all currently set errors.
 */
gli.capture.extensions.GLI_debugger.prototype.ignoreErrors = function() {
  var gl = this.ctx.gl;
  while (gl.getError() != gl.NO_ERROR);
};


/**
 * Requests a frame capture.
 * @param {!(function(): void)=} opt_callback A function to call when the
 *     capture has completed.
 */
gli.capture.extensions.GLI_debugger.prototype.requestCapture =
    function(opt_callback) {
  // TODO(benvanik): request capture
};


/**
 * Signals that a frame has completed.
 */
gli.capture.extensions.GLI_debugger.prototype.terminateFrame = function() {
  // TODO(benvanik): terminate frame
};


/**
 * Sets the given resource's friendly name.
 * @param {!WebGLObject} resource WebGL resource.
 * @param {string=} opt_name New name for the resource.
 */
gli.capture.extensions.GLI_debugger.prototype.setResourceName =
    function(resource, opt_name) {
  // TODO(benvanik): set resource name
};
