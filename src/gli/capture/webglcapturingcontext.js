// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.capture.WebGLCapturingContext');

goog.require('gli.capture.ResourceCache');
goog.require('gli.capture.extensions.GLI_debugger');
goog.require('gli.capture.resources.Program');
goog.require('gli.data.Call');
goog.require('gli.data.Frame');
goog.require('gli.data.SessionInfo');
goog.require('goog.Disposable');
goog.require('goog.array');
goog.require('goog.asserts');
goog.require('goog.object');



/**
 * Mock WebGLRenderingContext with capture features.
 *
 * @constructor
 * @extends {goog.Disposable}
 * @param {!WebGLRenderingContext} gl Original rendering context.
 * @param {!gli.capture.Transport} transport Transport used for
 *     capture output.
 * @param {!gli.util.TimerController} timerController Shared timer controller.
 */
gli.capture.WebGLCapturingContext = function(gl, transport, timerController) {
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

  /**
   * Shared timer controller.
   * @private
   * @type {!gli.util.TimerController}
   */
  this.timerController_ = timerController;

  /**
   * Resource cache.
   * @type {!gli.capture.ResourceCache}
   */
  this.resourceCache = new gli.capture.ResourceCache(this);
  this.registerDisposable(this.resourceCache);

  /**
   * Session ID.
   * @private
   * @type {number}
   */
  this.sessionId_ = gli.capture.WebGLCapturingContext.nextId_++;

  /**
   * Session info.
   * @private
   * @type {!gli.data.SessionInfo}
   */
  this.sessionInfo_ = new gli.data.SessionInfo();

  /**
   * Number of frames that should be captured following the current frame.
   * Ex, =1 means capture the next frame, =2 means capture the next two
   * subsequent frames.
   * @private
   * @type {number}
   */
  this.captureRequests_ = 0;

  /**
   * Current (estimated) frame number.
   * @private
   * @type {number}
   */
  this.frameNumber_ = 0;

  /**
   * Whether inside of a frame.
   * @private
   * @type {boolean}
   */
  this.inFrame_ = false;

  /**
   * Current frame being captured, if a capture is underway.
   * @private
   * @type {gli.data.Frame}
   */
  this.currentFrame_ = null;

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
  this.setupFields_();
  this.setupMethods_();
  this.setupExtensions_();
  this.setupGetError_();

  this.transport_.createSession(this.sessionId_);
  this.sessionInfo_.init(this.sessionId_, gl);
  this.transport_.appendSessionInfo(this.sessionId_, this.sessionInfo_);

  this.timerController_.addEventListener(
      gli.util.TimerController.EventType.TIMER_BOUNDARY,
      this.terminateFrame, false, this);
};
goog.inherits(gli.capture.WebGLCapturingContext, goog.Disposable);


/**
 * Next unique session ID.
 * @private
 * @type {number}
 */
gli.capture.WebGLCapturingContext.nextId_ = 0;


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
    this.setupMethod_(key);
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

  /**
   * @this {gli.capture.WebGLCapturingContext}
   * @return {*} Method result.
   */
  var captureFunction = function() {
    // TODO(benvanik): implicit frame begin
    if (!this.inFrame_) {
      this.beginFrame_();
    }

    if (this.currentFrame_) {
      // TODO(benvanik): ignore all existing errors
      // TODO(benvanik): grab stack
      // TODO(benvanik): interval time

      // TODO(benvanik): mark resources used

      // Call original
      var result = originalMethod.apply(this.gl, arguments);

      // Grab errors
      // TODO(benvanik): only sometimes? clear before?
      var error = this.gl.getError();

      // Mark resources used
      for (var n = 0; n < call.args.length; n++) {
        var arg = call.args[n];
        if (gli.util.isWebGLResource(arg)) {
          var resource = gli.capture.Resource.get(arg);
          if (resource) {
            this.currentFrame_.markResourceUsed(this, resource);
          }
        }
      }

      // Record
      var call = new gli.data.Call();
      call.init(name, arguments, result, error);
      this.currentFrame_.addCall(call);

      return result;
    } else {
      // Call original
      var result = originalMethod.apply(this.gl, arguments);

      // Grab errors?

      return result;
    }
  };
  this[name] = goog.bind(captureFunction, this);
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
    var supportedExtensions = original_getSupportedExtensions.apply(this.gl);
    var extensionNames = goog.object.getKeys(this.customExtensions_);
    goog.array.extend(supportedExtensions, extensionNames);
    return supportedExtensions;
  }, this);

  // getExtension augmentation that returns our custom ones and tracks when
  // an extension is enabled
  var original_getExtension =
      this.originalMethods['getExtension'];
  this['getExtension'] = goog.bind(function(name) {
    var extension = this.customExtensions_[name];
    if (!extension) {
      extension = original_getExtension.apply(this.gl, arguments);
    }
    if (extension) {
      // Mark enabled (if not already)
      if (!this.enabledExtensions_[name]) {
        this.enabledExtensions_[name] = true;
        this.sendEnabledExtensions_();
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


/**
 * Sets the active session's friendly name.
 * @param {string=} opt_name New name for the context.
 */
gli.capture.WebGLCapturingContext.prototype.setSessionName =
    function(opt_name) {
  this.sessionInfo_.name = opt_name || 'Session';
  this.transport_.appendSessionInfo(this.sessionId_, this.sessionInfo_);
};


/**
 * Sends an updated list of enabled extensions to the transport.
 * @private
 */
gli.capture.WebGLCapturingContext.prototype.sendEnabledExtensions_ =
    function() {
  var extensions = goog.object.getKeys(this.enabledExtensions_);
  this.sessionInfo_.enabledExtensions = extensions;
  this.transport_.appendSessionInfo(this.sessionId_, this.sessionInfo_);
};


/**
 * Requests the capture of 1+ frames.
 * @param {number=} opt_frameCount Number of frames to capture, default 1.
 */
gli.capture.WebGLCapturingContext.prototype.requestCapture =
    function(opt_frameCount) {
  this.captureRequests_ = opt_frameCount || 1;
};


/**
 * Signals that the current frame has ended.
 */
gli.capture.WebGLCapturingContext.prototype.terminateFrame = function() {
  if (this.inFrame_) {
    this.endFrame_();
  }
};


/**
 * Begins a capture frame.
 * @private
 */
gli.capture.WebGLCapturingContext.prototype.beginFrame_ = function() {
  goog.asserts.assert(!this.inFrame_);
  this.inFrame_ = true;

  this.frameNumber_++;

  if (this.captureRequests_) {
    this.captureRequests_--;

    // Begin capture
    var frame = this.currentFrame_ = new gli.data.Frame();
    frame.init(this.frameNumber_, this.gl);

    // Eat errors before we start capturing
    while (this.gl.getError() != this.gl.NO_ERROR) {
    }
  }
};


/**
 * Ends a capture frame.
 * @private
 */
gli.capture.WebGLCapturingContext.prototype.endFrame_ = function() {
  goog.asserts.assert(this.inFrame_);
  this.inFrame_ = false;

  var frame = this.currentFrame_;
  if (frame) {
    this.currentFrame_ = null;

    // TODO(benvanik): finalize - maybe take a screenshot?

    // Ship frame
    this.transport_.appendFrame(this.sessionId_, frame);
  }
};
