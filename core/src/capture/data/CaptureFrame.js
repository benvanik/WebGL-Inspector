(function () {
    var data = glinamespace("gli.capture.data");
    
    // Max size, in pixels, of screenshot
    var kScreenshotSize = 80;
    
    var CaptureFrame = function CaptureFrame(gl, frameNumber, resourceCache) {
        // Capture attributes
        var canvas = gl.canvas;
        this.canvasInfo = {
            width: canvas.width,
            height: canvas.height,
            attributes: gl.getContextAttributes()
        };
        
        this.frameNumber = frameNumber;
        this.screenshot = null;
        
        this.resourceTable = {};
        
        this.initialState = this.captureState(gl);
        this.initialUniforms = this.captureUniforms(gl, resourceCache);
        this.initialResources = resourceCache.captureVersions();
        
        this.calls = [];
        
        // Hopefully right before execution
        this.time = (new Date()).getTime();
        this.duration = 0;
    };
    
    // Capture all state values
    CaptureFrame.prototype.captureState = function captureState(gl) {
        var state = {};
        
        var stateParameters = [
            "ACTIVE_TEXTURE",
            "ALIASED_LINE_WIDTH_RANGE",
            "ALIASED_POINT_SIZE_RANGE",
            "ALPHA_BITS",
            "ARRAY_BUFFER_BINDING",
            "BLEND",
            "BLEND_COLOR",
            "BLEND_DST_ALPHA",
            "BLEND_DST_RGB",
            "BLEND_EQUATION_ALPHA",
            "BLEND_EQUATION_RGB",
            "BLEND_SRC_ALPHA",
            "BLEND_SRC_RGB",
            "BLUE_BITS",
            "COLOR_CLEAR_VALUE",
            "COLOR_WRITEMASK",
            "CULL_FACE",
            "CULL_FACE_MODE",
            "CURRENT_PROGRAM",
            "DEPTH_BITS",
            "DEPTH_CLEAR_VALUE",
            "DEPTH_FUNC",
            "DEPTH_RANGE",
            "DEPTH_TEST",
            "DEPTH_WRITEMASK",
            "DITHER",
            "ELEMENT_ARRAY_BUFFER_BINDING",
            "FRAMEBUFFER_BINDING",
            "FRONT_FACE",
            "GENERATE_MIPMAP_HINT",
            "GREEN_BITS",
            "LINE_WIDTH",
            "MAX_COMBINED_TEXTURE_IMAGE_UNITS",
            "MAX_CUBE_MAP_TEXTURE_SIZE",
            "MAX_FRAGMENT_UNIFORM_VECTORS",
            "MAX_RENDERBUFFER_SIZE",
            "MAX_TEXTURE_IMAGE_UNITS",
            "MAX_TEXTURE_SIZE",
            "MAX_VARYING_VECTORS",
            "MAX_VERTEX_ATTRIBS",
            "MAX_VERTEX_TEXTURE_IMAGE_UNITS",
            "MAX_VERTEX_UNIFORM_VECTORS",
            "MAX_VIEWPORT_DIMS",
            "NUM_COMPRESSED_TEXTURE_FORMATS",
            "PACK_ALIGNMENT",
            "POLYGON_OFFSET_FACTOR",
            "POLYGON_OFFSET_FILL",
            "POLYGON_OFFSET_UNITS",
            "RED_BITS",
            "RENDERBUFFER_BINDING",
            "RENDERER",
            "SAMPLE_ALPHA_TO_COVERAGE",
            "SAMPLE_BUFFERS",
            "SAMPLE_COVERAGE",
            "SAMPLE_COVERAGE_INVERT",
            "SAMPLE_COVERAGE_VALUE",
            "SAMPLES",
            "SCISSOR_BOX",
            "SCISSOR_TEST",
            "SHADING_LANGUAGE_VERSION",
            "STENCIL_BACK_FAIL",
            "STENCIL_BACK_FUNC",
            "STENCIL_BACK_PASS_DEPTH_FAIL",
            "STENCIL_BACK_PASS_DEPTH_PASS",
            "STENCIL_BACK_REF",
            "STENCIL_BACK_VALUE_MASK",
            "STENCIL_BACK_WRITEMASK",
            "STENCIL_BITS",
            "STENCIL_CLEAR_VALUE",
            "STENCIL_FAIL",
            "STENCIL_FUNC",
            "STENCIL_PASS_DEPTH_FAIL",
            "STENCIL_PASS_DEPTH_PASS",
            "STENCIL_REF",
            "STENCIL_TEST",
            "STENCIL_VALUE_MASK",
            "STENCIL_WRITEMASK",
            "SUBPIXEL_BITS",
            "UNPACK_ALIGNMENT",
            "UNPACK_COLORSPACE_CONVERSION_WEBGL",
            "UNPACK_FLIP_Y_WEBGL",
            "UNPACK_PREMULTIPLY_ALPHA_WEBGL",
            "VENDOR",
            "VERSION",
            "VIEWPORT"
        ];
        for (var n = 0; n < stateParameters.length; n++) {
            try {
                state[stateParameters[n]] = gl.getParameter(gl[stateParameters[n]]);
            } catch (e) {
                // Ignored
            }
        }
        
        var maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
        var originalActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        for (var n = 0; n < maxTextureUnits; n++) {
            gl.activeTexture(gl.TEXTURE0 + n);
            state["TEXTURE_BINDING_2D_" + n] = gl.getParameter(gl.TEXTURE_BINDING_2D);
            state["TEXTURE_BINDING_CUBE_MAP_" + n] = gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP);
        }
        gl.activeTexture(originalActiveTexture);
        
        var maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        for (var n = 0; n < maxVertexAttribs; n++) {
            state["VERTEX_ATTRIB_ARRAY_ENABLED_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_ENABLED);
            state["VERTEX_ATTRIB_ARRAY_BUFFER_BINDING_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
            state["VERTEX_ATTRIB_ARRAY_SIZE_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_SIZE);
            state["VERTEX_ATTRIB_ARRAY_STRIDE_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_STRIDE);
            state["VERTEX_ATTRIB_ARRAY_TYPE_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_TYPE);
            state["VERTEX_ATTRIB_ARRAY_NORMALIZED_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED);
            state["VERTEX_ATTRIB_ARRAY_POINTER_" + n] = gl.getVertexAttribOffset(n, gl.VERTEX_ATTRIB_ARRAY_POINTER);
            state["CURRENT_VERTEX_ATTRIB_" + n] = gl.getVertexAttrib(n, gl.CURRENT_VERTEX_ATTRIB);
        }
        
        // Fixup resource references and add to the resource table
        for (var name in state) {
            var value = state[name];
            if (value) {
                if (gli.util.isWebGLResource(value)) {
                    var tracked = value.tracked;
                    this.markResourceUsed(tracked);
                }
            }
        }
        
        return state;
    };
    
    // Capture all uniform values of the given programs
    CaptureFrame.prototype.captureUniforms = function captureUniforms(gl, resourceCache) {
        var initialUniforms = [];
        
        // Get all programs (we will grab all the uniforms and cleanup later
        var trackedPrograms = resourceCache.getPrograms();
        
        for (var n = 0; n < trackedPrograms.length; n++) {
            var trackedProgram = trackedPrograms[n];
            var target = trackedProgram.target;
            
            // Populate all values
            var values = {};
            var uniformCount = gl.getProgramParameter(target, gl.ACTIVE_UNIFORMS);
            for (var m = 0; m < uniformCount; m++) {
                var activeInfo = gl.getActiveUniform(target, m);
                if (!activeInfo) {
                    continue;
                }
                
                var loc = gl.getUniformLocation(target, activeInfo.name);
                var value = gl.getUniform(target, loc);
                if (gli.util.isTypedArray(value)) {
                    value = gli.util.typedArrayToArray(value);
                }
                values[activeInfo.name] = {
                    size: activeInfo.size,
                    type: activeInfo.type,
                    value: value
                };
            }
            
            initialUniforms.push({
                id: trackedProgram.id,
                values: values
            });
        }
        
        return initialUniforms;
    };
    
    // Mark a resource (and all dependent resources) as used in this frame
    CaptureFrame.prototype.markResourceUsed = function markResourceUsed(tracked) {
        // Add entry
        this.resourceTable[tracked.id] = true;
        
        // Check for dependent resources
        var dependentResources = tracked.currentVersion.getDependentResources(tracked);
        for (var n = 0; n < dependentResources.length; n++) {
            this.markResourceUsed(dependentResources[n]);
        }
    };
    
    // Add a call
    CaptureFrame.prototype.allocateCall = function allocateCall(type, name, rawArgs) {
        var call = new data.Call(this.calls.length, type, name, rawArgs);
        this.calls.push(call);
        return call;
    };
    
    // Finish frame
    CaptureFrame.prototype.complete = function complete(gl) {
        // Hopefully right after execution
        var time = (new Date()).getTime();
        this.duration = time - this.time;
        
        // Grab all resources from all calls
        for (var n = 0; n < this.calls.length; n++) {
            var call = this.calls[n];
            for (var m = 0; m < call.args.length; m++) {
                var arg = call.args[m];
                if (arg && gli.util.isWebGLResource(arg)) {
                    // Pull out tracking reference and add to resource table
                    var tracked = sarg.tracked;
                    this.resourcesUsed.push(tracked);
                    this.markResourceUsed(tracked);
                }
            }
        }
        
        // Prune all unneeded uniforms
        var initialUniforms = [];
        while (this.initialUniforms.length) {
            var obj = this.initialUniforms.pop();
            if (this.resourceTable[obj.id]) {
                // Referenced
                initialUniforms.push(obj);
            }
        }
        this.initialUniforms = initialUniforms;
        
        // Prune all unneeded resource versions
        var initialResources = [];
        while (this.initialResources.length) {
            var obj = this.initialResources.pop();
            if (this.resourceTable[obj.id]) {
                // Referenced
                initialResources.push(obj);
            }
        }
        this.initialResources = initialResources;
        
        // Take a picture! Note, this may fail for many reasons, but seems ok right now
        // We draw at a small size right now (instead of preserving the original) as this is
        // just a perf optimization for the UI
        try {
            var sourceCanvas = gl.canvas;
            var newSize = gli.util.constrainSize(sourceCanvas.width, sourceCanvas.height, kScreenshotSize);
            this.screenshot = sourceCanvas.ownerDocument.createElement("canvas");
            this.screenshot.width = newSize[0];
            this.screenshot.height = newSize[1];
            var ctx2d = this.screenshot.getContext("2d");
            ctx2d.drawImage(sourceCanvas, 0, 0, this.screenshot.width, this.screenshot.height);
        } catch (e) {
            console.log("Failed to take frame screenshot");
        }
    };
    
    // Drop any big structures/cache/etc
    CaptureFrame.prototype.prepareForTransport = function prepareForTransport() {
        // Drop screenshot (maybe preserve? base64 encode?)
        this.screenshot = null;

        // Prepare initialState
        var state = this.initialState;
        for (var name in state) {
            var value = state[name];
            if (value) {
                if (gli.util.isWebGLResource(value)) {
                    var tracked = value.tracked;
                    state[name] = {
                        gliType: tracked.type,
                        id: tracked.id
                    };
                } else if (gli.util.isTypedArray(value)) {
                    state[name] = {
                        arrayType: glitypename(value),
                        data: gli.util.typedArrayToArray(value)
                    };
                }
            }
        }

        // Prepare calls
        for (var n = 0; n < this.calls.length; n++) {
            var call = this.calls[n];
            call.prepareForTransport();
        }
    };
    
    data.CaptureFrame = CaptureFrame;
    
})();
