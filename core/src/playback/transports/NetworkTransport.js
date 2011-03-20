(function () {
    var transports = glinamespace("gli.playback.transports");
    
    var NetworkTransport = function NetworkTransport() {
        var options = {
            streaming: true
        };
        this.super.call(this, options);
        
        //
    };
    glisubclass(gli.playback.transports.Transport, NetworkTransport);
    
    transports.NetworkTransport = NetworkTransport;
    
})();
