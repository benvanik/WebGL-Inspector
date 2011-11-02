// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.capture');

goog.require('gli.capture.WebGLCapturingContext');
goog.require('gli.capture.transports.DebugTransport');
goog.require('gli.util.TimerController');
goog.require('goog.array');


/**
 * Shared transport.
 * @private
 * @type {gli.capture.Transport}
 */
gli.capture.transport_ = null;


/**
 * Shared timer controller.
 * @private
 * @type {gli.util.TimerController}
 */
gli.capture.timerController_ = null;


/**
 * Handles capture hook startup.
 */
gli.capture.start = function() {
  // Setup the target transport
  gli.capture.transport_ = new gli.capture.transports.DebugTransport();

  // Setup the shared timer controller (there can be only one!)
  gli.capture.timerController_ = new gli.util.TimerController();

  gli.capture.hookGetContext_();
};


/**
 * Hooks HTMLCanvasElement::getContext to return capture contexts.
 * @private
 */
gli.capture.hookGetContext_ = function() {
  // Ensure not already injected
  if (HTMLCanvasElement.prototype['getContextRaw']) {
    return;
  }

  // Stash original getContext and replace with our own
  var originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype['getContextRaw'] = originalGetContext;
  HTMLCanvasElement.prototype.getContext = gli.capture.canvasGetContext_;
};


/**
 * Wrapper property name when stored on the WebGLRenderingContext.
 * @private
 * @const
 * @type {string}
 */
gli.capture.CONTEXT_WRAPPER_NAME_ = 'gli_wrapper_';


/**
 * Gets a context from a canvas, optionally wrapping it in a capture context
 * if desired.
 * This method is designed to proxy HTMLCanvasElement::getContext.
 *
 * @private
 * @this {!HTMLCanvasElement}
 * @param {string} contextId Context ID.
 * @return {*} A context.
 */
gli.capture.canvasGetContext_ = function(contextId) {
  // Get the context
  var result = this['getContextRaw'].apply(this, arguments);
  if (!result) {
    return result;
  }

  // If already wrapped, return the wrapper
  if (result[gli.capture.CONTEXT_WRAPPER_NAME_]) {
    return result[gli.capture.CONTEXT_WRAPPER_NAME_];
  }

  // Ignore any context ID that we don't care about
  var contextIds = ['webgl', 'experimental-webgl'];
  if (!goog.array.contains(contextIds, contextId)) {
    return result;
  }

  // Wrap and stash on the original so that we can grab the wrapper if needed
  var wrapper = new gli.capture.WebGLCapturingContext(result,
      gli.capture.transport_,
      gli.capture.timerController_);
  result[gli.capture.CONTEXT_WRAPPER_NAME_] = wrapper;
  return wrapper;
};


gli.capture.start();
