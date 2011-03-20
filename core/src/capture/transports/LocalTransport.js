(function () {
    var transports = glinamespace("gli.capture.transports");
    
    var LocalTransport = function LocalTransport() {
        var options = {
            streaming: true
        };
        this.super.call(this, options);

        this.events = {
            appendSessionInfo: new gli.util.EventSource("appendSessionInfo"),
            appendResource: new gli.util.EventSource("appendResource"),
            appendResourceUpdate: new gli.util.EventSource("appendResourceUpdate"),
            appendResourceDeletion: new gli.util.EventSource("appendResourceDeletion"),
            appendResourceVersion: new gli.util.EventSource("appendResourceVersion"),
            appendCaptureFrame: new gli.util.EventSource("appendCaptureFrame"),
            appendTimingFrame: new gli.util.EventSource("appendTimingFrame")
        };
    };
    glisubclass(gli.capture.transports.Transport, LocalTransport);
    
    LocalTransport.prototype.isClosed = function isClosed() {
        return false;
    };

    LocalTransport.prototype.appendSessionInfo = function appendSessionInfo(sessionInfo) {
        this.events.appendSessionInfo.fire(sessionInfo);
    };
    
    LocalTransport.prototype.appendResource = function appendResource(resource) {
        this.events.appendResource.fire(resource);
    };

    LocalTransport.prototype.appendResourceUpdate = function appendResourceUpdate(resource) {
        this.events.appendResourceUpdate.fire(resource);
    };
    
    LocalTransport.prototype.appendResourceDeletion = function appendResourceDeletion(resourceId) {
        this.events.appendResourceDeletion.fire(resourceId);
    };
    
    LocalTransport.prototype.appendResourceVersion = function appendResourceVersion(resourceId, version) {
        this.events.appendResourceVersion.fire(resourceId, version);
    };
    
    LocalTransport.prototype.appendCaptureFrame = function appendCaptureFrame(request, frame) {
        this.events.appendCaptureFrame.fire(request, frame);
    };
    
    LocalTransport.prototype.appendTimingFrame = function appendTimingFrame(request, frame) {
        this.events.appendTimingFrame.fire(request, frame);
    };
    
    transports.LocalTransport = LocalTransport;
    
})();
