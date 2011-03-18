(function () {
    var transports = glinamespace("gli.capture.transports");
    
    var LocalTransport = function LocalTransport() {
        var options = {
            streaming: true
        };
        glisubclass(gli.capture.transports.Transport, this, [options]);
    };
    
    LocalTransport.prototype.isClosed = function isClosed() {
        return false;
    };
    
    LocalTransport.prototype.appendResource = function appendResource(resource) {
        console.log("append resource");
    };
    
    LocalTransport.prototype.appendResourceVersion = function appendResourceVersion(resource, version) {
        console.log("append resource version");
    };
    
    LocalTransport.prototype.appendResourceDeletion = function appendResourceDeletion(resource) {
        console.log("append resource deletion");
    };
    
    LocalTransport.prototype.appendCaptureFrame = function appendCaptureFrame(request, frame) {
        console.log("append capture frame");
        console.log(frame);
    };
    
    LocalTransport.prototype.appendTimingFrame = function appendTimingFrame(request, frame) {
        console.log("append timing frame");
        console.log(frame);
    };
    
    transports.LocalTransport = LocalTransport;
    
})();
