// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.util.Interval');


/**
 * Native interval object, if available.
 * @private
 * @type {Object|undefined}
 */
gli.util.NATIVE_INTERVAL_ = window.chrome ? window.chrome.Interval : null;



/**
 * A high-precision timing interval (when possible), modeled off of
 * chrome.Interval.
 * When chrome.Interval is available it will be used instead.
 * @constructor
 */
gli.util.Interval = gli.util.NATIVE_INTERVAL_ ?
    gli.util.NATIVE_INTERVAL_ : function() {
  /**
   * Time when the interval was started.
   * @private
   * @type {number}
   */
  this.startTime_ = 0;

  /**
   * Time when the interval was stopped.
   * @private
   * @type {number}
   */
  this.stopTime_ = 0;
};


/**
 * Starts recording.
 */
gli.util.Interval.prototype.start = gli.util.NATIVE_INTERVAL_ ?
    gli.util.NATIVE_INTERVAL_.prototype.start : function() {
  this.stopTime_ = 0;
  this.startTime_ = goog.now();
};


/**
 * Stops recording.
 */
gli.util.Interval.prototype.stop = gli.util.NATIVE_INTERVAL_ ?
    gli.util.NATIVE_INTERVAL_.prototype.stop : function() {
  if (this.startTime_) {
    this.stopTime_ = goog.now();
  } else {
    this.stopTime_ = 0;
  }
};


/**
 * Returns the total number of microseconds elapsed in the interval.
 * @return {number} Total number of microseconds elapsed.
 */
gli.util.Interval.prototype.microseconds = gli.util.NATIVE_INTERVAL_ ?
    gli.util.NATIVE_INTERVAL_.prototype.microseconds : function() {
  if (this.startTime_) {
    var end = this.stopTime_ || goog.now();
    return (end - this.startTime_) * 1000.0;
  } else {
    return 0;
  }
};


/**
 * Returns the total number of milliseconds elapsed in the interval.
 * @return {number} Total number of milliseconds elapsed.
 */
gli.util.Interval.prototype.milliseconds = function() {
  return this.microseconds() / 1000.0;
};


/**
 * Returns the total number of seconds elapsed in the interval.
 * @return {number} Total number of seconds elapsed.
 */
gli.util.Interval.prototype.seconds = function() {
  return this.microseconds() / 1000000.0;
};

