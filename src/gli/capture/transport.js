// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.capture.Transport');

goog.require('goog.Disposable');



/**
 * Capture output transport interface.
 * Transports
 *
 * @constructor
 * @extends {goog.Disposable}
 */
gli.capture.Transport = function() {
  goog.base(this);
};
goog.inherits(gli.capture.Transport, goog.Disposable);
