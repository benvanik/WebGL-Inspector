// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.capture.WebGLCapturingContext');

goog.require('gli.capture.extensions.GLI_debugger');
goog.require('gli.data.SessionInfo');
goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.object');



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
   * Session info.
   * @private
   * @type {!gli.data.SessionInfo}
   */
  this.sessionInfo_ = new gli.data.SessionInfo(gl);
  this.transport_.appendSessionInfo(this.sessionInfo_);

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
  var gl = this.gl;
  goog.object.forEach(gl, function(value, key) {
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
  var gl = this.gl;
  goog.object.forEach(gl, function(value, key) {
    if (!goog.isFunction(value)) {
      if (!goog.isDef(this[key])) {
        this[key] = value;
      }
    }
  }, this);
};


/**
 * Wraps all methods on the source GL context and adds them to this instance.
 * @private
 */
gli.capture.WebGLCapturingContext.prototype.setupMethods_ = function() {
  goog.object.forEach(this.originalMethods, function(value, key) {
    this[key] = goog.bind(value, this.gl);
  }, this);
};


/**
 * Wraps a single method for recording.
 *
 * The underlying method used is pulled off of the current context. This
 * enables certain methods to actually be double-wrapped (such as resource
 * capture routines), but only if they were setup before using this method.
 *
 * @private
 * @param {string} name Method name.
 */
gli.capture.WebGLCapturingContext.prototype.setupMethod_ =
    function(name) {
  // TODO(benvanik): JIT the method (using new Function(src))

  // Grab the original method off of us, or if that fails from the
  // original method set
  var originalMethod = this[name] || this.originalMethods[name];

  // Setup new method
  this[name] =
      /**
       * @this {gli.capture.WebGLCapturingContext}
       * @return {*} Method result.
       */
      function() {
    // TODO(benvanik): implicit frame begin

    if (capturing) {
      // TODO(benvanik): ignore all existing errors
      // TODO(benvanik): grab stack
      // TODO(benvanik): allocate call
      // TODO(benvanik): interval time
      var result = originalMethod.apply(this.gl, arguments);
    } else {
      // Call original
      var result = originalMethod.apply(this.gl, arguments);

      // Grab errors

      return result;
    }
  };
};


// Override with property pass-throughs a few of the values that will
// change dynamically at runtime
Object.defineProperty(gli.capture.WebGLCapturingContext.prototype,
    'drawingBufferWidth', {
      /** @this {gli.capture.WebGLCapturingContext} */
      'get': function() { return this.gl['drawingBufferWidth']; }
    });
Object.defineProperty(gli.capture.WebGLCapturingContext.prototype,
    'drawingBufferHeight', {
      /** @this {gli.capture.WebGLCapturingContext} */
      'get': function() { return this.gl['drawingBufferHeight']; }
    });
