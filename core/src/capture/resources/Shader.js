(function () {
    var resources = glinamespace("gli.capture.data.resources");
    
    var Shader = function Shader(resourceCache, rawArgs, target, stack) {
        this.super.call(this, resourceCache, rawArgs, target, stack, "Shader");
        
        // VERTEX_SHADER / FRAGMENT_SHADER
        this.shaderType = rawArgs[0];
    };
    glisubclass(gli.capture.data.resources.Resource, Shader);

    Shader.setupCaptures = function setupCaptures(impl) {
        var methods = impl.methods;
        var buildRecorder = resources.Resource.buildRecorder;
        
        var resetCalls = [
            "shaderSource",
            "compileShader"
        ];
        
        buildRecorder(impl, "shaderSource", null, resetCalls);
        buildRecorder(impl, "compileShader", null, null);
    };
    
    resources.Shader = Shader;
    
})();
