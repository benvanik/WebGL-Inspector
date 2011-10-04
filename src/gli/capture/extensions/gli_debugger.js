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
gli.capture.extensions.GLI_debugger.prototype.ignoreErrors =
    function() {
  var gl = this.ctx.gl;
  while (gl.getError() != gl.NO_ERROR) {
    // Eat errors
  }
};


/**
 * Requests a frame capture.
 */
gli.capture.extensions.GLI_debugger.prototype.captureFrame =
    function() {
  this.ctx.requestCapture();
};


/**
 * Signals that a frame has completed.
 */
gli.capture.extensions.GLI_debugger.prototype.terminateFrame =
    function() {
  this.ctx.terminateFrame();
};


/**
 * Sets the active WebGLRenderingContext's friendly name.
 * @param {string=} opt_name New name for the context.
 */
gli.capture.extensions.GLI_debugger.prototype.setContextName =
    function(opt_name) {
  this.ctx.setSessionName(opt_name);
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


goog.exportProperty(
    gli.capture.extensions.GLI_debugger.prototype,
    'ignoreErrors',
    gli.capture.extensions.GLI_debugger.prototype.ignoreErrors);
goog.exportProperty(
    gli.capture.extensions.GLI_debugger.prototype,
    'requestCapture',
    gli.capture.extensions.GLI_debugger.prototype.requestCapture);
goog.exportProperty(
    gli.capture.extensions.GLI_debugger.prototype,
    'terminateFrame',
    gli.capture.extensions.GLI_debugger.prototype.terminateFrame);
goog.exportProperty(
    gli.capture.extensions.GLI_debugger.prototype,
    'setContextName',
    gli.capture.extensions.GLI_debugger.prototype.setContextName);
goog.exportProperty(
    gli.capture.extensions.GLI_debugger.prototype,
    'setResourceName',
    gli.capture.extensions.GLI_debugger.prototype.setResourceName);
