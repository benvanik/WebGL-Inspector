(function () {
    var transports = glinamespace("gli.capture.transports");
    
    var DebugTransport = function DebugTransport() {
        var options = {
            streaming: true
        };
        glisubclass(gli.capture.transports.Transport, this, [options]);
    };
    
    DebugTransport.prototype.appendResource = function appendResource(resource) {
        console.log("append resource");
        console.log(resource);
    };
    
    DebugTransport.prototype.appendResourceVersion = function appendResourceVersion(resource, version) {
        console.log("append resource version");
        console.log(resource);
        console.log(version);
    };
    
    DebugTransport.prototype.appendResourceDeletion = function appendResourceDeletion(resource) {
        console.log("append resource deletion");
        console.log(resource);
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
