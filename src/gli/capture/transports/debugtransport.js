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
