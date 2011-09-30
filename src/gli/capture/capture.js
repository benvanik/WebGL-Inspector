// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.capture');

goog.require('gli.capture.WebGLCapturingContext');
goog.require('gli.capture.transports.DebugTransport');
goog.require('goog.array');


/**
 * Handles capture hook startup.
 */
gli.capture.start = function() {
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
  if (result.wrapper) {
    return result.wrapper;
  }

  // Ignore any context ID that we don't care about
  var contextIds = ['webgl', 'experimental-webgl'];
  if (!goog.array.contains(contextIds, contextId)) {
    return result;
  }

  // Setup the appropriate transport
  var transport = new gli.capture.transports.DebugTransport();

  // Wrap and stash on the original so that we can grab the wrapper if needed
  var wrapper = new gli.capture.WebGLCapturingContext(result, transport);
  result.wrapper = wrapper;
  return wrapper;
};


gli.capture.start();
