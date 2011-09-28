// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.capture.WebGLCapturingContext');

goog.require('gli.capture.extensions.GLI_debugger');
goog.require('goog.array');
goog.require('goog.object');
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

  /**
   * Map of all original methods from the prototype, before wrapping.
   * @type {!Object.<!Function>}
   */
  this.originalMethods = {};

  /**
   * A map of all enabled extensions by names.
   * @private
   * @type {!Object.<boolean>}
   */
  this.enabledExtensions_ = {};

  /**
   * Map of all custom extension instances.
   * @private
   * @type {!Object.<!gli.capture.Extension>}
   */
  this.customExtensions_ = {};

  this.saveOriginalMethods_();
  this.setupExtensions_();
  this.setupGetError_();
  this.setupFields_();
  this.setupMethods_();

  // frame #
  // inFrame
  // session?
  // resource cache
  // begin/end frame
  // frameterminator
  // queue request
};
goog.inherits(gli.capture.WebGLCapturingContext, goog.Disposable);


/**
 * Saves off all original methods from the GL context.
 * @private
 */
gli.capture.WebGLCapturingContext.prototype.saveOriginalMethods_ =
    function() {
  goog.object.forEach(this.gl, function(value, key) {
    if (goog.isFunction(value)) {
      this.originalMethods[key] = value;
    }
  }, this);
};


/**
 * Creates and stores all custom extension types.
 * @private
 */
gli.capture.WebGLCapturingContext.prototype.setupExtensions_ = function() {
  var extensions = [
    new gli.capture.extensions.GLI_debugger(this)
  ];
  goog.array.forEach(extensions, function(extension) {
    this.customExtensions_[extension.name] = extension;
    this.registerDisposable(extension);
  }, this);

  // getSupportedExtensions augmentation that returns our custom ones
  var original_getSupportedExtensions =
      this.originalMethods['getSupportedExtensions'];
  this['getSupportedExtensions'] = goog.bind(function() {
    var supportedExtensions = original_getSupportedExtensions.apply(this);
    goog.array.extend(supportedExtensions, this.customExtensions_);
    return supportedExtensions;
  }, this);

  // getExtension augmentation that returns our custom ones and tracks when
  // an extension is enabled
  var original_getExtension =
      this.originalMethods['getExtension'];
  this['getExtension'] = goog.bind(function(name) {
    var extension = this.customExtensions_[name];
    if (!extension) {
      extension = original_getExtension.apply(this, arguments);
    }
    if (extension) {
      // Mark enabled (if not already)
      if (!this.enabledExtensions_[name]) {
        this.enabledExtensions_[name] = true;
      }
    }
    return extension;
  }, this);
};


/**
 * Replaces getError with a custom implementation sourcing from the
 * capture context.
 * @private
 */
gli.capture.WebGLCapturingContext.prototype.setupGetError_ = function() {
  // TODO(benvanik): getError replacement
};


/**
 * Copies all fields (non-functions) to this instance.
 * @private
 */
gli.capture.WebGLCapturingContext.prototype.setupFields_ = function() {
  goog.object.forEach(gl, function(value, key) {
    if (!goog.isFunction(value)) {
      this[key] = value;
    }
  }, this);
};


/**
 * Wraps all methods on the source GL context and adds them to this instance.
 * @private
 */
gli.capture.WebGLCapturingContext.prototype.setupMethods_ = function() {
  // this.originalMethods
};
