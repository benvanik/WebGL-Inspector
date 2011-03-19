(function () {
    var playback = glinamespace("gli.playback");

    var PlaybackSession = function PlaybackSession() {
        this.transport = null;
    };

    PlaybackSession.prototype.loadSession = function loadSession(json) {
        
    };

    PlaybackSession.prototype.bindTransport = function bindTransport(transport) {
        this.transport = transport;
        
        this.events.appendResource.addListener(this, function (resource) {
            console.log("appendResource");
        });
        
        this.events.appendResourceVersion.addListener(this, function (resource, version) {
            console.log("appendResourceVersion");
        });
        
        this.events.appendResourceDeletion.addListener(this, function (resource) {
            console.log("appendResourceDeletion");
        });
        
        this.events.appendCaptureFrame.addListener(this, function (request, frame) {
            console.log("appendCaptureFrame");
        });

        this.events.appendTimingFrame.addListener(this, function (request, frame) {
            console.log("appendTimingFrame");
        });

    };

    playback.PlaybackSession = PlaybackSession;

})();
