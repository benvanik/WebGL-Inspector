(function () {
    var resources = glinamespace("gli.capture.data.resources");
    
    var Renderbuffer = function Renderbuffer(resourceCache, rawArgs, target, stack) {
        glisubclass(resources.Resource, this, [resourceCache, rawArgs, target, stack, "Renderbuffer"]);
        this.creationOrder = 2;
    };
    
    Renderbuffer.getTracked = function getTracked(gl, args) {
        gl = gl.raw;
        // only RENDERBUFFER
        var bindingEnum = gl.RENDERBUFFER_BINDING;
        var target = gl.getParameter(bindingEnum);
        if (target) {
            return target.tracked;
        } else {
            return null;
        }
    };
    
    Renderbuffer.setupCaptures = function setupCaptures(impl) {
        var methods = impl.methods;
        var buildRecorder = resources.Resource.buildRecorder;
        
        buildRecorder(methods, "renderbufferStorage", Renderbuffer.getTracked, true);
    };
    
    resources.Renderbuffer = Renderbuffer;
    
})();
