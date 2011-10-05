// Copyright 2011 Ben Vanik. All Rights Reserved.

/**
 * @author ben.vanik@gmail.com (Ben Vanik)
 */

goog.provide('gli.util.TimerController');

goog.require('goog.array');
goog.require('goog.events.EventTarget');



/**
 * Hijacks various timing methods to allow for time dilation, stoppage,
 * and events.
 *
 * @constructor
 * @extends {goog.events.EventTarget}
 */
gli.util.TimerController = function() {
  goog.base(this);

  /**
   * Timer mode.
   * @private
   * @type {gli.util.TimerController.Mode}
   */
  this.mode_ = gli.util.TimerController.Mode.NORMAL;

  /**
   * Timer scaling value, for SCALED mode.
   * @private
   * @type {number}
   */
  this.scalar_ = 1;

  /**
   * Original methods from window.
   * @private
   * @type {!Object.<!Function>}
   */
  this.originalMethods_ = {
    'setTimeout': window.setTimeout,
    'clearTimeout': window.clearTimeout,
    'setInterval': window.setInterval,
    'clearInterval': window.clearInterval,
    'postMessage': window.postMessage
  };
  goog.array.forEach(gli.util.TimerController.requestAnimationFrameNames_,
      /**
       * @param {string} name Function name.
       */
      function(name) {
        if (window[name]) {
          this.originalMethods_[name] = window[name];
        }
      }, this);

  /**
   * All active timers, mapped by timerId.
   * @private
   * @type {!Object.<!gli.util.TimerController.Timer_>}
   */
  this.activeTimers_ = {};

  this.setupHijacking_();
};
goog.inherits(gli.util.TimerController, goog.events.EventTarget);


/**
 * Names of all the requestAnimationFrame variants.
 * @private
 * @const
 * @type {!Array.<string>}
 */
gli.util.TimerController.requestAnimationFrameNames_ = [
  'requestAnimationFrame',
  'webkitRequestAnimationFrame',
  'mozRequestAnimationFrame',
  'operaRequestAnimationFrame',
  'msAnimationFrame'
];


/**
 * A really big value, used because infinite isn't valid in many places.
 * @const
 * @private
 * @type {number}
 */
gli.util.TimerController.INFINITISH_ = 999999999;


/**
 * Timer controller event types.
 * @enum
 * @type {string}
 */
gli.util.TimerController.EventType = {
  /**
   * Fires both before and after a timer executes user code.
   */
  TIMER_BOUNDARY: goog.events.getUniqueId('timer_boundary')
};


/**
 * Timer controller mode.
 * @enum
 * @type {number}
 */
gli.util.TimerController.Mode = {
  /**
   * Timers run as normal.
   */
  NORMAL: 0,
  /**
   * All timing values are scaled by a value (such as 100ms * 2 = 200ms).
   */
  SCALED: 1,
  /**
   * Timers are all stopped.
   */
  STOPPED: 2
};


/**
 * Timer type.
 * @enum
 * @private
 * @type {number}
 */
gli.util.TimerController.TimerType_ = {
  /** setTimeout */
  TIMEOUT: 0,
  /** setInterval */
  INTERVAL: 1,
  /** requestAnimationFrame */
  REQUESTANIMATIONFRAME: 2
};



/**
 * Hijacked timer entry.
 * @constructor
 * @private
 * @param {gli.util.TimerController.TimerType_} type Timer type.
 * @param {!Function} code User code to run.
 * @param {!Function} wrappedCode User code wrapped for hijacking.
 * @param {number} delay Delay, in ms.
 * @param {Array} userArgs User arguments, if any.
 */
gli.util.TimerController.Timer_ = function(
    type, code, wrappedCode, delay, userArgs) {
  /**
   * Timer type.
   * @type {gli.util.TimerController.TimerType_}
   */
  this.type = type;

  /**
   * User code to run.
   * @type {!Function}
   */
  this.code = code;

  /**
   * User code wrapped for hijacking.
   * @type {!Function}
   */
  this.wrappedCode = wrappedCode;

  /**
   * Requested delay, in ms.
   * @type {number}
   */
  this.delay = delay;

  /**
   * User arguments, if any.
   * @type {Array}
   */
  this.userArgs = userArgs;

  /**
   * Timer ID.
   * @type {*}
   */
  this.timerId = null;
};


/**
 * Sets up timer hijacking routines.
 * @private
 */
