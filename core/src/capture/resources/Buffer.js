(function () {
    var resources = glinamespace("gli.capture.data.resources");
    
    var Buffer = function Buffer(resourceCache, rawArgs, target, stack) {
        glisubclass(resources.Resource, this, [resourceCache, rawArgs, target, stack, "Buffer"]);
    };
    
    Buffer.getTracked = function getTracked(gl, args) {
        var bindingEnum;
        switch (args[0]) {
            case gl.ARRAY_BUFFER:
                bindingEnum = gl.ARRAY_BUFFER_BINDING;
                break;
            case gl.ELEMENT_ARRAY_BUFFER:
                bindingEnum = gl.ELEMENT_ARRAY_BUFFER_BINDING;
                break;
            default:
                console.log("Unknown buffer binding type");
                break;
        }
        var target = gl.getParameter(bindingEnum);
        if (target) {
            return target.tracked;
        } else {
            return null;
        }
    };
    
    Buffer.setupCaptures = function setupCaptures(impl) {
        var methods = impl.methods;
        var buildRecorder = resources.Resource.buildRecorder;
        
        var resetCalls = [
            "bufferData",
            "bufferSubData"
        ];
        
        buildRecorder(impl, "bufferData", Buffer.getTracked, resetCalls);
        buildRecorder(impl, "bufferSubData", Buffer.getTracked, null);
    };
    
    resources.Buffer = Buffer;
    
})();
