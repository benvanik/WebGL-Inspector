(function () {
    var playback = glinamespace("gli.playback");

    var PlaybackSession = function PlaybackSession(host, transport) {
        this.host = host;
        this.transport = transport;
        this.isClosed = false;
        this.info = {
            name: "Unknown Session"
        };

        this.storage = {
            captureFrames: [],
            timingFrames: []
        };

        this.captureFrameAdded = new gli.util.EventSource("captureFrameAdded");
        this.timingFrameAdded = new gli.util.EventSource("timingFrameAdded");

        this.bindTransport(this.transport);

        this.transport.closed.addListener(this, function () {
            this.isClosed = true;
            this.host.sessionUpdated.fire(this);
        });
    };

    PlaybackSession.prototype.bindTransport = function bindTransport(transport) {
        transport.events.appendSessionInfo.addListener(this, function (sessionInfo) {
            this.info = gli.util.shallowClone(sessionInfo);
            this.host.sessionUpdated.fire(this);
        });
        
        transport.events.appendResource.addListener(this, function (resource) {
            console.log("appendResource");
        });
        
        transport.events.appendResourceUpdate.addListener(this, function (resource) {
            console.log("appendResourceUpdate");
        });
        
        transport.events.appendResourceDeletion.addListener(this, function (resourceId) {
            console.log("appendResourceDeletion");
        });
        
        transport.events.appendResourceVersion.addListener(this, function (resourceId, version) {
            console.log("appendResourceVersion");
        });
        
        transport.events.appendCaptureFrame.addListener(this, function (request, sourceFrame) {
            var frame = new gli.playback.data.CaptureFrame(this, request, sourceFrame);
            this.storage.captureFrames.push(frame);
            this.captureFrameAdded.fire(frame);
        });

        transport.events.appendTimingFrame.addListener(this, function (request, sourceFrame) {
            var frame = new gli.playback.data.TimingFrame(this, request, sourceFrame);
            this.storage.timingFrames.push(frame);
            this.timingFrameAdded.fire(frame);
        });
    };

    playback.PlaybackSession = PlaybackSession;

})();
