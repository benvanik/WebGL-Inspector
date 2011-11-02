// Copyright 2011 Ben Vanik. All Rights Reserved..

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.capture.ResourceCache');



/**
 * Capture resource cache for manging resources that have been recorded.
 *
 * @constructor
 * @extends {goog.Disposable}
 */
gli.capture.ResourceCache = function() {
  goog.base(this);
};
goog.inherits(gli.capture.ResourceCache, goog.Disposable);
