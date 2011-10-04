// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.data.Frame');

goog.require('gli.util');
goog.require('goog.array');



/**
 * Captured frame information.
 * @constructor
 * @param {Object=} opt_json Serialized JSON representation.
 */
gli.data.Frame = function(opt_json) {
  /**
   * Unique data-session frame number.
   * @type {number}
   */
  this.frameNumber = opt_json ? opt_json.frameNumber : 0;

  /**
   * Human-friendly frame name.
   * @type {string}
   */
  this.name = opt_json ? opt_json.name : 'Frame';
};


goog.exportProperty(gli.data.Frame.prototype, 'frameNumber',
    gli.data.Frame.prototype.frameNumber);
goog.exportProperty(gli.data.Frame.prototype, 'name',
    gli.data.Frame.prototype.name);


/**
 * Initializes the frame capture data.
 * @param {number} frameNumber Unique capture-session frame number.
 * @param {!WebGLRenderingContext} gl Raw GL context to source info from.
 */
gli.data.Frame.prototype.init = function(frameNumber, gl) {
  this.frameNumber = frameNumber;
  this.name = 'Frame ' + frameNumber;
};


/**
 * Serialize the frame data.
 * @return {Object} JSON serialized version of the information.
 */
gli.data.Frame.prototype.serialize = function() {
  return JSON.stringify(this);
};