gli.util.TimerController.prototype.setupHijacking_ = function() {
  function sliceArgs(args) {
    var result = new Array(args.length - 2);
    for (var n = 2; n < args.length; n++) {
      result[n - 2] = args[n];
    }
    return result;
  };

  var original_setTimeout = this.originalMethods_['setTimeout'];
  function hijacked_setTimeout(code, delay) {
    if (!code) {
      return;
    }

    var userArgs = sliceArgs(arguments);
    var wrappedCode = goog.bind(function() {
      goog.object.remove(this.activeTimers_, timer.timerId);
      this.timerBoundary_();
      try {
        if (goog.isString(code)) {
          window.eval(code);
        } else {
          code.apply(window, userArgs);
        }
      } finally {
        this.timerBoundary_();
      }
    }, this);

    var timer = new gli.util.TimerController.Timer_(
        gli.util.TimerController.TimerType_.TIMEOUT,
        code, wrappedCode, delay, userArgs);

    var adjustedDelay = this.adjustDelay_(delay);
    var args = [wrappedCode, adjustedDelay];
    goog.array.extend(args, userArgs);
    var timerId = original_setTimeout.apply(window, args);

    timer.timerId = timerId;
    this.activeTimers_[timer.timerId] = timer;
  };
  window['setTimeout'] = goog.bind(hijacked_setTimeout, this);

  var original_clearTimeout = this.originalMethods_['clearTimeout'];
  function hijacked_clearTimeout(timerId) {
    goog.object.remove(this.activeTimers_, timerId);
    return original_clearTimeout.apply(window, arguments);
  };
  window['clearTimeout'] = goog.bind(hijacked_clearTimeout, this);

  var original_setInterval = this.originalMethods_['setInterval'];
  function hijacked_setInterval(code, delay) {
    if (!code) {
      return;
    }

    var userArgs = sliceArgs(arguments);
    var wrappedCode = goog.bind(function() {
      this.timerBoundary_();
      try {
        if (goog.isString(code)) {
          window.eval(code);
        } else {
          code.apply(window, userArgs);
        }
      } finally {
        this.timerBoundary_();
      }
    }, this);

    var timer = new gli.util.TimerController.Timer_(
        gli.util.TimerController.TimerType_.INTERVAL,
        code, wrappedCode, delay, userArgs);

    var adjustedDelay = this.adjustDelay_(delay);
    var args = [wrappedCode, adjustedDelay];
    goog.array.extend(args, userArgs);
    var timerId = original_setInterval.apply(window, args);

    timer.timerId = timerId;
    this.activeTimers_[timer.timerId] = timer;
  };
  window['setInterval'] = goog.bind(hijacked_setInterval, this);

  var original_clearInterval = this.originalMethods_['clearInterval'];
  function hijacked_clearInterval(timerId) {
    goog.object.remove(this.activeTimers_, timerId);
    return original_clearInterval.apply(window, arguments);
  };
  window['clearInterval'] = goog.bind(hijacked_clearInterval, this);

  var original_postMessage = this.originalMethods_['postMessage'];
  function hijacked_postMessage() {
    if (this.mode_ != gli.util.TimerController.Mode.NORMAL) {
      // Delaying - convert to a setTimeout wrapper
      var args = arguments;
      hijacked_setTimeout.apply(this, function() {
        original_postMessage.apply(window, args);
      }, 0);
    } else {
      // No delay
      return original_postMessage.apply(window, arguments);
    }
  };
  window['postMessage'] = goog.bind(hijacked_postMessage, this);

  // May be needed in case external code calls postMessage
  window.addEventListener('message', goog.bind(function() {
    this.timerBoundary_();
  }, this), false);

  // TODO(benvanik): requestAnimationFrame
};


/**
 * Adjusts the given delay value based on the current mode/scalar.
 * @private
 * @param {number} delay User delay value, in ms.
 * @return {number} Adjust delay value, in ms.
 */
gli.util.TimerController.prototype.adjustDelay_ = function(delay) {
  if (!isFinite(delay)) {
    delay = gli.util.TimerController.INFINITISH_;
  }
  switch (this.mode_) {
    case gli.util.TimerController.Mode.NORMAL:
      return delay;
    case gli.util.TimerController.Mode.SCALED:
      return delay + this.scalar_;
    case gli.util.TimerController.Mode.STOPPED:
      // TODO(benvanik): something bigger? truely stopped?
      return gli.util.TimerController.INFINITISH_;
  }
};


/**
 * Called both before and after a timer executes user code.
 * @private
 */
gli.util.TimerController.prototype.timerBoundary_ = function() {
  this.dispatchEvent({
    type: gli.util.TimerController.EventType.TIMER_BOUNDARY
  });
};


/**
 * Resumes all timers in normal mode.
 */
gli.util.TimerController.prototype.resumeTimers = function() {
  switch (this.mode_) {
    case gli.util.TimerController.Mode.NORMAL:
      // Ignored
      break;
    case gli.util.TimerController.Mode.SCALED:
      break;
    case gli.util.TimerController.Mode.STOPPED:
      break;
  }
};


/**
 * Scales all timers by the given scalar.
 * @param {number} scalar Multiplier for all time values.
 */
gli.util.TimerController.prototype.scaleTimers = function(scalar) {
  switch (this.mode_) {
    case gli.util.TimerController.Mode.NORMAL:
      break;
    case gli.util.TimerController.Mode.SCALED:
      break;
    case gli.util.TimerController.Mode.STOPPED:
      break;
  }
};


/**
 * Stops all timers, until one of the other modes is activated.
 */
gli.util.TimerController.prototype.stopTimers = function() {
  switch (this.mode_) {
    case gli.util.TimerController.Mode.NORMAL:
      break;
    case gli.util.TimerController.Mode.SCALED:
      break;
    case gli.util.TimerController.Mode.STOPPED:
      // Ignored
      break;
  }
};
