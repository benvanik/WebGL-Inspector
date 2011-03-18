(function () {
    var transports = glinamespace("gli.capture.transports");
    
    var DebugTransport = function DebugTransport() {
        glisubclass(gli.capture.transports.Transport, this, []);
    };
    
    transports.DebugTransport = DebugTransport;
    
})();
