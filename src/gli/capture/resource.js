// Copyright 2011 Ben Vanik. All Rights Reserved..

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.capture.Resource');



/**
 * Base capture resource wrapper.
 * All tracked resources refer to one of these instances, which
 * contains all information needed for version tracking.
 *
 * @constructor
 */
gli.capture.Resource = function() {
};


/**
 * Gets the tracked object reference from the given WebGL resource.
 * @param {WebGLObject} webglObject WebGL object.
 * @return {gli.capture.Resource} Tracked resource, if valid.
 */
gli.capture.Resource.get = function(webglObject) {
  if (webglObject && webglObject['trackedResourceInstance_']) {
    return /** @type {!gli.capture.Resource} */ (
        webglObject['trackedResourceInstance_']);
  }
  return null;
};
