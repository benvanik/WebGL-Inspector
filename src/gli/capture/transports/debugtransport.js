// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.capture.transports.DebugTransport');

goog.require('gli.capture.Transport');



/**
 * Debug capture transport.
 * The debug transport will log to the console all state changes and
 * events.
 *
 * @constructor
 * @extends {gli.capture.Transport}
 */
gli.capture.transports.DebugTransport = function() {
  goog.base(this);
};
goog.inherits(gli.capture.transports.DebugTransport,
    gli.capture.Transport);


/**
 * @override
 */
gli.capture.transports.DebugTransport.prototype.appendSessionInfo =
    function(sessionInfo) {
  //
  window.console.log('appendSessionInfo:');
  window.console.log(sessionInfo.serialize());
};


/**
 * @override
 */
gli.capture.transports.DebugTransport.prototype.appendResourceInfo =
    function(resourceId, resourceInfo) {
  //
  window.console.log('appendResourceInfo: ' + resourceId);
  window.console.log(resourceInfo.serialize());
};


/**
 * @override
 */
gli.capture.transports.DebugTransport.prototype.appendResourceVersion =
    function(resourceId, resourceVersion) {
  //
  window.console.log('appendResourceVersion: ' + resourceId);
  window.console.log(resourceVersion.serialize());
};


/**
 * @override
 */
gli.capture.transports.DebugTransport.prototype.appendFrame =
    function(frame) {
  //
  window.console.log('appendFrame');
  window.console.log(frame.serialize());
};
