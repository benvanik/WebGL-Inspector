(function () {
    var transports = glinamespace("gli.playback.transports");
    
    var NetworkTransport = function NetworkTransport() {
        var options = {
            streaming: true
        };
        glisubclass(gli.playback.transports.Transport, this, [options]);

        //
    };
    
    transports.NetworkTransport = NetworkTransport;
    
})();
