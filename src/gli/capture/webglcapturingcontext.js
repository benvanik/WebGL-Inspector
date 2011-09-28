// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.capture.WebGLCapturingContext');

goog.require('goog.Disposable');



/**
 * Mock WebGLRenderingContext with capture features.
 *
 * @constructor
 * @extends {goog.Disposable}
 * @param {!WebGLRenderingContext} gl Original rendering context.
 * @param {!gli.capture.Transport} transport Transport used for
 *     capture output.
 */
gli.capture.WebGLCapturingContext = function(gl, transport) {
  goog.base(this);

  /**
   * Original rendering context.
   * @private
   * @type {!WebGLRenderingContext}
   */
  this.gl = gl;

  /**
   * Transport used for capture output.
   * @private
   * @type {!gli.capture.Transport}
   */
  this.transport_ = transport;
  this.registerDisposable(transport);
};
goog.inherits(gli.capture.WebGLCapturingContext, goog.Disposable);
