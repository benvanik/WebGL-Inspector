(function () {
    var resources = glinamespace("gli.capture.resources");
    
    var Program = function Program(resourceCache, rawArgs, target, stack) {
        this.super.call(this, resourceCache, rawArgs, target, stack, "Program");
    };
    glisubclass(gli.capture.resources.Resource, Program);
    
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
            
            // Grab and push all attrib bindings (to ensure uniformity across target machines)
            // Since bindAttribLocation only takes effect on linkProgram, we record these first
            var remainingAttribs = gl.getProgramParameter(target, gl.ACTIVE_ATTRIBUTES);
            var attribIndex = 0;
            while (remainingAttribs > 0) {
                var activeInfo = gl.getActiveAttrib(target, attribIndex);
                if (activeInfo && activeInfo.type) {
                    remainingAttribs--;
                    var loc = gl.getAttribLocation(target, activeInfo.name);
                    tracked.currentVersion.recordCall("bindAttribLocation", [target, loc, activeInfo.name]);
                }
                attribIndex++;
            }
            
            tracked.currentVersion.recordCall("linkProgram", arguments);
            
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
