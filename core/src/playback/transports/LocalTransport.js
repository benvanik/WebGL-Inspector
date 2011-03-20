(function () {
    var transports = glinamespace("gli.playback.transports");
    
    var LocalTransport = function LocalTransport(sourceTransport) {
        var options = {
            streaming: true
        };
        glisubclass(gli.playback.transports.Transport, this, [options]);

        this.sourceTransport = sourceTransport;

        var sourceEvents = sourceTransport.events;
        var targetEvents = this.events;
        for (var name in sourceEvents) {
            sourceEvents[name].addListener(targetEvents[name], targetEvents[name].fire);
        }
    };
    
    transports.LocalTransport = LocalTransport;
    
})();
