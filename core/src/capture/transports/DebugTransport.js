(function () {
    var transports = glinamespace("gli.capture.transports");
    
    var DebugTransport = function DebugTransport() {
        var self = this;

        var options = {
            streaming: true
        };
        glisubclass(gli.capture.transports.Transport, this, [options]);

        gli.util.setTimeout(function () {
            self.fireReady();
        }, 0);
    };
    
    DebugTransport.prototype.isClosed = function isClosed() {
        return false;
    };

    DebugTransport.prototype.appendSessionInfo = function appendSessionInfo(sessionInfo) {
        console.log("append session info");
        console.log(sessionInfo);
    };
    
    DebugTransport.prototype.appendResource = function appendResource(resource) {
        console.log("append resource");
        console.log(resource);
    };

    DebugTransport.prototype.appendResourceUpdate = function appendResourceUpdate(resource) {
        console.log("append resource update");
        console.log(resource);
    };
    
    DebugTransport.prototype.appendResourceDeletion = function appendResourceDeletion(resourceId) {
        console.log("append resource deletion");
        console.log(resourceId);
    };
    
    DebugTransport.prototype.appendResourceVersion = function appendResourceVersion(resourceId, version) {
        console.log("append resource " + resourceId + " version");
        console.log(version);
    };
    
    DebugTransport.prototype.appendCaptureFrame = function appendCaptureFrame(request, frame) {
        console.log("append capture frame");
        console.log(frame);
    };
    
    DebugTransport.prototype.appendTimingFrame = function appendTimingFrame(request, frame) {
        console.log("append timing frame");
        console.log(frame);
    };
    
    transports.DebugTransport = DebugTransport;
    
})();
