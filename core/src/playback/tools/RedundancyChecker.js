(function () {
    var tools = glinamespace("gli.playback.tools");

    var RedundancyChecker = function RedundancyChecker(session) {
        this.super.call(this, session);

        this.activeFrame = null;
        this.pendingFrames = [];

        this.context = new gli.playback.PlaybackContext(session, {
            // options
            ignoreCrossDomainContent: false
        }, [
            new gli.playback.mutators.CallHookMutator(this, this.callHook)
        ]);
        this.context.ready.addListener(this, this.contextReady);

        this.session.captureFrameAdded.addListener(this, this.captureFrameAdded);
    };
    glisubclass(gli.playback.tools.Tool, RedundancyChecker);

    RedundancyChecker.prototype.discard = function discard() {
        this.session.captureFrameAdded.removeListener(this, this.captureFrameAdded);

        this.context.ready.removeListener(this, this.contextReady);
        this.context.discard();
        this.context = null;
    };

    RedundancyChecker.prototype.captureFrameAdded = function captureFrameAdded(frame) {
        var data = frame.toolData.redundancyChecker;
        if (data) {
            // Already checked
            // TODO: version?
            return;
        }
        data = frame.toolData.redundancyChecker = {};

        if (this.activeFrame) {
            this.pendingFrames.push(frame);
        } else {
            this.activeFrame = frame;
            this.context.setFrame(frame);
        }
    };

    RedundancyChecker.prototype.contextReady = function contextReady(context, frame) {
        this.context.run();
        this.activeFrame = null;
        
        if (this.pendingFrames.length == 0) {
            return;
        }
        this.activeFrame = this.pendingFrames.shift();
        this.context.setFrame(this.activeFrame);
    };

    RedundancyChecker.redundantChecks = {
        activeTexture: function (texture) {
            return this.getParameter(this.ACTIVE_TEXTURE) == texture;
        },
        bindBuffer: function (target, buffer) {
            switch (target) {
                case this.ARRAY_BUFFER:
                    return this.getParameter(this.ARRAY_BUFFER_BINDING) == buffer;
                case this.ELEMENT_ARRAY_BUFFER:
                    return this.getParameter(this.ELEMENT_ARRAY_BUFFER_BINDING) == buffer;
            }
        },
        bindFramebuffer: function (target, framebuffer) {
            return this.getParameter(this.FRAMEBUFFER_BINDING) == framebuffer;
        },
        bindRenderbuffer: function (target, renderbuffer) {
            return this.getParameter(this.RENDERBUFFER_BINDING) == renderbuffer;
        },
        bindTexture: function (target, texture) {
            switch (target) {
                case this.TEXTURE_2D:
                    return this.getParameter(this.TEXTURE_BINDING_2D) == texture;
                case this.TEXTURE_CUBE_MAP:
                    return this.getParameter(this.TEXTURE_BINDING_CUBE_MAP) == texture;
            }
        },
        blendEquation: function (mode) {
            return (this.getParameter(this.BLEND_EQUATION_RGB) == mode) && (this.getParameter(this.BLEND_EQUATION_ALPHA) == mode);
        },
        blendEquationSeparate: function (modeRGB, modeAlpha) {
            return (this.getParameter(this.BLEND_EQUATION_RGB) == modeRGB) && (this.getParameter(this.BLEND_EQUATION_ALPHA) == modeAlpha);
        },
        blendFunc: function (sfactor, dfactor) {
            return (this.getParameter(this.BLEND_SRC_RGB) == sfactor) && (this.getParameter(this.BLEND_SRC_ALPHA) == sfactor) &&
                   (this.getParameter(this.BLEND_DST_RGB) == dfactor) && (this.getParameter(this.BLEND_DST_ALPHA) == dfactor);
        },
        blendFuncSeparate: function (srcRGB, dstRGB, srcAlpha, dstAlpha) {
            return (this.getParameter(this.BLEND_SRC_RGB) == srcRGB) && (this.getParameter(this.BLEND_SRC_ALPHA) == srcAlpha) &&
                   (this.getParameter(this.BLEND_DST_RGB) == dstRGB) && (this.getParameter(this.BLEND_DST_ALPHA) == dstAlpha);
        },
        clearColor: function (red, green, blue, alpha) {
            return gli.util.arrayCompare(this.getParameter(this.COLOR_CLEAR_VALUE), [red, green, blue, alpha]);
        },
        clearDepth: function (depth) {
            return this.getParameter(this.DEPTH_CLEAR_VALUE) == depth;
        },
        clearStencil: function (s) {
            return this.getParameter(this.STENCIL_CLEAR_VALUE) == s;
        },
        colorMask: function (red, green, blue, alpha) {
            return gli.util.arrayCompare(this.getParameter(this.COLOR_WRITEMASK), [red, green, blue, alpha]);
        },
        cullFace: function (mode) {
            return this.getParameter(this.CULL_FACE_MODE) == mode;
        },
        depthFunc: function (func) {
            return this.getParameter(this.DEPTH_FUNC) == func;
        },
        depthMask: function (flag) {
            return this.getParameter(this.DEPTH_WRITEMASK) == flag;
        },
        depthRange: function (zNear, zFar) {
            return gli.util.arrayCompare(this.getParameter(this.DEPTH_RANGE), [zNear, zFar]);
        },
        disable: function (cap) {
            switch (cap) {
                case this.BLEND:
                    return this.getParameter(this.BLEND) == false;
                case this.CULL_FACE:
                    return this.getParameter(this.CULL_FACE) == false;
                case this.DEPTH_TEST:
                    return this.getParameter(this.DEPTH_TEST) == false;
                case this.POLYGON_OFFSET_FILL:
                    return this.getParameter(this.POLYGON_OFFSET_FILL) == false;
                case this.SAMPLE_ALPHA_TO_COVERAGE:
                    return this.getParameter(this.SAMPLE_ALPHA_TO_COVERAGE) == false;
                case this.SAMPLE_COVERAGE:
                    return this.getParameter(this.SAMPLE_COVERAGE) == false;
                case this.SCISSOR_TEST:
                    return this.getParameter(this.SCISSOR_TEST) == false;
                case this.STENCIL_TEST:
                    return this.getParameter(this.STENCIL_TEST) == false;
            }
        },
        disableVertexAttribArray: function (index) {
            return this.getVertexAttrib(index, this.VERTEX_ATTRIB_ARRAY_ENABLED) == false;
        },
        enable: function (cap) {
            switch (cap) {
                case this.BLEND:
                    return this.getParameter(this.BLEND) == true;
                case this.CULL_FACE:
                    return this.getParameter(this.CULL_FACE) == true;
                case this.DEPTH_TEST:
                    return this.getParameter(this.DEPTH_TEST) == true;
                case this.POLYGON_OFFSET_FILL:
                    return this.getParameter(this.POLYGON_OFFSET_FILL) == true;
                case this.SAMPLE_ALPHA_TO_COVERAGE:
                    return this.getParameter(this.SAMPLE_ALPHA_TO_COVERAGE) == true;
                case this.SAMPLE_COVERAGE:
                    return this.getParameter(this.SAMPLE_COVERAGE) == true;
                case this.SCISSOR_TEST:
                    return this.getParameter(this.SCISSOR_TEST) == true;
                case this.STENCIL_TEST:
                    return this.getParameter(this.STENCIL_TEST) == true;
            }
        },
        enableVertexAttribArray: function (index) {
            return this.getVertexAttrib(index, this.VERTEX_ATTRIB_ARRAY_ENABLED) == true;
        },
        frontFace: function (mode) {
            return this.getParameter(this.FRONT_FACE) == mode;
        },
        hint: function (target, mode) {
            switch (target) {
                case this.GENERATE_MIPMAP_HINT:
                    return this.getParameter(this.GENERATE_MIPMAP_HINT) == mode;
            }
        },
        lineWidth: function (width) {
            return this.getParameter(this.LINE_WIDTH) == width;
        },
        pixelStorei: function (pname, param) {
            switch (pname) {
                case this.PACK_ALIGNMENT:
                    return this.getParameter(this.PACK_ALIGNMENT) == param;
                case this.UNPACK_ALIGNMENT:
                    return this.getParameter(this.UNPACK_ALIGNMENT) == param;
                case this.UNPACK_COLORSPACE_CONVERSION_WEBGL:
                    return this.getParameter(this.UNPACK_COLORSPACE_CONVERSION_WEBGL) == param;
                case this.UNPACK_FLIP_Y_WEBGL:
                    return this.getParameter(this.UNPACK_FLIP_Y_WEBGL) == param;
                case this.UNPACK_PREMULTIPLY_ALPHA_WEBGL:
                    return this.getParameter(this.UNPACK_PREMULTIPLY_ALPHA_WEBGL) == param;
            }
        },
        polygonOffset: function (factor, units) {
            return (this.getParameter(this.POLYGON_OFFSET_FACTOR) == factor) && (this.getParameter(this.POLYGON_OFFSET_UNITS) == units);
        },
        sampleCoverage: function (value, invert) {
            return (this.getParameter(this.SAMPLE_COVERAGE_VALUE) == value) && (this.getParameter(this.SAMPLE_COVERAGE_INVERT) == invert);
        },
        scissor: function (x, y, width, height) {
            return gli.util.arrayCompare(this.getParameter(this.SCISSOR_BOX), [x, y, width, height]);
        },
        stencilFunc: function (func, ref, mask) {
            return (this.getParameter(this.STENCIL_FUNC) == func) && (this.getParameter(this.STENCIL_REF) == ref) && (this.getParameter(this.STENCIL_VALUE_MASK) == mask) &&
                   (this.getParameter(this.STENCIL_BACK_FUNC) == func) && (this.getParameter(this.STENCIL_BACK_REF) == ref) && (this.getParameter(this.STENCIL_BACK_VALUE_MASK) == mask);
        },
        stencilFuncSeparate: function (face, func, ref, mask) {
            switch (face) {
                case this.FRONT:
                    return (this.getParameter(this.STENCIL_FUNC) == func) && (this.getParameter(this.STENCIL_REF) == ref) && (this.getParameter(this.STENCIL_VALUE_MASK) == mask);
                case this.BACK:
                    return (this.getParameter(this.STENCIL_BACK_FUNC) == func) && (this.getParameter(this.STENCIL_BACK_REF) == ref) && (this.getParameter(this.STENCIL_BACK_VALUE_MASK) == mask);
                case this.FRONT_AND_BACK:
                    return (this.getParameter(this.STENCIL_FUNC) == func) && (this.getParameter(this.STENCIL_REF) == ref) && (this.getParameter(this.STENCIL_VALUE_MASK) == mask) &&
                           (this.getParameter(this.STENCIL_BACK_FUNC) == func) && (this.getParameter(this.STENCIL_BACK_REF) == ref) && (this.getParameter(this.STENCIL_BACK_VALUE_MASK) == mask);
            }
        },
        stencilMask: function (mask) {
            return (this.getParameter(this.STENCIL_WRITEMASK) == mask) && (this.getParameter(this.STENCIL_BACK_WRITEMASK) == mask);
        },
        stencilMaskSeparate: function (face, mask) {
            switch (face) {
                case this.FRONT:
                    return this.getParameter(this.STENCIL_WRITEMASK) == mask;
                case this.BACK:
                    return this.getParameter(this.STENCIL_BACK_WRITEMASK) == mask;
                case this.FRONT_AND_BACK:
                    return (this.getParameter(this.STENCIL_WRITEMASK) == mask) && (this.getParameter(this.STENCIL_BACK_WRITEMASK) == mask);
            }
        },
        stencilOp: function (fail, zfail, zpass) {
            return (this.getParameter(this.STENCIL_FAIL) == fail) && (this.getParameter(this.STENCIL_PASS_DEPTH_FAIL) == zfail) && (this.getParameter(this.STENCIL_PASS_DEPTH_PASS) == zpass) &&
                   (this.getParameter(this.STENCIL_BACK_FAIL) == fail) && (this.getParameter(this.STENCIL_BACK_PASS_DEPTH_FAIL) == zfail) && (this.getParameter(this.STENCIL_BACK_PASS_DEPTH_PASS) == zpass);
        },
        stencilOpSeparate: function (face, fail, zfail, zpass) {
            switch (face) {
                case this.FRONT:
                    return (this.getParameter(this.STENCIL_FAIL) == fail) && (this.getParameter(this.STENCIL_PASS_DEPTH_FAIL) == zfail) && (this.getParameter(this.STENCIL_PASS_DEPTH_PASS) == zpass);
                case this.BACK:
                    return (this.getParameter(this.STENCIL_BACK_FAIL) == fail) && (this.getParameter(this.STENCIL_BACK_PASS_DEPTH_FAIL) == zfail) && (this.getParameter(this.STENCIL_BACK_PASS_DEPTH_PASS) == zpass);
                case this.FRONT_AND_BACK:
                    return (this.getParameter(this.STENCIL_FAIL) == fail) && (this.getParameter(this.STENCIL_PASS_DEPTH_FAIL) == zfail) && (this.getParameter(this.STENCIL_PASS_DEPTH_PASS) == zpass) &&
                           (this.getParameter(this.STENCIL_BACK_FAIL) == fail) && (this.getParameter(this.STENCIL_BACK_PASS_DEPTH_FAIL) == zfail) && (this.getParameter(this.STENCIL_BACK_PASS_DEPTH_PASS) == zpass);
            }
        },
        uniformN: function (location, v) {
            if (!location) {
                return true;
            }
            var program = this.getParameter(this.CURRENT_PROGRAM);
            var value = this.getUniform(program, location);
            if (value && value.length) {
                return gli.util.arrayCompare(value, v);
            } else {
                return value === v;
            }
        },
        uniform1f: function (location, v0) {
            return RedundancyChecker.redundantChecks.uniformN.call(this, location, v0);
        },
        uniform2f: function (location, v0, v1) {
            return RedundancyChecker.redundantChecks.uniformN.call(this, location, [v0, v1]);
        },
        uniform3f: function (location, v0, v1, v2) {
            return RedundancyChecker.redundantChecks.uniformN.call(this, location, [v0, v1, v2]);
        },
        uniform4f: function (location, v0, v1, v2, v3) {
            return RedundancyChecker.redundantChecks.uniformN.call(this, location, [v0, v1, v2, v3]);
        },
        uniform1i: function (location, v0) {
            return RedundancyChecker.redundantChecks.uniformN.call(this, location, v0);
        },
        uniform2i: function (location, v0, v1) {
            return RedundancyChecker.redundantChecks.uniformN.call(this, location, [v0, v1]);
        },
        uniform3i: function (location, v0, v1, v2) {
            return RedundancyChecker.redundantChecks.uniformN.call(this, location, [v0, v1, v2]);
        },
        uniform4i: function (location, v0, v1, v2, v3) {
            return RedundancyChecker.redundantChecks.uniformN.call(this, location, [v0, v1, v2, v3]);
        },
        uniform1fv: function (location, v) {
            return RedundancyChecker.redundantChecks.uniformN.call(this, location, v);
        },
        uniform2fv: function (location, v) {
            return RedundancyChecker.redundantChecks.uniformN.call(this, location, v);
        },
        uniform3fv: function (location, v) {
            return RedundancyChecker.redundantChecks.uniformN.call(this, location, v);
        },
        uniform4fv: function (location, v) {
            return RedundancyChecker.redundantChecks.uniformN.call(this, location, v);
        },
        uniform1iv: function (location, v) {
            return RedundancyChecker.redundantChecks.uniformN.call(this, location, v);
        },
        uniform2iv: function (location, v) {
            return RedundancyChecker.redundantChecks.uniformN.call(this, location, v);
        },
        uniform3iv: function (location, v) {
            return RedundancyChecker.redundantChecks.uniformN.call(this, location, v);
        },
        uniform4iv: function (location, v) {
            return RedundancyChecker.redundantChecks.uniformN.call(this, location, v);
        },
        uniformMatrix2fv: function (location, transpose, v) {
            // TODO: transpose
            return RedundancyChecker.redundantChecks.uniformN.call(this, location, v);
        },
        uniformMatrix3fv: function (location, transpose, v) {
            // TODO: transpose
            return RedundancyChecker.redundantChecks.uniformN.call(this, location, v);
        },
        uniformMatrix4fv: function (location, transpose, v) {
            // TODO: transpose
            return RedundancyChecker.redundantChecks.uniformN.call(this, location, v);
        },
        useProgram: function (program) {
            return this.getParameter(this.CURRENT_PROGRAM) == program;
        },
        vertexAttrib1f: function (indx, x) {
            return gli.util.arrayCompare(this.getVertexAttrib(indx, this.CURRENT_VERTEX_ATTRIB), [x, 0, 0, 1]);
        },
        vertexAttrib2f: function (indx, x, y) {
            return gli.util.arrayCompare(this.getVertexAttrib(indx, this.CURRENT_VERTEX_ATTRIB), [x, y, 0, 1]);
        },
        vertexAttrib3f: function (indx, x, y, z) {
            return gli.util.arrayCompare(this.getVertexAttrib(indx, this.CURRENT_VERTEX_ATTRIB), [x, y, z, 1]);
        },
        vertexAttrib4f: function (indx, x, y, z, w) {
            return gli.util.arrayCompare(this.getVertexAttrib(indx, this.CURRENT_VERTEX_ATTRIB), [x, y, z, w]);
        },
        vertexAttrib1fv: function (indx, v) {
            return gli.util.arrayCompare(this.getVertexAttrib(indx, this.CURRENT_VERTEX_ATTRIB), [v[0], 0, 0, 1]);
        },
        vertexAttrib2fv: function (indx, v) {
            return gli.util.arrayCompare(this.getVertexAttrib(indx, this.CURRENT_VERTEX_ATTRIB), [v[0], v[1], 0, 1]);
        },
        vertexAttrib3fv: function (indx, v) {
            return gli.util.arrayCompare(this.getVertexAttrib(indx, this.CURRENT_VERTEX_ATTRIB), [v[0], v[1], v[2], 1]);
        },
        vertexAttrib4fv: function (indx, v) {
            return gli.util.arrayCompare(this.getVertexAttrib(indx, this.CURRENT_VERTEX_ATTRIB), v);
        },
        vertexAttribPointer: function (indx, size, type, normalized, stride, offset) {
            return (this.getVertexAttrib(indx, this.VERTEX_ATTRIB_ARRAY_SIZE) == size) &&
                   (this.getVertexAttrib(indx, this.VERTEX_ATTRIB_ARRAY_TYPE) == type) &&
                   (this.getVertexAttrib(indx, this.VERTEX_ATTRIB_ARRAY_NORMALIZED) == normalized) &&
                   (this.getVertexAttrib(indx, this.VERTEX_ATTRIB_ARRAY_STRIDE) == stride) &&
                   (this.getVertexAttribOffset(indx, this.VERTEX_ATTRIB_ARRAY_POINTER) == offset) &&
                   (this.getVertexAttrib(indx, this.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING) == this.getParameter(this.ARRAY_BUFFER_BINDING));
        },
        viewport: function (x, y, width, height) {
            return gli.util.arrayCompare(this.getParameter(this.VIEWPORT), [x, y, width, height]);
        }
    };

    RedundancyChecker.prototype.callHook = function callHook(gl, pool, call) {
        // Ignore resource creation calls
        if (!this.context.isStepping) {
            return;
        }

        var checker = RedundancyChecker.redundantChecks[call.name];
        if (checker) {
            var args = call.transformArgs(pool);
            call.redundant = checker.apply(gl, args);
        } else {
            call.redundant = false;
        }
    };

    tools.RedundancyChecker = RedundancyChecker;

})();
