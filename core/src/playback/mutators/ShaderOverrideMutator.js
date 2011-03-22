(function () {
    var mutators = glinamespace("gli.playback.mutators");
    
    var ShaderOverrideMutator = function ShaderOverrideMutator(shaderType, shaderSource) {
        this.super.call(this, "ShaderOverrideMutator");
        
        this.shaderType = shaderType;
        this.shaderSource = shaderSource;
        
        this.addResourceHandler("Program", null, null);
        this.addResourceHandler("Shader", null, null);
        this.addCallHandlers(ShaderOverrideMutator.callHandlers);
    };
    glisubclass(gli.playback.mutators.Mutator, ShaderOverrideMutator);
    
    function shaderOverride_shaderSource(gl, pool, call) {
        // Rewrite all fragment shaders with the depth shader
        if (call.args[0].shaderType === gl[this.shaderType]) {
            var clone = call.clone();
            clone.args[1] = this.shaderSource;
            return clone;
        }
        return call;
    };
    
    ShaderOverrideMutator.callHandlers = {
        "shaderSource": {
            pre: shaderOverride_shaderSource
        }
    };
    
    mutators.ShaderOverrideMutator = ShaderOverrideMutator;
    
})();
