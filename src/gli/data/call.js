// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.data.Call');

goog.require('gli.data');



/**
 * A single call in a frame.
 * @constructor
 * @param {Object=} opt_json Serialized JSON representation.
 */
gli.data.Call = function(opt_json) {
  /**
   * Call method name.
   * @type {string}
   */
  this.name = opt_json ? opt_json.name : undefined;
  // TODO(benvanik): make a numeric enum, where possible (reduce msg size)

  /**
   * Arguments array.
   * @type {!Array}
   */
  this.args = opt_json ? opt_json.args : [];

  /**
   * Result of the call, if any.
   * @type {*}
   */
  this.result = opt_json ? opt_json.result : undefined;

  /**
   * Error that this call signalled, if any.
   * @type {number|undefined}
   */
  this.error = opt_json ? opt_json.error : undefined;
};


goog.exportProperty(gli.data.Call.prototype, 'name',
    gli.data.Call.prototype.name);
goog.exportProperty(gli.data.Call.prototype, 'args',
    gli.data.Call.prototype.args);
goog.exportProperty(gli.data.Call.prototype, 'result',
    gli.data.Call.prototype.result);
goog.exportProperty(gli.data.Call.prototype, 'error',
    gli.data.Call.prototype.error);


/**
 * Initializes a call with the given arguments.
 * @param {string} name Call method name.
 * @param {!Array} rawArgs Raw call arguments.
 * @param {*} result Result of the call, if any.
 * @param {number|undefined} error Error that this call signalled, if any.
 */
gli.data.Call.prototype.init = function(name, rawArgs, result, error) {
  this.name = name;

  this.args.length = rawArgs.length;
  for (var n = 0; n < rawArgs.length; n++) {
    this.args[n] = gli.data.valueToJson(rawArgs[n]);
  }

  this.result = result ? gli.data.valueToJson(result) : result;
  this.error = error;
};
