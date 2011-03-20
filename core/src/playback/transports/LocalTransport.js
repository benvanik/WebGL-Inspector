(function () {
    var transports = glinamespace("gli.playback.transports");
    
    var LocalTransport = function LocalTransport(sourceTransport) {
        var options = {
            streaming: true
        };
        this.super.call(this, options);

        this.sourceTransport = sourceTransport;

        var sourceEvents = sourceTransport.events;
        var targetEvents = this.events;
        for (var name in sourceEvents) {
            sourceEvents[name].addListener(targetEvents[name], targetEvents[name].fire);
        }
    };
    glisubclass(gli.playback.transports.Transport, LocalTransport);
    
    transports.LocalTransport = LocalTransport;
    
})();
