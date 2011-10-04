// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.data.SessionInfo');

goog.require('gli.util');
goog.require('goog.array');



/**
 * Session information (such as GL details, etc).
 * @constructor
 * @param {Object=} opt_json Serialized JSON representation.
 */
gli.data.SessionInfo = function(opt_json) {
  /**
   * Session ID.
   * @type {number}
   */
  this.id = opt_json ? opt_json.id : 0;

  /**
   * Human-friendly session name.
   * @type {string}
   */
  this.name = opt_json ? opt_json.name : 'Session';

  /**
   * Time the session started.
   * @type {Date}
   */
  this.startTime = opt_json ? opt_json.name : goog.now();

  /**
   * Static GL parameter map.
   * @type {!Object.<string|number|Array>}
   */
  this.parameters = opt_json ? opt_json.parameters : {};

  /**
   * List of all supported extensions.
   * @type {!Array.<string>}
   */
  this.extensions = opt_json ? opt_json.extensions : [];

  /**
   * List of enabled extensions.
   * @type {!Array.<string>}
   */
  this.enabledExtensions = opt_json ? opt_json.enabledExtensions : [];
};


goog.exportProperty(gli.data.SessionInfo.prototype, 'id',
    gli.data.SessionInfo.prototype.id);
goog.exportProperty(gli.data.SessionInfo.prototype, 'name',
    gli.data.SessionInfo.prototype.name);
goog.exportProperty(gli.data.SessionInfo.prototype, 'startTime',
    gli.data.SessionInfo.prototype.startTime);
goog.exportProperty(gli.data.SessionInfo.prototype, 'parameters',
    gli.data.SessionInfo.prototype.parameters);
goog.exportProperty(gli.data.SessionInfo.prototype, 'extensions',
    gli.data.SessionInfo.prototype.extensions);
goog.exportProperty(gli.data.SessionInfo.prototype, 'enabledExtensions',
    gli.data.SessionInfo.prototype.enabledExtensions);


/**
 * Initializes the session information blob.
 * @param {number} sessionId Unique session ID.
 * @param {!WebGLRenderingContext} gl Raw GL context to source info from.
 * @param {!Array.<string>=} opt_enabledExtensions List of extension names.
 */
gli.data.SessionInfo.prototype.init = function(sessionId, gl,
    opt_enabledExtensions) {
  this.id = sessionId;
  this.name = 'Session ' + this.id;

  var stateParameters = [
    'ALIASED_LINE_WIDTH_RANGE',
    'ALIASED_POINT_SIZE_RANGE',
    'ALPHA_BITS',
    'BLUE_BITS',
    'DEPTH_BITS',
    'GREEN_BITS',
    'MAX_COMBINED_TEXTURE_IMAGE_UNITS',
    'MAX_CUBE_MAP_TEXTURE_SIZE',
    'MAX_FRAGMENT_UNIFORM_VECTORS',
    'MAX_RENDERBUFFER_SIZE',
    'MAX_TEXTURE_IMAGE_UNITS',
    'MAX_TEXTURE_SIZE',
    'MAX_VARYING_VECTORS',
    'MAX_VERTEX_ATTRIBS',
    'MAX_VERTEX_TEXTURE_IMAGE_UNITS',
    'MAX_VERTEX_UNIFORM_VECTORS',
    'MAX_VIEWPORT_DIMS',
    'NUM_COMPRESSED_TEXTURE_FORMATS',
    'RED_BITS',
    'RENDERER',
    'SAMPLE_BUFFERS',
    'SAMPLES',
    'SHADING_LANGUAGE_VERSION',
    'STENCIL_BITS',
    'SUBPIXEL_BITS',
    'VENDOR',
    'VERSION'
  ];

  goog.array.forEach(stateParameters, function(name) {
    try {
      var value = gl.getParameter(gl[name]);
      if (gli.util.isTypedArray(value)) {
        value = gli.util.typedArrayToArray(value);
      }
      this.parameters[name] = value;
    } catch (e) {
      // Ignored
    }
  }, this);

  this.extensions = gl.getSupportedExtensions();
  this.enabledExtensions = opt_enabledExtensions || [];
};


/**
 * Serialize the session information blob.
 * @return {Object} JSON serialized version of the information.
 */
gli.data.SessionInfo.prototype.serialize = function() {
  return JSON.stringify(this);
};
