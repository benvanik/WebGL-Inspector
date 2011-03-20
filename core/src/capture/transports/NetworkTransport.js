(function () {
    var transports = glinamespace("gli.capture.transports");
    
    var NetworkTransport = function NetworkTransport() {
        var self = this;

        var options = {
            streaming: true
        };
        glisubclass(gli.capture.transports.Transport, this, [options]);

        gli.util.setTimeout(function () {
            self.fireReady();
        }, 0);
    };
    
    NetworkTransport.prototype.isClosed = function isClosed() {
        return false;
    };

    NetworkTransport.prototype.appendSessionInfo = function appendSessionInfo(sessionInfo) {
        console.log("append session info");
        console.log(sessionInfo);
    };
    
    NetworkTransport.prototype.appendResource = function appendResource(resource) {
        console.log("append resource");
        console.log(resource);
    };

    NetworkTransport.prototype.appendResourceUpdate = function appendResourceUpdate(resource) {
        console.log("append resource update");
        console.log(resource);
    };
    
    NetworkTransport.prototype.appendResourceDeletion = function appendResourceDeletion(resource) {
        console.log("append resource deletion");
        console.log(resource);
    };
    
    NetworkTransport.prototype.appendResourceVersion = function appendResourceVersion(resourceId, version) {
        console.log("append resource " + resourceId + " version");
        console.log(version);
    };
    
    NetworkTransport.prototype.appendCaptureFrame = function appendCaptureFrame(request, frame) {
        console.log("append capture frame");
        console.log(frame);
    };
    
    NetworkTransport.prototype.appendTimingFrame = function appendTimingFrame(request, frame) {
        console.log("append timing frame");
        console.log(frame);
    };
    
    transports.NetworkTransport = NetworkTransport;
    
})();
