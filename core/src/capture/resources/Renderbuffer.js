(function () {
    var resources = glinamespace("gli.capture.resources");
    
    var Renderbuffer = function Renderbuffer(resourceCache, rawArgs, target, stack) {
        this.super.call(this, resourceCache, rawArgs, target, stack, "Renderbuffer");
    };
    glisubclass(gli.capture.resources.Resource, Renderbuffer);
    
    Renderbuffer.getTracked = function getTracked(gl, args) {
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
        
        var resetCalls = [
            "renderbufferStorage"
        ];
        
        buildRecorder(impl, "renderbufferStorage", Renderbuffer.getTracked, resetCalls);
    };
    
    resources.Renderbuffer = Renderbuffer;
    
})();
