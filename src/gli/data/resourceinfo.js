// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.data.ResourceInfo');

goog.require('gli.data.ResourceStatus');
goog.require('gli.util');
goog.require('goog.array');



/**
 * Resource information/metadata.
 * @constructor
 * @param {Object=} opt_json Serialized JSON representation.
 */
gli.data.ResourceInfo = function(opt_json) {
  /**
   * Unique data-session resource ID.
   * @type {number}
   */
  this.id = opt_json ? opt_json.id : 0;

  /**
   * Human-friendly resource name.
   * @type {string}
   */
  this.name = opt_json ? opt_json.name : 'Resource';

  /**
   * Current status of the resource.
   * @type {gli.data.ResourceStatus}
   */
  this.status = opt_json ? opt_json.status : gli.data.ResourceStatus.ALIVE;
};


/**
 * Initializes the resource information blob.
 * @param {number} resourceId Unique capture-session resource ID.
 * @param {!WebGLRenderingContext} gl Raw GL context to source info from.
 * @param {!WebGLObject} resource WebGL resource.
 */
gli.data.ResourceInfo.prototype.init = function(resourceId, gl, resource) {
  this.id = resourceId;
  this.name = 'Resource ' + resourceId;
};


/**
 * Serialize the resource information blob.
 * @return {Object} JSON serialized version of the information.
 */
gli.data.ResourceInfo.prototype.serialize = function() {
  return JSON.stringify(this);
};
