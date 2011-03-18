(function () {
    var capture = glinamespace("gli.capture");
    
    var CaptureSession = function CaptureSession(impl, transport) {
        this.impl = impl;
        this.transport = transport;
        
        transport.requestCapture.addListener(this, this.requestCapture);
        
        /*
        // Determine all required resources and their required versions
        var requiredResources = {};
        for (var n = 0; n < frames.length; n++) {
            var frame = frames[n];
            for (var m = 0; m < frame.initialResources.length; m++) {
                var ref = frame.initialResources[m];
                var res = requiredResources[ref.id];
                if (!res) {
                    res = [];
                    requiredResources[ref.id] = res;
                }
                if (res.indexOf(ref.version) == -1) {
                    res.push(ref.version);
                }
            }
        }
        
        // Build resource table
        var resources = this.resources = {};
        for (var id in requiredResources) {
            var versions = requiredResources[id];
            var res = impl.resourceCache.getResourceById(id);
            resources.push(res);
        }
        */
    };
    
    CaptureSession.prototype.requestCapture = function requestCapture(options) {
        this.impl.queueCaptureRequest(function () {
            //
        });
    };
    
    CaptureSession.prototype.appendResourceVersion = function appendResource(resource, version) {
        console.log("append resource version");
    };
    
    CaptureSession.prototype.appendCaptureFrame = function appendCaptureFrame(frame) {
        console.log("append capture frame");
        frame.prepareForTransport();
        console.log(frame);
    };
    
    CaptureSession.prototype.appendTimingFrame = function appendTimingFrame(frame) {
        console.log("append timing frame");
        frame.prepareForTransport();
        console.log(frame);
    };
    
    capture.CaptureSession = CaptureSession;
    
})();
