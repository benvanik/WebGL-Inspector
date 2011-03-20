(function () {
    var playback = glinamespace("gli.playback");

    var uniqueId = 0;

    var PlaybackSession = function PlaybackSession(host, transport) {
        this.host = host;
        this.transport = null;
        this.name = "Session " + (uniqueId++);

        this.bindTransport(transport);
    };

    PlaybackSession.prototype.bindTransport = function bindTransport(transport) {
        this.transport = transport;

        transport.events.appendSessionInfo.addListener(this, function (sessionInfo) {
            console.log("appendSessionInfo");
        });
        
        transport.events.appendResource.addListener(this, function (resource) {
            console.log("appendResource");
        });
        
        transport.events.appendResourceUpdate.addListener(this, function (resource) {
            console.log("appendResourceUpdate");
        });
        
        transport.events.appendResourceDeletion.addListener(this, function (resource) {
            console.log("appendResourceDeletion");
        });
        
        transport.events.appendResourceVersion.addListener(this, function (resource, version) {
            console.log("appendResourceVersion");
        });
        
        transport.events.appendCaptureFrame.addListener(this, function (request, frame) {
            console.log("appendCaptureFrame");
        });

        transport.events.appendTimingFrame.addListener(this, function (request, frame) {
            console.log("appendTimingFrame");
        });
    };

    playback.PlaybackSession = PlaybackSession;

})();
