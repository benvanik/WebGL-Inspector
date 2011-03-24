(function () {
    var capture = glinamespace("gli.capture");
    
    var CaptureSession = function CaptureSession(impl, transport) {
        this.impl = impl;
        this.transport = transport;
        
        transport.ready.addListener(this, function () {
            var sessionInfo = {
                name: "Session X",
                time: (new Date()),
                parameters: {}
            };
            
            var gl = this.impl.raw;
            
            var stateParameters = [
                "ALIASED_LINE_WIDTH_RANGE",
                "ALIASED_POINT_SIZE_RANGE",
                "ALPHA_BITS",
                "BLUE_BITS",
                "DEPTH_BITS",
                "GREEN_BITS",
                "MAX_COMBINED_TEXTURE_IMAGE_UNITS",
                "MAX_CUBE_MAP_TEXTURE_SIZE",
                "MAX_FRAGMENT_UNIFORM_VECTORS",
                "MAX_RENDERBUFFER_SIZE",
                "MAX_TEXTURE_IMAGE_UNITS",
                "MAX_TEXTURE_SIZE",
                "MAX_VARYING_VECTORS",
                "MAX_VERTEX_ATTRIBS",
                "MAX_VERTEX_TEXTURE_IMAGE_UNITS",
                "MAX_VERTEX_UNIFORM_VECTORS",
                "MAX_VIEWPORT_DIMS",
                "NUM_COMPRESSED_TEXTURE_FORMATS",
                "RED_BITS",
                "RENDERER",
                "SAMPLE_BUFFERS",
                "SAMPLES",
                "SHADING_LANGUAGE_VERSION",
                "STENCIL_BITS",
                "SUBPIXEL_BITS",
                "VENDOR",
                "VERSION",
            ];
            for (var n = 0; n < stateParameters.length; n++) {
                var pname = stateParameters[n];
                try {
                    var value = gl.getParameter(gl[pname]);
                    if (value && gli.util.isTypedArray(value)) {
                        value = gli.util.typedArrayToArray(value);
                    }
                    sessionInfo.parameters[pname] = value;
                } catch (e) {
                    // Ignored
                }
            }
            
            this.transport.appendSessionInfo(sessionInfo);
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
