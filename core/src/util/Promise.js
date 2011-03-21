(function () {
    var util = glinamespace("gli.util");

    // Promise(bool alreadySignalled)
    // Promise(Promise[] promises)
    var Promise = function Promise() {
        this.listeners = [];
        this.resultArgs = null;
        
        if (arguments[0] === true) {
            this.resultArgs = [];
        } else if (glitypename(arguments[0]) === "Array") {
            Promise.waitAll(arguments[0], this, function waitAllCtor() {
                this.signal();
            });
        }
    };
    
    Promise.prototype.signal = function signal() {
        this.resultArgs = arguments;
        var listeners = this.listeners;
        this.listeners = [];
        
        for (var n = 0; n < listeners.length; n++) {
            var listener = listeners[n];
            //try {
                listener.callback.apply(listener.target, arguments);
            //} catch (e) {
            //    console.log("exception thrown in target of event " + this.name + ": " + e);
            //}
        }
    };

    Promise.prototype.wait = function wait(target, callback) {
        if (this.resultArgs) {
            (gli.util.setTimeout || window.setTimeout)(function waitImmediate() {
                callback.apply(target, this.resultArgs);
            }, 0);
        } else {
            this.listeners.push({
                target: target,
                callback: callback
            });
        }
    };
    
    Promise.waitAll = function waitAll(promises, target, callback) {
        if (promises.length == 0) {
            (gli.util.setTimeout || window.setTimeout)(function waitAllImmediate() {
                callback.apply(target);
            }, 0);
            return;
        }
        
        var waitCount = promises.length;
        var waitOneSuccess = function waitOneSuccess() {
            waitCount--;
            if (waitCount == 0) {
                callback.call(target);
            }
        };
        
        for (var n = 0; n < promises.length; n++) {
            var promise = promises[n];
            promise.wait(Promise, waitOneSuccess);
        }
    };
    
    Promise.signalledPromise = new Promise(true);

    util.Promise = Promise;

})();
