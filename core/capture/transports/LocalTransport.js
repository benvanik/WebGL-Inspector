(function () {
    var transports = glinamespace("gli.capture.transports");
    
    var LocalTransport = function LocalTransport() {
        glisubclass(gli.capture.transports.Transport, this, []);
    };
    
    transports.LocalTransport = LocalTransport;
    
})();
