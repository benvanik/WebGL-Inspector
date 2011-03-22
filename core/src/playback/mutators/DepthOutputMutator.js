(function () {
    var mutators = glinamespace("gli.playback.mutators");
    
    var DepthOutputMutator = function DepthOutputMutator() {
        this.super.call(this, "DepthOutputMutator");
        
        this.depthShader =
            "precision highp float;\n" +
            "vec4 packFloatToVec4i(const float value) {\n" +
            "   const vec4 bitSh = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);\n" +
            "   const vec4 bitMsk = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);\n" +
            "   vec4 res = fract(value * bitSh);\n" +
            "   res -= res.xxyz * bitMsk;\n" +
            "   return res;\n" +
            "}\n" +
            "void main() {\n" +
            "   gl_FragColor = packFloatToVec4i(gl_FragCoord.z);\n" +
            //"   gl_FragColor = vec4(gl_FragCoord.z, gl_FragCoord.z, gl_FragCoord.z, 1.0);\n" +
            "}\n";
        
        this.addResourceHandler("Shader", null, null, this.preCall);
        this.addCallHandler(this.preCall, null/*this.postCall*/);
    };
    glisubclass(gli.playback.mutators.Mutator, DepthOutputMutator);
    
    DepthOutputMutator.prototype.packFloatToVec4i = function packFloatToVec4i(value) {
       //vec4 bitSh = vec4(256.0*256.0*256.0, 256.0*256.0, 256.0, 1.0);
       //vec4 bitMsk = vec4(0.0, 1.0/256.0, 1.0/256.0, 1.0/256.0);
       //vec4 res = fract(value * bitSh);
       var r = value * 256 * 256 * 256;
       var g = value * 256 * 256;
       var b = value * 256;
       var a = value;
       r = r - Math.floor(r);
       g = g - Math.floor(g);
       b = b - Math.floor(b);
       a = a - Math.floor(a);
       //res -= res.xxyz * bitMsk;
       g -= r / 256.0;
       b -= g / 256.0;
       a -= b / 256.0;
       return [r, g, b, a];
    };
    
    DepthOutputMutator.prototype.unpackFloatFromVec4i = function unpackFloatFromVec4i(value) {
        //const vec4 bitSh = vec4(1.0 / (256.0 * 256.0 * 256.0), 1.0 / (256.0 * 256.0), 1.0 / 256.0, 1.0);
	    //return(dot(value, bitSh));
	    return value[0] * 1.0 / (256 * 256 * 256) +
	           value[1] * 1.0 / (256 * 256) +
	           value[2] * 1.0 / 256 +
	           value[3];
    };
    
    DepthOutputMutator.prototype.preCall = function depthOutput_preCall(pool, call) {
        var gl = pool.gl;
        switch (call.name) {
            case "shaderSource":
                // Rewrite all fragment shaders with the depth shader
                if (call.args[0].shaderType === gl.FRAGMENT_SHADER) {
                    var clone = call.clone();
                    clone.args[1] = this.depthShader;
                    return clone;
                }
                break;
                
            case "clear":
                // Only allow depth clears if depth mask is set
                if (gl.getParameter(gl.DEPTH_WRITEMASK) == true) {
                    var clone = call.clone();
                    clone.args[0] = call.args[0] & gl.DEPTH_BUFFER_BIT;
                    if (call.args[0] & gl.DEPTH_BUFFER_BIT) {
                        clone.args[0] |= gl.COLOR_BUFFER_BIT;
                    }
                    var d = gl.getParameter(gl.DEPTH_CLEAR_VALUE);
                    var vd = this.packFloatToVec4i(d);
                    gl.clearColor(vd[0], vd[1], vd[2], vd[3]);
                    return clone;
                } else {
                    return null;
                }
                break;
                
            case "drawArrays":
            case "drawElements":
                // Only allow draws if depth mask is set
                if (gl.getParameter(gl.DEPTH_WRITEMASK) == true) {
                    // Reset state to what we need
                    gl.disable(gl.BLEND);
                    gl.colorMask(true, true, true, true);
                } else {
                    return null;
                }
                break;
        }
        return call;
    };
    
    DepthOutputMutator.prototype.postCall = function depthOutput_postCall(pool, call) {
        var gl = pool.gl;
        switch (call.name) {
        }
    };
    
    mutators.DepthOutputMutator = DepthOutputMutator;
    
})();
