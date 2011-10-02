// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.data.Call');



/**
 * A single call.
 *
 * @constructor
 */
gli.data.Call = function() {

};


/**
 * Deserializes a Call from a previously stringified instance.
 * @param {!Object} json Source json object.
 * @return {!gli.data.Call} Call instance.
 */
gli.data.Call.deserialize = function(json) {
  var call = new gli.data.Call();
  // TODO(benvanik): copy
  return call;
};
