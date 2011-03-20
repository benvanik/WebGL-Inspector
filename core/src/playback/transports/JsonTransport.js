(function () {
    var transports = glinamespace("gli.playback.transports");
    
    var JsonTransport = function JsonTransport(sourceJson) {
        var options = {
            streaming: false
        };
        this.super.call(this, options);

        this.sourceJson = sourceJson;

        this.ready.addListener(this, this.replayAll);
    };
    glisubclass(gli.playback.transports.Transport, JsonTransport);

    JsonTransport.prototype.replayAll = function replayAll() {
        var events = this.events;
        var json = this.sourceJson;

        events.appendSessionInfo.fire(json.sessionInfo);

        for (var id in json.resources) {
            var resource = json.resources[id];
            events.appendResource.fire(resource);
        }

        for (var id in json.resourceVersions) {
            var versions = json.resourceVersions[id];
            for (var versionNumber in versions) {
                var version = versions[versionNumber];
                events.appendResourceVersion.fire(id, version);
            }
        }

        for (var n = 0; n < json.captureFrames.length; n++) {
            var frame = json.captureFrames[n];
            events.appendCaptureFrame.fire(frame.request, frame);
        }

        for (var n = 0; n < json.timingFrames.length; n++) {
            var frame = json.timingFrames[n];
            events.appendTimingFrame.fire(frame.request, frame);
        }

        this.fireClosed();
    };
    
    transports.JsonTransport = JsonTransport;
    
})();
