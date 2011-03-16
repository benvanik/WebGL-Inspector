(function () {
    var util = glinamespace("gli.util");
    
    var requestAnimationFrameNames = [
        "requestAnimationFrame",
        "webkitRequestAnimationFrame",
        "mozRequestAnimationFrame",
        "operaRequestAnimationFrame",
        "msAnimationFrame"
    ];
    
    var TimerController = function TimerController() {
        var self = this;
        
        this.frameTerminator = new gli.util.EventSource("frameTerminator");
        
        // 0 = normal
        // N = ms between frames
        // Infinity = stopped
        this.value = 0;
        
        this.activeIntervals = [];
        this.activeTimeouts = [];
        
        // All browser original methods (may be munged by app already?)
        var originals = this.originals = {
            setInterval: window.setInterval,
            clearInterval: window.clearInterval,
            setTimeout: window.setTimeout,
            clearTimeout: window.clearTimeout,
            postMessage: window.postMessage
        };
        for (var n = 0; n < requestAnimationFrameNames.length; n++) {
            var name = requestAnimationFrameNames[n];
            if (window[name]) {
                originals[name] = window[name];
            }
        }
        
        // Our hijacked versions
        var hijacked = this.hijacked = {};
        
        // Shared wrapper code for user callback routine (calls our event)
        var wrapCode = function wrapCode(code, args) {
            args = Array.prototype.slice.call(args, 2);
            return function () {
                if (code) {
                    if (glitypename(code) == "String") {
                        eval(code);
                    } else {
                        code.apply(window, args);
                    }
                }
                self.frameTerminator.fire();
            };
        };
        
        // setInterval/clearInterval
        hijacked.setInterval = function hijacked_setInterval(code, delay) {
            var maxDelay = Math.max(delay, self.value);
            if (!isFinite(maxDelay)) {
                maxDelay = 999999999;
            }
            var wrappedCode = wrapCode(code, arguments);
            var intervalId = originals.setInterval.apply(window, [wrappedCode, maxDelay]);
            self.activeIntervals.push({
                id: intervalId,
                code: code,
                delay: delay
            });
        };
        hijacked.clearInterval = function hijacked_clearInterval(id) {
            for (var n = 0; n < self.activeIntervals.length; n++) {
                if (self.activeIntervals[n].id == id) {
                    self.activeIntervals.splice(n, 1);
                    break;
                }
            }
            return originals.clearInterval.apply(window, arguments);
        };
        
        // setTimeout/clearTimeout
        hijacked.setTimeout = function hijacked_setTimeout(code, delay) {
            var maxDelay = Math.max(delay, self.value);
            if (!isFinite(maxDelay)) {
                maxDelay = 999999999;
            }
            var wrappedCode = wrapCode(code, arguments);
            var cleanupCode = function () {
                // Need to remove from the active timeout list
                hijacked.clearTimeout(timeoutId);
                wrappedCode();
            };
            var timeoutId = originals.setTimeout.apply(window, [cleanupCode, maxDelay]);
            self.activeTimeouts.push({
                id: timeoutId,
                code: code,
                delay: delay
            });
        };
        hijacked.clearTimeout = function hijacked_clearTimeout(id) {
            for (var n = 0; n < self.activeTimeouts.length; n++) {
                if (self.activeTimeouts[n].id == id) {
                    self.activeTimeouts.splice(n, 1);
                    break;
                }
            }
            return originals.clearTimeout.apply(window, arguments);
        };
        
        // postMessage/onmessage
        hijacked.postMessage = function hijacked_postMessage(message) {
            var args = arguments;
            if (self.value !== 0) {
                // Delaying - convert to a setTimeout
                // NOTE: we use the hijacked timeout - this will create a spurious
                // frame terminator, but will allow for the control logic to work
                // (we really only care about the onmessage logic)
                hijacked.setTimeout(function () {
                    originals.postMessage.apply(window, args);
                }, 0);
            } else {
                // No delay
                return originals.postMessage.apply(window, arguments);
            }
        };
        window.addEventListener("message", function hijacked_onmessage() {
            self.frameTerminator.fire();
        }, false);
        
        // requestAnimationFrame
        function hijackRequestAnimationFrame(name) {
            // Works by keeping the time of the last real execute we did and if under
            // the desired value issuing a hijacked setTimeout instead. Whenever
            // the regular control would allow it to go it'll go and be no different,
            // except the app loses the browser per-element call limiting.
            var lastFrameTime = new Date();
            hijacked[name] = function hijacked_requestAnimationFrame(code, element) {
                var time = new Date();
                var delta = (time - lastFrameTime);
                var wrappedCode = wrapCode(code);
                if ((self.value === 0) || (delta > self.value)) {
                    lastFrameTime = time;
                    return originals[name].call(window, wrappedCode, element);
                } else {
                    hijacked.setTimeout(code, delta);
                }
            };
        };
        for (var n = 0; n < requestAnimationFrameNames.length; n++) {
            var name = requestAnimationFrameNames[n];
            if (window[name]) {
                hijackRequestAnimationFrame(name);
            }
        }
    };
    
    TimerController.prototype.setValue = function setValue(value) {
        if (this.value === value) {
            return;
        }
        
        this.value = value;
        
        // Reset all intervals
        var oldIntervals = this.activeIntervals;
        this.activeIntervals = [];
        for (var n = 0; n < oldIntervals.length; n++) {
            var interval = oldIntervals[n];
            this.originals.clearInterval(interval.id);
            this.hijacked.setInterval(interval.code, interval.delay);
        }
        
        // Reset all timeouts
        var oldTimeouts = this.activeTimeouts;
        this.activeTimeouts = [];
        for (var n = 0; n < oldTimeouts.length; n++) {
            var timeout = oldTimeouts[n];
            this.originals.clearTimeout(timeout.id);
            this.hijacked.setTimeout(timeout.code, timeout.delay);
        }
    };
    
    // Singleton
    util.timerController = new TimerController();
    
    // Helper method
    util.setTimerControlValue = function setTimerControlValue(value) {
        return util.timerController.setValue(value);
    };
    
    // Expose event
    util.frameTerminator = util.timerController.frameTerminator;
    
    // Expose original timing routines
    for (var name in util.timerController.originals) {
        util[name] = util.timerController.originals[name];
    }
    
})();
