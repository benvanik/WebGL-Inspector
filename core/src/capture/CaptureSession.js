(function () {
    var capture = glinamespace("gli.capture");
    
    var CaptureSession = function CaptureSession(impl, transport) {
        this.impl = impl;
        this.transport = transport;
        
        transport.requestCapture.addListener(this, this.requestCapture);
    };
    
    CaptureSession.prototype.requestCapture = function requestCapture(request) {
        this.impl.queueCaptureRequest(request);
        return true;
    };
    
    CaptureSession.prototype.appendResource = function appendResource(resource) {
        this.transport.appendResource(resource);
    };
    
    CaptureSession.prototype.appendResourceVersion = function appendResourceVersion(resource, version) {
        this.transport.appendResourceVersion(resource, version);
    };
    
    CaptureSession.prototype.appendResourceDeletion = function appendResourceDeletion(resource) {
        this.transport.appendResourceDeletion(resource);
    };
    
    CaptureSession.prototype.appendCaptureFrame = function appendCaptureFrame(request, frame) {
        this.transport.appendCaptureFrame(request, frame);
    };
    
    CaptureSession.prototype.appendTimingFrame = function appendTimingFrame(request, frame) {
        this.transport.appendTimingFrame(request, frame);
    };
    
    capture.CaptureSession = CaptureSession;
    
})();
