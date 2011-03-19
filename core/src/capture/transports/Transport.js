(function () {
    var transports = glinamespace("gli.capture.transports");
    
    var Transport = function Transport(options) {
        this.options = options;
        
        this.requestCapture = new gli.util.EventSource("requestCapture");
    };
    
    Transport.prototype.fireRequestCapture = function fireRequestCapture(options) {
        this.requestCapture.fire(options);
    };
    
    transports.Transport = Transport;
    
})();
