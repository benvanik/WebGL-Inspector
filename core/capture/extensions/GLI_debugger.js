(function () {
    var extensions = glinamespace("gli.capture.extensions");
    
    var GLI_debugger = function GLI_debugger(impl) {
        this.name = "GLI_debugger";
        this.impl = impl;
        this.gl = impl.context;
    };
    
    GLI_debugger.prototype.ignoreErrors = function ignoreErrors() {
        var gl = this.gl;
        while (gl.getError() != gl.NO_ERROR);
    };
    
    GLI_debugger.prototype.requestCapture = function requestCapture(callback) {
        var request = {
            callback: callback
        };
        this.impl.queueCaptureRequest(request);
    };
    
    GLI_debugger.prototype.frameTerminator = function frameTerminator() {
        gli.util.frameTerminator.fire();
    };
    
    GLI_debugger.prototype.setResourceName = function setResourceName(resource, name) {
        if (!resource) {
            return;
        }
        resource.tracked.setName(name);
        this.impl.resourceCache.handleResourceUpdated(resource);
    };
    
    extensions.GLI_debugger = GLI_debugger;

})();
