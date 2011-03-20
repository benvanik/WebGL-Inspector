(function () {
    var playback = glinamespace("gli.playback");

    var PlaybackSession = function PlaybackSession(host, transport) {
        this.host = host;
        this.transport = transport;
        this.isClosed = false;
        this.info = {
            name: "Unknown Session"
        };

        this.bindTransport(this.transport);

        this.transport.closed.addListener(this, function () {
            this.isClosed = true;
            this.host.sessionUpdated.fire(this);
        });
    };

    PlaybackSession.prototype.bindTransport = function bindTransport(transport) {
        transport.events.appendSessionInfo.addListener(this, function (sessionInfo) {
            console.log("appendSessionInfo");
            this.info = gli.util.shallowClone(sessionInfo);
            this.host.sessionUpdated.fire(this);
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
