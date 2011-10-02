// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.data.Frame');



/**
 * A complete frame, containing all calls captured.
 *
 * @constructor
 */
gli.data.Frame = function() {

};


/**
 * Deserializes a Frame from a previously stringified instance.
 * @param {!Object} json Source json object.
 * @return {!gli.data.Frame} Frame instance.
 */
gli.data.Frame.deserialize = function(json) {
  var frame = new gli.data.Frame();
  // TODO(benvanik): copy
  return frame;
};
