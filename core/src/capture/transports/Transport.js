(function () {
    var transports = glinamespace("gli.capture.transports");
    
    var Transport = function Transport(options) {
        this.options = options;
        
        this.ready = new gli.util.EventSource("ready");
        this.closed = new gli.util.EventSource("closed");
        this.requestCapture = new gli.util.EventSource("requestCapture");
    };
    
    Transport.prototype.fireReady = function fireReady() {
        this.ready.fire();
    };

    Transport.prototype.fireRequestCapture = function fireRequestCapture(options) {
        this.requestCapture.fire(options);
    };
    
    transports.Transport = Transport;
    
})();
