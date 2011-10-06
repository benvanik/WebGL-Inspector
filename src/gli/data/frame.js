// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.data.Frame');

goog.require('gli.capture.resources.Program');
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

  /**
   * All resources used in the frame, mapped by resource ID.
   * @private
   * @type {!Object.<!gli.data.ResourceEntry>}
   */
  this.resourceTable_ = {};

  /**
   * Recorded calls.
   * @type {!Array.<!gli.data.Call>}
   */
  this.calls = [];
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


/**
 * Adds a call to the frame.
 * @param {!gli.data.Call} call Call to add.
 */
gli.data.Frame.prototype.addCall = function(call) {
  this.calls.push(call);
};



/**
 * Marks a resource (and all dependent resources) as used in this frame.
 * @param {!gli.capture.WebGLCapturingContext} ctx Capture context.
 * @param {!gli.capture.Resource} resource Resource instance.
 */
gli.data.Frame.prototype.markResourceUsed = function(ctx, resource) {
  var frame = this.currentFrame_;
  goog.asserts.assert(frame);

  // Grab dependent resources

  // Programs, on first use, need to have their initial uniform values
  // captured so that we can reset them on frame start
  if (resource instanceof gli.capture.resources.Program) {
    var wasUsed = !!this.resourceTable_[resourceId];
    if (!wasUsed) {
      this.initialUniforms_.push()
    }
  }

  if (tracked instanceof gli.capture.resources.Program) {
      // Cache program uniforms on first use
      var wasUsed = this.resourceTable_[resourceId];
      if (!wasUsed && tracked instanceof gli.capture.resources.Program) {
          var gl = this.gl;
          this.initialUniforms.push({
              id: resourceId,
              values: tracked.captureUniforms(gl, tracked.target)
          });
      }
  }

  // Check for dependent resources
  for (var dependentId in tracked.currentVersion.dependentResourceIds) {
      this.markResourceUsed(dependentId);
  }

  // Add entry
  this.resourceTable[resourceId] = true;
};
