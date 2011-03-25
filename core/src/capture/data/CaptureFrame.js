(function () {
    var data = glinamespace("gli.capture.data");
    
    // Max size, in pixels, of screenshot
    var kScreenshotSize = 80;
    
    var CaptureFrame = function CaptureFrame(gl, frameNumber, resourceCache) {
        this.gl = gl;
        
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
        
        this.initialUniforms = [];
        this.initialState = this.captureState(gl);
        this.initialResources = resourceCache.captureVersions();
        
        this.calls = [];
        
        // Hopefully right before execution
        this.time = (new Date()).getTime();
        this.duration = 0;
        this.interval = new gli.util.Interval();
        this.interval.start();
    };
    
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
    
    // Capture all state values
    CaptureFrame.prototype.captureState = function captureState(gl) {
        var state = {};
        
        // Grab generic resources
        for (var n = 0; n < stateParameters.length; n++) {
            var pname = stateParameters[n];
            try {
                var value = state[pname] = gl.getParameter(gl[pname]);
                if (value && value.isWebGLObject) {
                    this.markResourceUsed(value.tracked);
                }
            } catch (e) {
                // Ignored
            }
        }
        
        var maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
        var originalActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);
        for (var n = 0; n < maxTextureUnits; n++) {
            gl.activeTexture(gl.TEXTURE0 + n);
            var value2d = state["TEXTURE_BINDING_2D_" + n] = gl.getParameter(gl.TEXTURE_BINDING_2D);
            if (value2d) {
                this.markResourceUsed(value2d.tracked);
            }
            var valueCube = state["TEXTURE_BINDING_CUBE_MAP_" + n] = gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP);
            if (valueCube) {
                this.markResourceUsed(valueCube.tracked);
            }
        }
        gl.activeTexture(originalActiveTexture);
        
        var maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        for (var n = 0; n < maxVertexAttribs; n++) {
            state["VERTEX_ATTRIB_ARRAY_ENABLED_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_ENABLED);
            state["VERTEX_ATTRIB_ARRAY_SIZE_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_SIZE);
            state["VERTEX_ATTRIB_ARRAY_STRIDE_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_STRIDE);
            state["VERTEX_ATTRIB_ARRAY_TYPE_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_TYPE);
            state["VERTEX_ATTRIB_ARRAY_NORMALIZED_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED);
            state["VERTEX_ATTRIB_ARRAY_POINTER_" + n] = gl.getVertexAttribOffset(n, gl.VERTEX_ATTRIB_ARRAY_POINTER);
            state["CURRENT_VERTEX_ATTRIB_" + n] = gl.getVertexAttrib(n, gl.CURRENT_VERTEX_ATTRIB);
            
            var value = state["VERTEX_ATTRIB_ARRAY_BUFFER_BINDING_" + n] = gl.getVertexAttrib(n, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
            if (value) {
                this.markResourceUsed(value.tracked);
            }
        }
        
        return state;
    };
    
    // Mark a resource (and all dependent resources) as used in this frame
    CaptureFrame.prototype.markResourceUsed = function markResourceUsed(tracked) {
        // Add entry
        var wasUsed = this.resourceTable[tracked.id];
        this.resourceTable[tracked.id] = true;
        
        // Cache program uniforms on first use
        if (!wasUsed && tracked instanceof gli.capture.resources.Program) {
            var gl = this.gl;
            this.initialUniforms.push({
                id: tracked.id,
                values: tracked.captureUniforms(gl, tracked.target)
            });
        }
        
        // Check for dependent resources
        var dependentResources = tracked.currentVersion.getDependentResources(tracked);
        for (var n = 0; n < dependentResources.length; n++) {
            this.markResourceUsed(dependentResources[n]);
        }
    };
    
    // Add call
    CaptureFrame.prototype.allocateCall = function allocateCall(type, name, rawArgs) {
        var call = new gli.capture.data.Call(this.calls.length, type, name, rawArgs);
        for (var n = 0; n < call.args.length; n++) {
            var arg = call.args[n];
            if (arg && arg.isWebGLObject) {
                this.markResourceUsed(arg.tracked);
            }
        }
        return call;
    };
    
    CaptureFrame.prototype.completeCall = function completeCall(call) {
        // TODO: size array more than one call at a time to prevent tons of gc
        this.calls.push(call);
    };
    
    // Finish frame
    CaptureFrame.prototype.complete = function complete(gl) {
        // Hopefully right after execution
        this.interval.stop()
        this.duration = this.interval.microseconds();
        delete this.interval;
        
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
    CaptureFrame.prototype.prepareForTransport = function prepareForTransport(fat) {
        var gl = this.gl;
        delete this.gl;
        
        // Drop screenshot (maybe preserve? base64 encode?)
        if (!fat) {
            this.screenshot = null;
        }

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
