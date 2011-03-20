(function () {
    var playback = glinamespace("gli.playback");

    // Playback index has a few states:
    // index:
    //     null - at the beginning of the frame, before the first call is made
    //     0 <= N < callCount - inside the frame on a specific call at index N (post execution)

    var PlaybackContext = function PlaybackContext(session, mutators) {
        this.session = session;
        this.mutators = mutators || [];

        // TODO: get resource pool
        this.resourcePool = resourcePool;

        this.gl = this.resourcePool.gl;

        this.frame = null;
        this.callIndex = null;

        this.stepped = new gli.util.EventSource("stepped");
        this.isStepping = false;

        // Cached to speed things up
        this.preCallHandlers = [];
        this.postCallHandlers = [];
        for (var n = 0; n < this.mutators.length; n++) {
            var mutator = this.mutators[n];
            for (var m = 0; m < mutator.callHandlers.length; m++) {
                var handlers = mutator.callHandlers[m];
                if (handlers.pre) {
                    this.preCallHandlers.push(handlers.pre);
                }
                if (handlers.post) {
                    this.postCallHandlers.push(handlers.post);
                }
            }
        }
    };

    PlaybackContext.prototype.beginStepping = function beginStepping() {
        this.isStepping = true;
    };

    PlaybackContext.prototype.endStepping = function endStepping() {
        this.isStepping = false;
        this.stepped.fire();
    };

    PlaybackContext.prototype.setFrame = function setFrame(frame) {
        if (this.frame) {
            // Cleanup
            this.frame = null;
        }

        this.frame = frame;

        this.resetFrame();
    };

    PlaybackContext.prototype.resetFrame = function resetFrame() {
        // Sort resources by creation order - this ensures that shaders are ready before programs, etc
        // Since dependencies are fairly straightforward, this *should* be ok
        // 0 - Buffer
        // 1 - Texture
        // 2 - Renderbuffer
        // 3 - Framebuffer
        // 4 - Shader
        // 5 - Program
        var resourcesUsed = frame.initialResources.slice();
        resourcesUsed.sort(function (a, b) {
            return a.resource.creationOrder - b.resource.creationOrder;
        });

        // Setup all resources
        for (var n = 0; n < resourcesUsed.length; n++) {
            var info = resourcesUsed[n];
            this.resourcePool.ensureResourceVersion(info.resource, info.version);
        }

        // Replay uniforms
        this.applyUniforms(frame.initialUniforms);

        // Apply state
        this.applyState(frame.initialState);
    };

    PlaybackContext.prototype.applyUniforms = function applyUniforms(uniformSets) {
        var gl = this.gl;

        for (var n = 0; n < uniformSets.length; n++) {
            var program = uniformSets[n].program;
            var values = uniformSets[n].values;

            var target = this.resourcePool.getTarget(program);
            gl.useProgram(target);

            for (var name in values) {
                var data = values[name];
                var loc = gl.getUniformLocation(target, name);

                var baseName = "uniform";
                var type;
                var size;
                switch (data.type) {
                    case gl.FLOAT:
                        type = "f";
                        size = 1;
                        break;
                    case gl.FLOAT_VEC2:
                    case gl.FLOAT_VEC3:
                    case gl.FLOAT_VEC4:
                        type = "f";
                        size = data.type - gl.FLOAT_VEC2 + 1;
                        break;
                    case gl.INT:
                        type = "i";
                        size = 1;
                        break;
                    case gl.INT_VEC2:
                    case gl.INT_VEC3:
                    case gl.INT_VEC4:
                        type = "i";
                        size = data.type - gl.INT_VEC2 + 1;
                        break;
                    case gl.BOOL:
                        type = "i";
                        size = 1;
                        break;
                    case gl.BOOL_VEC2:
                    case gl.BOOL_VEC3:
                    case gl.BOOL_VEC4:
                        type = "i";
                        size = data.type - gl.BOOL_VEC2 + 1;
                        break;
                    case gl.FLOAT_MAT2:
                    case gl.FLOAT_MAT3:
                    case gl.FLOAT_MAT4:
                        baseName += "Matrix";
                        type = "f";
                        size = data.type - gl.FLOAT_MAT2 + 1;
                        break;
                    case gl.SAMPLER_2D:
                    case gl.SAMPLER_CUBE:
                        type = "i";
                        size = 1;
                        break;
                }
                var funcName = baseName + size + type;
                if (data.value && data.value.length !== undefined) {
                    funcName += "v";
                }
                if (baseName.indexOf("Matrix") != -1) {
                    gl[funcName].apply(gl, [loc, false, data.value]);
                } else {
                    gl[funcName].apply(gl, [loc, data.value]);
                }
            }
        }
    };

    PlaybackContext.prototype.applyState = function applyState(state) {
        var gl = this.gl;

        gl.bindFramebuffer(gl.FRAMEBUFFER, getTargetValue(state["FRAMEBUFFER_BINDING"]));
        gl.bindRenderbuffer(gl.RENDERBUFFER, getTargetValue(state["RENDERBUFFER_BINDING"]));

        gl.viewport(state["VIEWPORT"][0], state["VIEWPORT"][1], state["VIEWPORT"][2], state["VIEWPORT"][3]);

        gl.clearColor(state["COLOR_CLEAR_VALUE"][0], state["COLOR_CLEAR_VALUE"][1], state["COLOR_CLEAR_VALUE"][2], state["COLOR_CLEAR_VALUE"][3]);
        gl.colorMask(state["COLOR_WRITEMASK"][0], state["COLOR_WRITEMASK"][1], state["COLOR_WRITEMASK"][2], state["COLOR_WRITEMASK"][3]);

        if (state["DEPTH_TEST"]) {
            gl.enable(gl.DEPTH_TEST);
        } else {
            gl.disable(gl.DEPTH_TEST);
        }
        gl.clearDepth(state["DEPTH_CLEAR_VALUE"]);
        gl.depthFunc(state["DEPTH_FUNC"]);
        gl.depthRange(state["DEPTH_RANGE"][0], state["DEPTH_RANGE"][1]);
        gl.depthMask(state["DEPTH_WRITEMASK"]);

        if (state["BLEND"]) {
            gl.enable(gl.BLEND);
        } else {
            gl.disable(gl.BLEND);
        }
        gl.blendColor(state["BLEND_COLOR"][0], state["BLEND_COLOR"][1], state["BLEND_COLOR"][2], state["BLEND_COLOR"][3]);
        gl.blendEquationSeparate(state["BLEND_EQUATION_RGB"], state["BLEND_EQUATION_ALPHA"]);
        gl.blendFuncSeparate(state["BLEND_SRC_RGB"], state["BLEND_DST_RGB"], state["BLEND_SRC_ALPHA"], state["BLEND_DST_ALPHA"]);

        //gl.DITHER, // ??????????????????????????????????????????????????????????

        if (state["CULL_FACE"]) {
            gl.enable(gl.CULL_FACE);
        } else {
            gl.disable(gl.CULL_FACE);
        }
        gl.cullFace(state["CULL_FACE_MODE"]);
        gl.frontFace(state["FRONT_FACE"]);

        gl.lineWidth(state["LINE_WIDTH"]);

        if (state["POLYGON_OFFSET_FILL"]) {
            gl.enable(gl.POLYGON_OFFSET_FILL);
        } else {
            gl.disable(gl.POLYGON_OFFSET_FILL);
        }
        gl.polygonOffset(state["POLYGON_OFFSET_FACTOR"], state["POLYGON_OFFSET_UNITS"]);

        if (state["SAMPLE_COVERAGE"]) {
            gl.enable(gl.SAMPLE_COVERAGE);
        } else {
            gl.disable(gl.SAMPLE_COVERAGE);
        }
        if (state["SAMPLE_ALPHA_TO_COVERAGE"]) {
            gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
        } else {
            gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
        }
        gl.sampleCoverage(state["SAMPLE_COVERAGE_VALUE"], state["SAMPLE_COVERAGE_INVERT"]);

        if (state["SCISSOR_TEST"]) {
            gl.enable(gl.SCISSOR_TEST);
        } else {
            gl.disable(gl.SCISSOR_TEST);
        }
        gl.scissor(state["SCISSOR_BOX"][0], state["SCISSOR_BOX"][1], state["SCISSOR_BOX"][2], state["SCISSOR_BOX"][3]);

        if (state["STENCIL_TEST"]) {
            gl.enable(gl.STENCIL_TEST);
        } else {
            gl.disable(gl.STENCIL_TEST);
        }
        gl.clearStencil(state["STENCIL_CLEAR_VALUE"]);
        gl.stencilFuncSeparate(gl.FRONT, state["STENCIL_FUNC"], state["STENCIL_REF"], state["STENCIL_VALUE_MASK"]);
        gl.stencilFuncSeparate(gl.BACK, state["STENCIL_BACK_FUNC"], state["STENCIL_BACK_REF"], state["STENCIL_BACK_VALUE_MASK"]);
        gl.stencilOpSeparate(gl.FRONT, state["STENCIL_FAIL"], state["STENCIL_PASS_DEPTH_FAIL"], state["STENCIL_PASS_DEPTH_PASS"]);
        gl.stencilOpSeparate(gl.BACK, state["STENCIL_BACK_FAIL"], state["STENCIL_BACK_PASS_DEPTH_FAIL"], state["STENCIL_BACK_PASS_DEPTH_PASS"]);
        gl.stencilMaskSeparate(state["STENCIL_WRITEMASK"], state["STENCIL_BACK_WRITEMASK"]);

        gl.hint(gl.GENERATE_MIPMAP_HINT, state["GENERATE_MIPMAP_HINT"]);

        gl.pixelStorei(gl.PACK_ALIGNMENT, state["PACK_ALIGNMENT"]);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, state["UNPACK_ALIGNMENT"]);
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, state["UNPACK_COLORSPACE_CONVERSION_WEBGL"]);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, state["UNPACK_FLIP_Y_WEBGL"]);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, state["UNPACK_PREMULTIPLY_ALPHA_WEBGL"]);

        gl.useProgram(getTargetValue(state["CURRENT_PROGRAM"]));

        var maxTextureUnits = state["MAX_COMBINED_TEXTURE_IMAGE_UNITS"];
        for (var n = 0; n < maxTextureUnits; n++) {
            gl.activeTexture(gl.TEXTURE0 + n);
            if (state["TEXTURE_BINDING_2D_" + n]) {
                gl.bindTexture(gl.TEXTURE_2D, getTargetValue(state["TEXTURE_BINDING_2D_" + n]));
            } else {
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, getTargetValue(state["TEXTURE_BINDING_CUBE_MAP_" + n]));
            }
        }
        gl.activeTexture(state["ACTIVE_TEXTURE"]);

        var maxVertexAttribs = state["MAX_VERTEX_ATTRIBS"];
        for (var n = 0; n < maxVertexAttribs; n++) {
            if (state["CURRENT_VERTEX_ATTRIB_" + n]) {
                gl.vertexAttrib4fv(n, state["CURRENT_VERTEX_ATTRIB_" + n]);
            }
            if (state["VERTEX_ATTRIB_ARRAY_ENABLED_" + n]) {
                gl.enableVertexAttribArray(n);
            } else {
                gl.disableVertexAttribArray(n);
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, getTargetValue(state["VERTEX_ATTRIB_ARRAY_BUFFER_BINDING_" + n]));
            gl.vertexAttribPointer(n,
                state["VERTEX_ATTRIB_ARRAY_SIZE_" + n],
                state["VERTEX_ATTRIB_ARRAY_TYPE_" + n],
                state["VERTEX_ATTRIB_ARRAY_NORMALIZED_" + n],
                state["VERTEX_ATTRIB_ARRAY_STRIDE_" + n],
                state["VERTEX_ATTRIB_ARRAY_POINTER_" + n]
            );
        }
        gl.bindBuffer(gl.ARRAY_BUFFER, getTargetValue(state["ARRAY_BUFFER_BINDING"]));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, getTargetValue(state["ELEMENT_ARRAY_BUFFER_BINDING"]));
    };

    PlaybackContext.prototype.seek = function seek(callIndex) {
        if (this.callIndex === callIndex) {
            return;
        }

        // Resetting frame
        if (callIndex === null) {
            this.callIndex = callIndex;
            this.resetFrame();
            this.beginStepping();
            this.endStepping();
            return;
        }

        // First seek in frame, always forward
        if (this.callIndex === null) {
            this.run(callIndex);
            return;
        }

        // Seeking forward
        if (callIndex > this.callIndex) {
            this.run(callIndex);
            return;
        }

        // Seeking backward
        if (callIndex < this.callIndex) {
            this.callIndex = null;
            this.resetFrame();
            this.run(callIndex);
            return;
        }
    };

    PlaybackContext.prototype.step = function step(direction) {
        if (this.callIndex === null) {
            if (direction > 0) {
                this.seek(0);
            } else {
                this.seek(this.frame.calls.length - 1);
            }
        } else {
            var newIndex = this.callIndex + direction;
            if (newIndex < 0) {
                newIndex = this.frame.calls.length;
            } else if (newIndex >= this.frame.calls.length) {
                newIndex = null;
            }
            this.seek(newIndex);
        }
    };

    PlaybackContext.prototype.run = function run(untilCallIndex) {
        if (untilCallIndex === undefined) {
            untilCallIndex = this.frame.calls.length - 1;
        }
        this.beginStepping();
        while (this.callIndex <= untilCallIndex) {
            this.issueCall();
            if (this.callIndex === untilCallIndex) {
                break;
            }
            this.callIndex++;
        }
        this.endStepping();
    };

    PlaybackContext.prototype.runUntilDraw = function runUntilDraw() {
        this.beginStepping();
        while (this.callIndex < this.frame.calls.length) {
            var call = this.frame.calls[this.callIndex];
            var isDraw = false;
            switch (call.name) {
                case "drawArrays":
                case "drawElements":
                    isDraw = true;
                    break;
            }
            this.issueCall();
            if (isDraw) {
                break;
            }
            this.callIndex++;
        }
        this.endStepping();
    };

    PlaybackContext.prototype.issueCall = function issueCall() {
        var call = this.frame.calls[this.callIndex];

        for (var n = 0; n < this.preCallHandlers.length; n++) {
            var handler = this.preCallhandlers[n];
            call = handler(call);
        }

        console.log("would issue call " + this.callIndex);

        for (var n = this.postCallHandlers.length - 1; n >= 0; n--) {
            var handler = this.postCallHandlers[n];
            handler(call);
        }
    };

    playback.PlaybackContext = PlaybackContext;

})();
