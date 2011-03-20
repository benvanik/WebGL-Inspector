(function () {
    var capture = glinamespace("gli.capture");
    
    var CaptureSession = function CaptureSession(impl, transport) {
        this.impl = impl;
        this.transport = transport;
        
        transport.ready.addListener(this, function () {
            this.transport.appendSessionInfo({
                name: "Session X",
                time: (new Date())
            });
        });

        transport.requestCapture.addListener(this, this.requestCapture);
    };
    
    CaptureSession.prototype.requestCapture = function requestCapture(request) {
        this.impl.queueCaptureRequest(request);
        return true;
    };
    
    CaptureSession.prototype.appendResource = function appendResource(resource) {
        this.transport.appendResource(resource);
    };

    CaptureSession.prototype.appendResourceUpdate = function appendResourceUpdate(resource) {
        this.transport.appendResourceUpdate(resource);
    };
    
    CaptureSession.prototype.appendResourceDeletion = function appendResourceDeletion(resourceId) {
        this.transport.appendResourceDeletion(resourceId);
    };
    
    CaptureSession.prototype.appendResourceVersion = function appendResourceVersion(resourceId, version) {
        this.transport.appendResourceVersion(resourceId, version);
    };
    
    CaptureSession.prototype.appendCaptureFrame = function appendCaptureFrame(request, frame) {
        this.transport.appendCaptureFrame(request, frame);
    };
    
    CaptureSession.prototype.appendTimingFrame = function appendTimingFrame(request, frame) {
        this.transport.appendTimingFrame(request, frame);
    };
    
    capture.CaptureSession = CaptureSession;
    
})();
