(function () {
    var transports = glinamespace("gli.playback.transports");
    
    var Transport = function Transport(options) {
        this.options = options;

        this.ready = new gli.util.EventSource("ready");
        this.closed = new gli.util.EventSource("closed");

        this.events = {
            appendSessionInfo: new gli.util.EventSource("appendSessionInfo"),
            appendResource: new gli.util.EventSource("appendResource"),
            appendResourceUpdate: new gli.util.EventSource("appendResourceUpdate"),
            appendResourceDeletion: new gli.util.EventSource("appendResourceDeletion"),
            appendResourceVersion: new gli.util.EventSource("appendResourceVersion"),
            appendCaptureFrame: new gli.util.EventSource("appendCaptureFrame"),
            appendTimingFrame: new gli.util.EventSource("appendTimingFrame")
        };
    };
    
    Transport.prototype.fireReady = function fireReady() {
        if (this.preReady) {
            this.preReady();
        }
        this.ready.fireDeferred();
    };

    Transport.prototype.fireClosed = function fireClosed() {
        this.closed.fire(this);
    };
    
    transports.Transport = Transport;
    
})();
