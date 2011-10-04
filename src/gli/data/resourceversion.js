// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.data.ResourceVersion');

goog.require('gli.util');
goog.require('goog.array');



/**
 * Resource version data.
 * @constructor
 * @param {Object=} opt_json Serialized JSON representation.
 */
gli.data.ResourceVersion = function(opt_json) {
  /**
   * Unique data-session resource ID.
   * @type {number}
   */
  this.id = opt_json ? opt_json.id : 0;

  /**
   * Version number of this blob.
   * @type {number}
   */
  this.versionNumber = opt_json ? opt_json.versionNumber : 0;

  /**
   * Calls required to reconstruct this resource version.
   * @type {!Array.<!gli.data.Call>}
   */
  this.calls = [];
};


/**
 * Initializes the resource information blob.
 * @param {number} resourceId Unique capture-session resource ID.
 * @param {number} versionNumber Resource version number.
 */
gli.data.ResourceVersion.prototype.init = function(resourceId, versionNumber) {
  this.id = resourceId;
  this.versionNumber = versionNumber;
};


/**
 * Serialize the resource version data.
 * @return {Object} JSON serialized version of the information.
 */
gli.data.ResourceVersion.prototype.serialize = function() {
  return JSON.stringify(this);
};
