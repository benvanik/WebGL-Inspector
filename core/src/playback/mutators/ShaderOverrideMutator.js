(function () {
    var mutators = glinamespace("gli.playback.mutators");
    
    var ShaderOverrideMutator = function ShaderOverrideMutator(shaderType, shaderSource) {
        this.super.call(this, "ShaderOverrideMutator");
        
        this.shaderType = shaderType;
        this.shaderSource = shaderSource;
        
        this.addResourceHandler("Program", null, null, null);
        this.addResourceHandler("Shader", null, null, this.preCall);
        this.addCallHandler(this.preCall, null/*this.postCall*/);
    };
    glisubclass(gli.playback.mutators.Mutator, ShaderOverrideMutator);
    
    ShaderOverrideMutator.prototype.preCall = function shaderOverride_preCall(pool, call) {
        var gl = pool.gl;
        switch (call.name) {
            case "shaderSource":
                // Rewrite all fragment shaders with the depth shader
                if (call.args[0].shaderType === gl[this.shaderType]) {
                    var clone = call.clone();
                    clone.args[1] = this.shaderSource;
                    return clone;
                }
                break;
        }
        return call;
    };
    
    ShaderOverrideMutator.prototype.postCall = function shaderOverride_postCall(pool, call) {
        var gl = pool.gl;
        switch (call.name) {
        }
    };
    
    mutators.ShaderOverrideMutator = ShaderOverrideMutator;
    
})();
