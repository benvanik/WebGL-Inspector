(function () {
    var util = glinamespace("util");

    var EventSource = function EventSource(name) {
        this.name = name;
        this.listeners = [];
    };

    EventSource.prototype.addListener = function addListener(target, callback) {
        this.listeners.push({
            target: target,
            callback: callback
        });
    };

    EventSource.prototype.removeListener = function removeListener(target, callback) {
        for (var n = 0; n < this.listeners.length; n++) {
            var listener = this.listeners[n];
            if (listener.target === target) {
                if (callback) {
                    if (listener.callback === callback) {
                        this.listeners.splice(n, 1);
                        break;
                    }
                } else {
                    this.listeners.splice(n, 1);
                }
            }
        }
    };

    EventSource.prototype.fire = function fire() {
        for (var n = 0; n < this.listeners.length; n++) {
            var listener = this.listeners[n];
            //try {
                listener.callback.apply(listener.target, arguments);
            //} catch (e) {
            //    console.log("exception thrown in target of event " + this.name + ": " + e);
            //}
        }
    };

    EventSource.prototype.fireDeferred = function fireDeferred() {
        var self = this;
        var args = arguments;
        (gli.util.setTimeout || window.setTimeout)(function fireDeferred() {
            self.fire.apply(self, args);
        }, 0);
    };

    util.EventSource = EventSource;

})();
