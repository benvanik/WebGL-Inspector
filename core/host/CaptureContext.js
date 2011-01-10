(function () {
    var host = glinamespace("gli.host");

    function errorBreak() {
        throw "WebGL error!";
    };

    function startCapturing(context) {
        context.ignoreErrors();
        context.captureFrame = true;
        //context.notifier.postMessage("capturing frame " + context.frameNumber + "...");
    };

    function stopCapturing(context) {
        context.notifier.postMessage("captured frame " + (context.frameNumber - 1));
        context.captureFrame = false;
        context.ignoreErrors();

        var frame = context.currentFrame;

        context.markFrame(null); // mark end

        // Fire off callback (if present)
        if (context.captureCallback) {
            context.captureCallback(context, frame);
        }
    };

    function frameEnded(context) {
        if (context.inFrame) {
            context.inFrame = false;
            context.statistics.endFrame();
            context.frameCompleted.fire();
            context.ignoreErrors();
        }
    };

    function frameSeparator(context) {
        context.frameNumber++;

        // Start or stop capturing
        if (context.captureFrame) {
            if (context.captureFrameEnd == context.frameNumber) {
                stopCapturing(context);
            }
        } else {
            if (context.captureFrameStart == context.frameNumber) {
                startCapturing(context);
            }
        }

        if (context.captureFrame) {
            context.markFrame(context.frameNumber);
        }

        context.statistics.beginFrame();

        // Even though we are watching most timing methods, we can't be too safe
        original_setTimeout(function () {
            host.frameTerminator.fire();
        }, 0);
    };

    function arrayCompare(a, b) {
        if (a && b && a.length == b.length) {
            for (var n = 0; n < a.length; n++) {
                if (a[n] !== b[n]) {
                    return false;
                }
            }
            return true;
        } else {
            return false;
        }
    };

    var stateCacheModifiers = {
        activeTexture: function (texture) {
            this.stateCache["ACTIVE_TEXTURE"] = texture;
        },
        bindBuffer: function (target, buffer) {
            switch (target) {
                case this.ARRAY_BUFFER:
                    this.stateCache["ARRAY_BUFFER_BINDING"] = buffer;
                    break;
                case this.ELEMENT_ARRAY_BUFFER:
                    this.stateCache["ELEMENT_ARRAY_BUFFER_BINDING"] = buffer;
                    break;
            }
        },
        bindFramebuffer: function (target, framebuffer) {
            this.stateCache["FRAMEBUFFER_BINDING"] = framebuffer;
        },
        bindRenderbuffer: function (target, renderbuffer) {
            this.stateCache["RENDERBUFFER_BINDING"] = renderbuffer;
        },
        bindTexture: function (target, texture) {
            var activeTexture = this.stateCache["ACTIVE_TEXTURE"];
            switch (target) {
                case this.TEXTURE_2D:
                    this.stateCache["TEXTURE_BINDING_2D_" + activeTexture] = texture;
                    break;
                case this.TEXTURE_CUBE_MAP:
                    this.stateCache["TEXTURE_BINDING_CUBE_MAP_" + activeTexture] = texture;
                    break;
            }
        },
        blendEquation: function (mode) {
            this.stateCache["BLEND_EQUATION_RGB"] = mode;
            this.stateCache["BLEND_EQUATION_ALPHA"] = mode;
        },
        blendEquationSeparate: function (modeRGB, modeAlpha) {
            this.stateCache["BLEND_EQUATION_RGB"] = modeRGB;
            this.stateCache["BLEND_EQUATION_ALPHA"] = modeAlpha;
        },
        blendFunc: function (sfactor, dfactor) {
            this.stateCache["BLEND_SRC_RGB"] = sfactor;
            this.stateCache["BLEND_SRC_ALPHA"] = sfactor;
            this.stateCache["BLEND_DST_RGB"] = dfactor;
            this.stateCache["BLEND_DST_ALPHA"] = dfactor;
        },
        blendFuncSeparate: function (srcRGB, dstRGB, srcAlpha, dstAlpha) {
            this.stateCache["BLEND_SRC_RGB"] = srcRGB;
            this.stateCache["BLEND_SRC_ALPHA"] = srcAlpha;
            this.stateCache["BLEND_DST_RGB"] = dstRGB;
            this.stateCache["BLEND_DST_ALPHA"] = dstAlpha;
        },
        clearColor: function (red, green, blue, alpha) {
            this.stateCache["COLOR_CLEAR_VALUE"] = [red, green, blue, alpha];
        },
        clearDepth: function (depth) {
            this.stateCache["DEPTH_CLEAR_VALUE"] = depth;
        },
        clearStencil: function (s) {
            this.stateCache["STENCIL_CLEAR_VALUE"] = s;
        },
        colorMask: function (red, green, blue, alpha) {
            this.stateCache["COLOR_WRITEMASK"] = [red, green, blue, alpha];
        },
        cullFace: function (mode) {
            this.stateCache["CULL_FACE_MODE"] = mode;
        },
        depthFunc: function (func) {
            this.stateCache["DEPTH_FUNC"] = func;
        },
        depthMask: function (flag) {
            this.stateCache["DEPTH_WRITEMASK"] = flag;
        },
        depthRange: function (zNear, zFar) {
            this.stateCache["DEPTH_RANGE"] = [zNear, zFar];
        },
        disable: function (cap) {
            switch (cap) {
                case this.BLEND:
                    this.stateCache["BLEND"] = false;
                    break;
                case this.CULL_FACE:
                    this.stateCache["CULL_FACE"] = false;
                    break;
                case this.DEPTH_TEST:
                    this.stateCache["DEPTH_TEST"] = false;
                    break;
                case this.POLYGON_OFFSET_FILL:
                    this.stateCache["POLYGON_OFFSET_FILL"] = false;
                    break;
                case this.SAMPLE_ALPHA_TO_COVERAGE:
                    this.stateCache["SAMPLE_ALPHA_TO_COVERAGE"] = false;
                    break;
                case this.SAMPLE_COVERAGE:
                    this.stateCache["SAMPLE_COVERAGE"] = false;
                    break;
                case this.SCISSOR_TEST:
                    this.stateCache["SCISSOR_TEST"] = false;
                    break;
                case this.STENCIL_TEST:
                    this.stateCache["STENCIL_TEST"] = false;
                    break;
            }
        },
        disableVertexAttribArray: function (index) {
            this.stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + index] = false;
        },
        enable: function (cap) {
            switch (cap) {
                case this.BLEND:
                    this.stateCache["BLEND"] = true;
                    break;
                case this.CULL_FACE:
                    this.stateCache["CULL_FACE"] = true;
                    break;
                case this.DEPTH_TEST:
                    this.stateCache["DEPTH_TEST"] = true;
                    break;
                case this.POLYGON_OFFSET_FILL:
                    this.stateCache["POLYGON_OFFSET_FILL"] = true;
                    break;
                case this.SAMPLE_ALPHA_TO_COVERAGE:
                    this.stateCache["SAMPLE_ALPHA_TO_COVERAGE"] = true;
                    break;
                case this.SAMPLE_COVERAGE:
                    this.stateCache["SAMPLE_COVERAGE"] = true;
                    break;
                case this.SCISSOR_TEST:
                    this.stateCache["SCISSOR_TEST"] = true;
                    break;
                case this.STENCIL_TEST:
                    this.stateCache["STENCIL_TEST"] = true;
                    break;
            }
        },
        enableVertexAttribArray: function (index) {
            this.stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + index] = true;
        },
        frontFace: function (mode) {
            this.stateCache["FRONT_FACE"] = mode;
        },
        hint: function (target, mode) {
            switch (target) {
                case this.GENERATE_MIPMAP_HINT:
                    this.stateCache["GENERATE_MIPMAP_HINT"] = mode;
                    break;
            }
        },
        lineWidth: function (width) {
            this.stateCache["LINE_WIDTH"] = width;
        },
        pixelStorei: function (pname, param) {
            switch (pname) {
                case this.PACK_ALIGNMENT:
                    this.stateCache["PACK_ALIGNMENT"] = param;
                    break;
                case this.UNPACK_ALIGNMENT:
                    this.stateCache["UNPACK_ALIGNMENT"] = param;
                    break;
                case this.UNPACK_COLORSPACE_CONVERSION_WEBGL:
                    this.stateCache["UNPACK_COLORSPACE_CONVERSION_WEBGL"] = param;
                    break;
                case this.UNPACK_FLIP_Y_WEBGL:
                    this.stateCache["UNPACK_FLIP_Y_WEBGL"] = param;
                    break;
                case this.UNPACK_PREMULTIPLY_ALPHA_WEBGL:
                    this.stateCache["UNPACK_PREMULTIPLY_ALPHA_WEBGL"] = param;
                    break;
            }
        },
        polygonOffset: function (factor, units) {
            this.stateCache["POLYGON_OFFSET_FACTOR"] = factor;
            this.stateCache["POLYGON_OFFSET_UNITS"] = units;
        },
        sampleCoverage: function (value, invert) {
            this.stateCache["SAMPLE_COVERAGE_VALUE"] = value;
            this.stateCache["SAMPLE_COVERAGE_INVERT"] = invert;
        },
        scissor: function (x, y, width, height) {
            this.stateCache["SCISSOR_BOX"] = [x, y, width, height];
        },
        stencilFunc: function (func, ref, mask) {
            this.stateCache["STENCIL_FUNC"] = func;
            this.stateCache["STENCIL_REF"] = ref;
            this.stateCache["STENCIL_VALUE_MASK"] = mask;
            this.stateCache["STENCIL_BACK_FUNC"] = func;
            this.stateCache["STENCIL_BACK_REF"] = ref;
            this.stateCache["STENCIL_BACK_VALUE_MASK"] = mask;
        },
        stencilFuncSeparate: function (face, func, ref, mask) {
            switch (face) {
                case this.FRONT:
                    this.stateCache["STENCIL_FUNC"] = func;
                    this.stateCache["STENCIL_REF"] = ref;
                    this.stateCache["STENCIL_VALUE_MASK"] = mask;
                    break;
                case this.BACK:
                    this.stateCache["STENCIL_BACK_FUNC"] = func;
                    this.stateCache["STENCIL_BACK_REF"] = ref;
                    this.stateCache["STENCIL_BACK_VALUE_MASK"] = mask;
                    break;
                case this.FRONT_AND_BACK:
                    this.stateCache["STENCIL_FUNC"] = func;
                    this.stateCache["STENCIL_REF"] = ref;
                    this.stateCache["STENCIL_VALUE_MASK"] = mask;
                    this.stateCache["STENCIL_BACK_FUNC"] = func;
                    this.stateCache["STENCIL_BACK_REF"] = ref;
                    this.stateCache["STENCIL_BACK_VALUE_MASK"] = mask;
                    break;
            }
        },
        stencilMask: function (mask) {
            this.stateCache["STENCIL_WRITEMASK"] = mask;
            this.stateCache["STENCIL_BACK_WRITEMASK"] = mask;
        },
        stencilMaskSeparate: function (face, mask) {
            switch (face) {
                case this.FRONT:
                    this.stateCache["STENCIL_WRITEMASK"] = mask;
                    break;
                case this.BACK:
                    this.stateCache["STENCIL_BACK_WRITEMASK"] = mask;
                    break;
                case this.FRONT_AND_BACK:
                    this.stateCache["STENCIL_WRITEMASK"] = mask;
                    this.stateCache["STENCIL_BACK_WRITEMASK"] = mask;
                    break;
            }
        },
        stencilOp: function (fail, zfail, zpass) {
            this.stateCache["STENCIL_FAIL"] = fail;
            this.stateCache["STENCIL_PASS_DEPTH_FAIL"] = zfail;
            this.stateCache["STENCIL_PASS_DEPTH_PASS"] = zpass;
            this.stateCache["STENCIL_BACK_FAIL"] = fail;
            this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] = zfail;
            this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] = zpass;
        },
        stencilOpSeparate: function (face, fail, zfail, zpass) {
            switch (face) {
                case this.FRONT:
                    this.stateCache["STENCIL_FAIL"] = fail;
                    this.stateCache["STENCIL_PASS_DEPTH_FAIL"] = zfail;
                    this.stateCache["STENCIL_PASS_DEPTH_PASS"] = zpass;
                    break;
                case this.BACK:
                    this.stateCache["STENCIL_BACK_FAIL"] = fail;
                    this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] = zfail;
                    this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] = zpass;
                    break;
                case this.FRONT_AND_BACK:
                    this.stateCache["STENCIL_FAIL"] = fail;
                    this.stateCache["STENCIL_PASS_DEPTH_FAIL"] = zfail;
                    this.stateCache["STENCIL_PASS_DEPTH_PASS"] = zpass;
                    this.stateCache["STENCIL_BACK_FAIL"] = fail;
                    this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] = zfail;
                    this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] = zpass;
                    break;
            }
        },
        useProgram: function (program) {
            this.stateCache["CURRENT_PROGRAM"] = program;
        },
        viewport: function (x, y, width, height) {
            this.stateCache["VIEWPORT"] = [x, y, width, height];
        }
    };

    var redundantChecks = {
        activeTexture: function (texture) {
            return this.stateCache["ACTIVE_TEXTURE"] == texture;
        },
        bindBuffer: function (target, buffer) {
            switch (target) {
                case this.ARRAY_BUFFER:
                    return this.stateCache["ARRAY_BUFFER_BINDING"] == buffer;
                case this.ELEMENT_ARRAY_BUFFER:
                    return this.stateCache["ELEMENT_ARRAY_BUFFER_BINDING"] == buffer;
            }
        },
        bindFramebuffer: function (target, framebuffer) {
            return this.stateCache["FRAMEBUFFER_BINDING"] == framebuffer;
        },
        bindRenderbuffer: function (target, renderbuffer) {
            return this.stateCache["RENDERBUFFER_BINDING"] == renderbuffer;
        },
        bindTexture: function (target, texture) {
            var activeTexture = this.stateCache["ACTIVE_TEXTURE"];
            switch (target) {
                case this.TEXTURE_2D:
                    return this.stateCache["TEXTURE_BINDING_2D_" + activeTexture] == texture;
                case this.TEXTURE_CUBE_MAP:
                    return this.stateCache["TEXTURE_BINDING_CUBE_MAP_" + activeTexture] == texture;
            }
        },
        blendEquation: function (mode) {
            return (this.stateCache["BLEND_EQUATION_RGB"] == mode) && (this.stateCache["BLEND_EQUATION_ALPHA"] == mode);
        },
        blendEquationSeparate: function (modeRGB, modeAlpha) {
            return (this.stateCache["BLEND_EQUATION_RGB"] == modeRGB) && (this.stateCache["BLEND_EQUATION_ALPHA"] == modeAlpha);
        },
        blendFunc: function (sfactor, dfactor) {
            return
            (this.stateCache["BLEND_SRC_RGB"] == sfactor) && (this.stateCache["BLEND_SRC_ALPHA"] == sfactor) &&
            (this.stateCache["BLEND_DST_RGB"] == dfactor) && (this.stateCache["BLEND_DST_ALPHA"] == dfactor);
        },
        blendFuncSeparate: function (srcRGB, dstRGB, srcAlpha, dstAlpha) {
            return
            (this.stateCache["BLEND_SRC_RGB"] == srcRGB) && (this.stateCache["BLEND_SRC_ALPHA"] == srcAlpha) &&
            (this.stateCache["BLEND_DST_RGB"] == dstRGB) && (this.stateCache["BLEND_DST_ALPHA"] == dstAlpha);
        },
        clearColor: function (red, green, blue, alpha) {
            return arrayCompare(this.stateCache["COLOR_CLEAR_VALUE"], [red, green, blue, alpha]);
        },
        clearDepth: function (depth) {
            return this.stateCache["DEPTH_CLEAR_VALUE"] == depth;
        },
        clearStencil: function (s) {
            return this.stateCache["STENCIL_CLEAR_VALUE"] == s;
        },
        colorMask: function (red, green, blue, alpha) {
            return arrayCompare(this.stateCache["COLOR_WRITEMASK"], [red, green, blue, alpha]);
        },
        cullFace: function (mode) {
            return this.stateCache["CULL_FACE_MODE"] == mode;
        },
        depthFunc: function (func) {
            return this.stateCache["DEPTH_FUNC"] == func;
        },
        depthMask: function (flag) {
            return this.stateCache["DEPTH_WRITEMASK"] == flag;
        },
        depthRange: function (zNear, zFar) {
            return arrayCompare(this.stateCache["DEPTH_RANGE"], [zNear, zFar]);
        },
        disable: function (cap) {
            switch (cap) {
                case this.BLEND:
                    return this.stateCache["BLEND"] == false;
                case this.CULL_FACE:
                    return this.stateCache["CULL_FACE"] == false;
                case this.DEPTH_TEST:
                    return this.stateCache["DEPTH_TEST"] == false;
                case this.POLYGON_OFFSET_FILL:
                    return this.stateCache["POLYGON_OFFSET_FILL"] == false;
                case this.SAMPLE_ALPHA_TO_COVERAGE:
                    return this.stateCache["SAMPLE_ALPHA_TO_COVERAGE"] == false;
                case this.SAMPLE_COVERAGE:
                    return this.stateCache["SAMPLE_COVERAGE"] == false;
                case this.SCISSOR_TEST:
                    return this.stateCache["SCISSOR_TEST"] == false;
                case this.STENCIL_TEST:
                    return this.stateCache["STENCIL_TEST"] == false;
            }
        },
        disableVertexAttribArray: function (index) {
            return this.stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + index] == false;
        },
        enable: function (cap) {
            switch (cap) {
                case this.BLEND:
                    return this.stateCache["BLEND"] == true;
                case this.CULL_FACE:
                    return this.stateCache["CULL_FACE"] == true;
                case this.DEPTH_TEST:
                    return this.stateCache["DEPTH_TEST"] == true;
                case this.POLYGON_OFFSET_FILL:
                    return this.stateCache["POLYGON_OFFSET_FILL"] == true;
                case this.SAMPLE_ALPHA_TO_COVERAGE:
                    return this.stateCache["SAMPLE_ALPHA_TO_COVERAGE"] == true;
                case this.SAMPLE_COVERAGE:
                    return this.stateCache["SAMPLE_COVERAGE"] == true;
                case this.SCISSOR_TEST:
                    return this.stateCache["SCISSOR_TEST"] == true;
                case this.STENCIL_TEST:
                    return this.stateCache["STENCIL_TEST"] == true;
            }
        },
        enableVertexAttribArray: function (index) {
            return this.stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + index] == true;
        },
        frontFace: function (mode) {
            return this.stateCache["FRONT_FACE"] == mode;
        },
        hint: function (target, mode) {
            switch (target) {
                case this.GENERATE_MIPMAP_HINT:
                    return this.stateCache["GENERATE_MIPMAP_HINT"] == mode;
            }
        },
        lineWidth: function (width) {
            return this.stateCache["LINE_WIDTH"] == width;
        },
        pixelStorei: function (pname, param) {
            switch (pname) {
                case this.PACK_ALIGNMENT:
                    return this.stateCache["PACK_ALIGNMENT"] == param;
                case this.UNPACK_ALIGNMENT:
                    return this.stateCache["UNPACK_ALIGNMENT"] == param;
                case this.UNPACK_COLORSPACE_CONVERSION_WEBGL:
                    return this.stateCache["UNPACK_COLORSPACE_CONVERSION_WEBGL"] == param;
                case this.UNPACK_FLIP_Y_WEBGL:
                    return this.stateCache["UNPACK_FLIP_Y_WEBGL"] == param;
                case this.UNPACK_PREMULTIPLY_ALPHA_WEBGL:
                    return this.stateCache["UNPACK_PREMULTIPLY_ALPHA_WEBGL"] == param;
            }
        },
        polygonOffset: function (factor, units) {
            return (this.stateCache["POLYGON_OFFSET_FACTOR"] == factor) && (this.stateCache["POLYGON_OFFSET_UNITS"] == units);
        },
        sampleCoverage: function (value, invert) {
            return (this.stateCache["SAMPLE_COVERAGE_VALUE"] == value) && (this.stateCache["SAMPLE_COVERAGE_INVERT"] == invert);
        },
        scissor: function (x, y, width, height) {
            return arrayCompare(this.stateCache["SCISSOR_BOX"], [x, y, width, height]);
        },
        stencilFunc: function (func, ref, mask) {
            return
            (this.stateCache["STENCIL_FUNC"] == func) && (this.stateCache["STENCIL_REF"] == ref) && (this.stateCache["STENCIL_VALUE_MASK"] == mask) &&
            (this.stateCache["STENCIL_BACK_FUNC"] == func) && (this.stateCache["STENCIL_BACK_REF"] == ref) && (this.stateCache["STENCIL_BACK_VALUE_MASK"] == mask);
        },
        stencilFuncSeparate: function (face, func, ref, mask) {
            switch (face) {
                case this.FRONT:
                    return (this.stateCache["STENCIL_FUNC"] == func) && (this.stateCache["STENCIL_REF"] == ref) && (this.stateCache["STENCIL_VALUE_MASK"] == mask);
                case this.BACK:
                    return (this.stateCache["STENCIL_BACK_FUNC"] == func) && (this.stateCache["STENCIL_BACK_REF"] == ref) && (this.stateCache["STENCIL_BACK_VALUE_MASK"] == mask);
                case this.FRONT_AND_BACK:
                    return
                    (this.stateCache["STENCIL_FUNC"] == func) && (this.stateCache["STENCIL_REF"] == ref) && (this.stateCache["STENCIL_VALUE_MASK"] == mask) &&
                    (this.stateCache["STENCIL_BACK_FUNC"] == func) && (this.stateCache["STENCIL_BACK_REF"] == ref) && (this.stateCache["STENCIL_BACK_VALUE_MASK"] == mask);
            }
        },
        stencilMask: function (mask) {
            return (this.stateCache["STENCIL_WRITEMASK"] == mask) && (this.stateCache["STENCIL_BACK_WRITEMASK"] == mask);
        },
        stencilMaskSeparate: function (face, mask) {
            switch (face) {
                case this.FRONT:
                    return this.stateCache["STENCIL_WRITEMASK"] == mask;
                case this.BACK:
                    return this.stateCache["STENCIL_BACK_WRITEMASK"] == mask;
                case this.FRONT_AND_BACK:
                    return (this.stateCache["STENCIL_WRITEMASK"] == mask) && (this.stateCache["STENCIL_BACK_WRITEMASK"] == mask);
            }
        },
        stencilOp: function (fail, zfail, zpass) {
            return
            (this.stateCache["STENCIL_FAIL"] == fail) && (this.stateCache["STENCIL_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_PASS_DEPTH_PASS"] == zpass) &&
            (this.stateCache["STENCIL_BACK_FAIL"] == fail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] == zpass);
        },
        stencilOpSeparate: function (face, fail, zfail, zpass) {
            switch (face) {
                case this.FRONT:
                    return (this.stateCache["STENCIL_FAIL"] == fail) && (this.stateCache["STENCIL_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_PASS_DEPTH_PASS"] == zpass);
                case this.BACK:
                    return (this.stateCache["STENCIL_BACK_FAIL"] == fail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] == zpass);
                case this.FRONT_AND_BACK:
                    return
                    (this.stateCache["STENCIL_FAIL"] == fail) && (this.stateCache["STENCIL_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_PASS_DEPTH_PASS"] == zpass) &&
                    (this.stateCache["STENCIL_BACK_FAIL"] == fail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_FAIL"] == zfail) && (this.stateCache["STENCIL_BACK_PASS_DEPTH_PASS"] == zpass);
            }
        },
        useProgram: function (program) {
            return this.stateCache["CURRENT_PROGRAM"] == program;
        },
        viewport: function (x, y, width, height) {
            return arrayCompare(this.stateCache["VIEWPORT"], [x, y, width, height]);
        }
    };

    function wrapFunction(context, functionName) {
        var originalFunction = context.rawgl[functionName];
        var redundantCheck = redundantChecks[functionName];
        var stateCacheModifier = stateCacheModifiers[functionName];
        var statistics = context.statistics;
        var callsPerFrame = statistics.callsPerFrame;
        var redundantCalls = statistics.redundantCalls;
        return function () {
            var gl = context.rawgl;

            var stack = null;
            function generateStack() {
                // Generate stack trace
                var stackResult = printStackTrace();
                // ignore garbage
                stackResult = stackResult.slice(4);
                // Fix up our type
                stackResult[0] = stackResult[0].replace("[object Object].", "gl.");
                return stackResult;
            };

            if (context.inFrame == false) {
                // First call of a new frame!
                context.inFrame = true;
                frameSeparator(context);
            }

            // PRE:
            var call = null;
            if (context.captureFrame) {
                // NOTE: for timing purposes this should be the last thing before the actual call is made
                stack = stack || (context.options.resourceStacks ? generateStack() : null);
                call = context.currentFrame.allocateCall(functionName, arguments);
            }

            callsPerFrame.value++;

            // Redundant call tracking
            if (redundantCheck && redundantCheck.apply(context, arguments)) {
                if (call) {
                    call.isRedundant = true;
                }
                // Add to aggregate stats
                redundantCalls.value++;
                // TODO: mark up per-call stats
            }

            if (context.captureFrame) {
                // Ignore all errors before this call is made
                gl.ignoreErrors();
            }

            // Call real function
            var result = originalFunction.apply(context.rawgl, arguments);

            // Get error state after real call - if we don't do this here, tracing/capture calls could mess things up
            var error = context.NO_ERROR;
            if (!context.options.ignoreErrors || context.captureFrame) {
                error = gl.getError();
            }

            // If the call modifies state, cache the right value
            if (stateCacheModifier) {
                stateCacheModifier.apply(context, arguments);
            }

            // POST:
            if (context.captureFrame) {
                if (error != context.NO_ERROR) {
                    stack = stack || generateStack();
                }
                call.complete(result, error, stack);
            }

            if (error != context.NO_ERROR) {
                context.errorMap[error] = true;

                if (context.options.breakOnError) {
                    // TODO: backtrace?
                    errorBreak();
                }
            }

            // If this is the frame separator then handle it
            if (context.options.frameSeparators.indexOf(functionName) >= 0) {
                frameEnded(context);
            }

            return result;
        };
    };

    var CaptureContext = function (canvas, rawgl, options) {
        var defaultOptions = {
            ignoreErrors: true,
            breakOnError: false,
            resourceStacks: false,
            callStacks: false,
            frameSeparators: gli.settings.global.captureOn
        };
        options = options || defaultOptions;
        for (var n in defaultOptions) {
            if (options[n] === undefined) {
                options[n] = defaultOptions[n];
            }
        }

        this.options = options;
        this.canvas = canvas;
        this.rawgl = rawgl;
        this.isWrapped = true;

        this.notifier = new host.Notifier();

        this.rawgl.canvas = canvas;
        gli.info.initialize(this.rawgl);

        this.statistics = new host.Statistics();

        this.frameNumber = 0;
        this.inFrame = false;

        // Function to call when capture completes
        this.captureCallback = null;
        // Frame range to capture (inclusive) - if inside a capture window, captureFrame == true
        this.captureFrameStart = null;
        this.captureFrameEnd = null;
        this.captureFrame = false;
        this.currentFrame = null;

        this.errorMap = {};

        this.enabledExtensions = [];

        this.frameCompleted = new gli.EventSource("frameCompleted");

        // NOTE: this should happen ASAP so that we make sure to wrap the faked function, not the real-REAL one
        gli.hacks.installAll(rawgl);

        // NOTE: this should also happen really early, but after hacks
        gli.installExtensions(rawgl);

        // Listen for inferred frame termination and extension termination
        function frameEndedWrapper() {
            frameEnded(this);
        };
        host.frameTerminator.addListener(this, frameEndedWrapper);
        var ext = rawgl.getExtension("GLI_frame_terminator");
        ext.frameEvent.addListener(this, frameEndedWrapper);

        // Clone all properties in context and wrap all functions
        for (var propertyName in rawgl) {
            if (typeof rawgl[propertyName] == 'function') {
                // Functions
                this[propertyName] = wrapFunction(this, propertyName, rawgl[propertyName]);
            } else {
                // Enums/constants/etc
                this[propertyName] = rawgl[propertyName];
            }
        }

        // Rewrite getError so that it uses our version instead
        this.getError = function () {
            for (var error in this.errorMap) {
                if (this.errorMap[error]) {
                    this.errorMap[error] = false;
                    return error;
                }
            }
            return this.NO_ERROR;
        };

        // Capture all extension requests
        var original_getExtension = this.getExtension;
        this.getExtension = function (name) {
            var result = original_getExtension.apply(this, arguments);
            if (result) {
                this.enabledExtensions.push(name);
            }
            return result;
        };

        // Used by redundant state lookup code
        this.stateCache = {};
        var stateParameters = ["ACTIVE_TEXTURE", "ARRAY_BUFFER_BINDING", "BLEND", "BLEND_COLOR", "BLEND_DST_ALPHA", "BLEND_DST_RGB", "BLEND_EQUATION_ALPHA", "BLEND_EQUATION_RGB", "BLEND_SRC_ALPHA", "BLEND_SRC_RGB", "COLOR_CLEAR_VALUE", "COLOR_WRITEMASK", "CULL_FACE", "CULL_FACE_MODE", "DEPTH_FUNC", "DEPTH_RANGE", "DEPTH_WRITEMASK", "ELEMENT_ARRAY_BUFFER_BINDING", "FRAMEBUFFER_BINDING", "FRONT_FACE", "GENERATE_MIPMAP_HINT", "LINE_WIDTH", "PACK_ALIGNMENT", "POLYGON_OFFSET_FACTOR", "POLYGON_OFFSET_FILL", "POLYGON_OFFSET_UNITS", "RENDERBUFFER_BINDING", "POLYGON_OFFSET_FACTOR", "POLYGON_OFFSET_FILL", "POLYGON_OFFSET_UNITS", "SAMPLE_ALPHA_TO_COVERAGE", "SAMPLE_COVERAGE", "SAMPLE_COVERAGE_INVERT", "SAMPLE_COVERAGE_VALUE", "SCISSOR_BOX", "SCISSOR_TEST", "STENCIL_BACK_FAIL", "STENCIL_BACK_FUNC", "STENCIL_BACK_PASS_DEPTH_FAIL", "STENCIL_BACK_PASS_DEPTH_PASS", "STENCIL_BACK_REF", "STENCIL_BACK_VALUE_MASK", "STENCIL_BACK_WRITEMASK", "STENCIL_CLEAR_VALUE", "STENCIL_FAIL", "STENCIL_FUNC", "STENCIL_PASS_DEPTH_FAIL", "STENCIL_PASS_DEPTH_PASS", "STENCIL_REF", "STENCIL_TEST", "STENCIL_VALUE_MASK", "STENCIL_WRITEMASK", "UNPACK_ALIGNMENT", "UNPACK_COLORSPACE_CONVERSION_WEBGL", "UNPACK_FLIP_Y_WEBGL", "UNPACK_PREMULTIPLY_ALPHA_WEBGL", "VIEWPORT"];
        for (var n = 0; n < stateParameters.length; n++) {
            try {
                this.stateCache[stateParameters[n]] = rawgl.getParameter(rawgl[stateParameters[n]]);
            } catch (e) {
                // Ignored
            }
        }
        var maxTextureUnits = rawgl.getParameter(rawgl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
        for (var n = 0; n < maxTextureUnits; n++) {
            this.stateCache["TEXTURE_BINDING_2D_" + n] = null;
            this.stateCache["TEXTURE_BINDING_CUBE_MAP_" + n] = null;
        }
        var maxVertexAttribs = rawgl.getParameter(rawgl.MAX_VERTEX_ATTRIBS);
        for (var n = 0; n < maxVertexAttribs; n++) {
            this.stateCache["VERTEX_ATTRIB_ARRAY_ENABLED_" + n] = false;
        }

        // Add a few helper methods
        this.ignoreErrors = rawgl.ignoreErrors = function () {
            while (this.getError() != this.NO_ERROR);
        };

        // Add debug methods
        this.mark = function () {
            if (context.captureFrame) {
                context.currentFrame.mark(arguments);
            }
        };

        // TODO: before or after we wrap? if we do it here (after), then timings won't be affected by our captures
        this.resources = new gli.host.ResourceCache(this);
    };

    CaptureContext.prototype.markFrame = function (frameNumber) {
        if (this.currentFrame) {
            // Close the previous frame
            this.currentFrame.end(this.rawgl);
            this.currentFrame = null;
        }

        if (frameNumber == null) {
            // Abort if not a real frame
            return;
        }

        var frame = new gli.host.Frame(this.canvas, this.rawgl, frameNumber, this.resources);
        this.currentFrame = frame;
    };

    CaptureContext.prototype.requestCapture = function (callback) {
        this.captureCallback = callback;
        this.captureFrameStart = this.frameNumber + 1;
        this.captureFrameEnd = this.captureFrameStart + 1;
        this.captureFrame = false;
    };

    host.CaptureContext = CaptureContext;

    host.frameTerminator = new gli.EventSource("frameTerminator");

    // This replaces setTimeout/setInterval with versions that, after the user code is called, try to end the frame
    // This should be a reliable way to bracket frame captures, unless the user is doing something crazy
    function wrapCode(code, args) {
        args = Array.prototype.slice.call(args, 2);
        return function () {
            if (code) {
                code.apply(window, args);
            }
            host.frameTerminator.fire();
        };
    };
    var original_setInterval = window.setInterval;
    window.setInterval = function (code, delay) {
        var wrappedCode = wrapCode(code, arguments);
        return original_setInterval.apply(window, [wrappedCode, delay]);
    };
    var original_setTimeout = window.setTimeout;
    window.setTimeout = function (code, delay) {
        var wrappedCode = wrapCode(code, arguments);
        return original_setTimeout.apply(window, [wrappedCode, delay]);
    };
    // Some apps, like q3bsp, use the postMessage hack - because of that, we listen in and try to use it too
    // Note that there is a race condition here such that we may fire in BEFORE the app message, but oh well
    window.addEventListener("message", function () {
        host.frameTerminator.fire();
    }, false);

    // options: {
    //     ignoreErrors: bool - ignore errors on calls (can drastically speed things up)
    //     breakOnError: bool - break on gl error
    //     resourceStacks: bool - collect resource creation/deletion callstacks
    //     callStacks: bool - collect callstacks for each call
    //     frameSeparators: ['finish'] / etc
    // }
    host.inspectContext = function (canvas, rawgl, options) {
        // Ignore if we have already wrapped the context
        if (rawgl.isWrapped) {
            // NOTE: if options differ we may want to unwrap and re-wrap
            return rawgl;
        }

        var wrapped = new CaptureContext(canvas, rawgl, options);

        return wrapped;
    };

})();
