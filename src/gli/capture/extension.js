// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.capture.Extension');

goog.require('goog.Disposable');



/**
 * Base type for custom WebGL extensions.
 * @constructor
 * @extends {goog.Disposable}
 * @param {!gli.capture.WebGLCapturingContext} ctx Capture context.
 * @param {string} name Extension name.
 */
gli.capture.Extension = function(ctx, name) {
  goog.base(this);

  /**
   * Owning capture context.
   * @type {!gli.capture.WebGLCapturingContext}
   */
  this.ctx = ctx;

  /**
   * The name of the extension.
   * @type {string}
   */
  this.name = name;
};
goog.inherits(gli.capture.Extension, goog.Disposable);


