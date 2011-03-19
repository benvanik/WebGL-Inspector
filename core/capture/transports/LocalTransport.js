(function () {
    var transports = glinamespace("gli.capture.transports");
    
    var LocalTransport = function LocalTransport() {
        var options = {
            streaming: true
        };
        glisubclass(gli.capture.transports.Transport, this, [options]);

        this.events = {
            appendResource: new gli.util.EventSource("appendResource"),
            appendResourceVersion: new gli.util.EventSource("appendResourceVersion"),
            appendResourceDeletion: new gli.util.EventSource("appendResourceDeletion"),
            appendCaptureFrame: new gli.util.EventSource("appendCaptureFrame"),
            appendTimingFrame: new gli.util.EventSource("appendTimingFrame")
        };
    };
    
    LocalTransport.prototype.isClosed = function isClosed() {
        return false;
    };
    
    LocalTransport.prototype.appendResource = function appendResource(resource) {
        this.events.appendResource.fire(resource);
    };
    
    LocalTransport.prototype.appendResourceVersion = function appendResourceVersion(resource, version) {
        this.events.appendResourceVersion.fire(resource, version);
    };
    
    LocalTransport.prototype.appendResourceDeletion = function appendResourceDeletion(resource) {
        this.events.appendResourceDeletion.fire(resource);
    };
    
    LocalTransport.prototype.appendCaptureFrame = function appendCaptureFrame(request, frame) {
        this.events.appendCaptureFrame.fire(request, frame);
    };
    
    LocalTransport.prototype.appendTimingFrame = function appendTimingFrame(request, frame) {
        this.events.appendTimingFrame.fire(request, frame);
    };
    
    transports.LocalTransport = LocalTransport;
    
})();
