(function () {
    var resources = glinamespace("gli.capture.resources");
    
    var Program = function Program(resourceCache, rawArgs, target, stack) {
        this.super.call(this, resourceCache, rawArgs, target, stack, "Program");
    };
    glisubclass(gli.capture.resources.Resource, Program);
    
    Program.generateCaptureUniforms = function generateCaptureUniforms(gl, target) {
        var uniforms = [];
        var uniformCount = gl.getProgramParameter(target, gl.ACTIVE_UNIFORMS);
        for (var m = 0; m < uniformCount; m++) {
            var activeInfo = gl.getActiveUniform(target, m);
            if (!activeInfo) {
                continue;
            }
            
            var loc = gl.getUniformLocation(target, activeInfo.name);
            uniforms.push({
                name: activeInfo.name,
                size: activeInfo.size,
                type: activeInfo.type,
                loc: loc
            });
        }
        
        return function captureUniforms(gl, program) {
            var values = {};
            for (var n = 0; n < uniforms.length; n++) {
                var uniform = uniforms[n];
                
                var value = gl.getUniform(program, uniform.loc);
                if (gli.util.isTypedArray(value)) {
                    value = gli.util.typedArrayToArray(value);
                }
                
                values[uniform.name] = {
                    size: uniform.size,
                    type: uniform.type,
                    value: value
                };
            }
            return values;
        };
    };
    
    Program.setupCaptures = function setupCaptures(impl) {
        var methods = impl.methods;
        var buildRecorder = resources.Resource.buildRecorder;
        
        var resetCalls = [
        ];
        
        buildRecorder(impl, "attachShader", null, null);
        buildRecorder(impl, "detachShader", null, null);
        
        // linkProgram
        var original_linkProgram = methods["linkProgram"];
        methods["linkProgram"] = function linkProgram(target) {
            var gl = this;
            
            var tracked = target ? target.tracked : null;
            if (!tracked) {
                return;
            }
            var result = original_linkProgram.apply(gl, arguments);
            
            tracked.markDirty(impl.resourceCache);
            var version = tracked.currentVersion;
            if (version) {
                // Grab and push all attrib bindings (to ensure uniformity across target machines)
                // Since bindAttribLocation only takes effect on linkProgram, we record these first
                var remainingAttribs = gl.getProgramParameter(target, gl.ACTIVE_ATTRIBUTES);
                var attribIndex = 0;
                while (remainingAttribs > 0) {
                    var activeInfo = gl.getActiveAttrib(target, attribIndex);
                    if (activeInfo && activeInfo.type) {
                        remainingAttribs--;
                        var loc = gl.getAttribLocation(target, activeInfo.name);
                        version.recordCall("bindAttribLocation", [target, loc, activeInfo.name]);
                    }
                    attribIndex++;
                }
                
                version.recordCall("linkProgram", arguments);
            }
            
            // Update captureUniforms helper
            if (gl.getProgramParameter(target, gl.LINK_STATUS) === true) {
                tracked.captureUniforms = Program.generateCaptureUniforms(gl, target);
            }
            
            return result;
        };
        
        // getUniformLocation
        var original_getUniformLocation = methods["getUniformLocation"];
        methods["getUniformLocation"] = function getUniformLocation(target, name) {
            var gl = this;
            
            var tracked = target ? target.tracked : null;
            if (!tracked) {
                return;
            }
            var result = original_getUniformLocation.apply(gl, arguments);
            if (result) {
                result.sourceProgram = tracked;
                result.sourceUniformName = name;
            }
            return result;
        };
    };
    
    resources.Program = Program;
    
})();
