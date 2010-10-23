(function () {

    function captureState(stream, context) {
        var gl = context.innerContext;
        var stateParameters = gli.info.stateParameters;

        var state = {};

        for (var n = 0; n < stateParameters.length; n++) {
            var param = stateParameters[n];
            var value = param.getter(gl);
            state[param.value ? param.value : param.name] = value;
        }

        return state;
    };

    function applyState(stream, context, state) {
        var gl = context.innerContext;

        gl.bindFramebuffer(gl.FRAMEBUFFER, state[gl.FRAMEBUFFER_BINDING]);
        gl.bindRenderbuffer(gl.RENDERBUFFER, state[gl.RENDERBUFFER_BINDING]);

        gl.viewport(state[gl.VIEWPORT][0], state[gl.VIEWPORT][1], state[gl.VIEWPORT][2], state[gl.VIEWPORT][3]);

        var maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
        for (var n = 0; n < maxTextureUnits; n++) {
            gl.activeTexture(gl.TEXTURE0 + n);
            if (state["TEXTURE_BINDING_2D_" + n]) {
                gl.bindTexture(gl.TEXTURE_2D, state["TEXTURE_BINDING_2D_" + n]);
            } else {
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, state["TEXTURE_BINDING_CUBE_MAP_" + n]);
            }
        }

        gl.activeTexture(state[gl.ACTIVE_TEXTURE]);

        gl.clearColor(state[gl.COLOR_CLEAR_VALUE][0], state[gl.COLOR_CLEAR_VALUE][1], state[gl.COLOR_CLEAR_VALUE][2], state[gl.COLOR_CLEAR_VALUE][3]);
        gl.colorMask(state[gl.COLOR_WRITEMASK][0], state[gl.COLOR_WRITEMASK][1], state[gl.COLOR_WRITEMASK][2], state[gl.COLOR_WRITEMASK][3]);

        if (state[gl.DEPTH_TEST]) {
            gl.enable(gl.DEPTH_TEST);
        } else {
            gl.disable(gl.DEPTH_TEST);
        }
        gl.clearDepth(state[gl.DEPTH_CLEAR_VALUE]);
        gl.depthFunc(state[gl.DEPTH_FUNC]);
        gl.depthRange(state[gl.DEPTH_RANGE][0], state[gl.DEPTH_RANGE][1]);
        gl.depthMask(state[gl.DEPTH_WRITEMASK]);

        if (state[gl.BLEND]) {
            gl.enable(gl.BLEND);
        } else {
            gl.disable(gl.BLEND);
        }
        gl.blendColor(state[gl.BLEND_COLOR][0], state[gl.BLEND_COLOR][1], state[gl.BLEND_COLOR][2], state[gl.BLEND_COLOR][3]);
        gl.blendEquationSeparate(state[gl.BLEND_EQUATION_RGB], state[gl.BLEND_EQUATION_ALPHA]);
        gl.blendFuncSeparate(state[gl.BLEND_SRC_RGB], state[gl.BLEND_DST_RGB], state[gl.BLEND_SRC_ALPHA], state[gl.BLEND_DST_ALPHA]);

        //gl.DITHER, // ??????????????????????????????????????????????????????????

        if (state[gl.CULL_FACE]) {
            gl.enable(gl.CULL_FACE);
        } else {
            gl.disable(gl.CULL_FACE);
        }
        gl.cullFace(state[gl.CULL_FACE_MODE]);
        gl.frontFace(state[gl.FRONT_FACE]);

        gl.lineWidth(state[gl.LINE_WIDTH]);

        if (state[gl.POLYGON_OFFSET_FILL]) {
            gl.enable(gl.POLYGON_OFFSET_FILL);
        } else {
            gl.disable(gl.POLYGON_OFFSET_FILL);
        }
        gl.polygonOffset(state[gl.POLYGON_OFFSET_FACTOR], state[gl.POLYGON_OFFSET_UNITS]);

        if (state[gl.SAMPLE_COVERAGE]) {
            gl.enable(gl.SAMPLE_COVERAGE);
        } else {
            gl.disable(gl.SAMPLE_COVERAGE);
        }
        if (state[gl.SAMPLE_ALPHA_TO_COVERAGE]) {
            gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
        } else {
            gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
        }
        gl.sampleCoverage(state[gl.SAMPLE_COVERAGE_VALUE], state[gl.SAMPLE_COVERAGE_INVERT]);

        if (state[gl.SCISSOR_TEST]) {
            gl.enable(gl.SCISSOR_TEST);
        } else {
            gl.disable(gl.SCISSOR_TEST);
        }
        gl.scissor(state[gl.SCISSOR_BOX][0], state[gl.SCISSOR_BOX][1], state[gl.SCISSOR_BOX][2], state[gl.SCISSOR_BOX][3]);

        if (state[gl.STENCIL_TEST]) {
            gl.enable(gl.STENCIL_TEST);
        } else {
            gl.disable(gl.STENCIL_TEST);
        }
        gl.clearStencil(state[gl.STENCIL_CLEAR_VALUE]);
        gl.stencilFuncSeparate(gl.FRONT, state[gl.STENCIL_FUNC], state[gl.STENCIL_REF], state[gl.STENCIL_VALUE_MASK]);
        gl.stencilFuncSeparate(gl.FRONT, state[gl.STENCIL_BACK_FUNC], state[gl.STENCIL_BACK_REF], state[gl.STENCIL_VALUE_BACK_MASK]);
        gl.stencilOpSeparate(gl.FRONT, state[gl.STENCIL_FAIL], state[gl.STENCIL_PASS_DEPTH_FAIL], state[gl.STENCIL_PASS_DEPTH_PASS]);
        gl.stencilOpSeparate(gl.BACK, state[gl.STENCIL_BACK_FAIL], state[gl.STENCIL_BACK_PASS_DEPTH_FAIL], state[gl.STENCIL_BACK_PASS_DEPTH_PASS]);
        gl.stencilMaskSeparate(state[gl.STENCIL_WRITEMASK], state[gl.STENCIL_BACK_WRITEMASK]);

        gl.hint(gl.GENERATE_MIPMAP_HINT, state[gl.GENERATE_MIPMAP_HINT]);

        gl.pixelStorei(gl.PACK_ALIGNMENT, state[gl.PACK_ALIGNMENT]);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, state[gl.UNPACK_ALIGNMENT]);
        //gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, state[gl.UNPACK_COLORSPACE_CONVERSION_WEBGL]); ////////////////////// NOT YET SUPPORTED IN SOME BROWSERS
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, state[gl.UNPACK_FLIP_Y_WEBGL]);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, state[gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL]);

        gl.bindBuffer(gl.ARRAY_BUFFER, state[gl.ARRAY_BUFFER_BINDING]);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, state[gl.ELEMENT_ARRAY_BUFFER_BINDING]);

        gl.useProgram(state[gl.CURRENT_PROGRAM]);
    }

    var CommandType = {
        FRAME: 0,
        CALL: 1
    };

    function allocateCommand(stream) {
        var command = {
            time: (new Date()).getTime(),
            duration: 0,
            type: 0,
            info: null,
            args: []
        };
        stream.commands.push(command);
        return command;
    };

    function generateRecordFunction(stream, context, functionName, realFunction) {
        return function (args) {
            var command = allocateCommand(stream);
            command.type = CommandType.CALL;
            command.info = gli.info.functions[functionName];
            command.args.length = args.length;

            for (var n = 0; n < args.length; n++) {
                // TODO: inspect type/etc?
                command.args[n] = args[n];

                var type = typeof args[n];
                if (type == "object") {
                    var name = args[n].toString();
                    var typeStore = stream.objects[name];
                    if (typeStore) {
                        typeStore.registerAndCapture(args[n], context.frameNumber);

                        // If method is a write, then mark object as dirtied
                        // TODO: dirtying of objects
                    }
                }
            }

            return command;
        };
    };

    function generateReplayFunction(stream, context, functionName, realFunction) {
        return function (command) {
            realFunction.apply(context.innerContext, command.args);
        };
    };

    var TypeStore = function () {
        this.uniqueId = 1;
        this.values = {};
    };
    TypeStore.prototype.registerAndCapture = function (value, frameNumber) {
        if (!value.__typeId) {
            value.__typeId = this.uniqueId++;
            value.__frameToken = frameNumber;
            value.__frameInitialValue = null;
            this.values[value.__typeId] = value;
        } else {
            if (value.__frameToken != frameNumber) {
                // First use this frame - capture the initial data so we can replay
                value.__frameToken = frameNumber;

                // TODO: capture based on type
                value.__frameInitialValue = {};
            }
        }
    };
    TypeStore.prototype.reset = function () {
        for (var n in this.values) {
            this.values[n].__frameInitialValue = null;
        }
        this.values = {};
    };
    TypeStore.prototype.restoreInitialValues = function () {
        for (var n in this.values) {
            if (this.values[n].__frameInitialValue) {
                // TODO: restore if initial value based on type
                console.log("would restore");
            }
        }
    };

    var Stream = function (context) {
        this.context = context;

        // TODO: optimized buffer? prevent resizes each add?
        this.commands = [];

        this.objects = {
            '[object WebGLTexture]': new TypeStore(),
            '[object WebGLProgram]': new TypeStore(),
            '[object WebGLShader]': new TypeStore(),
            '[object WebGLFramebuffer]': new TypeStore(),
            '[object WebGLRenderbuffer]': new TypeStore(),
            '[object WebGLBuffer]': new TypeStore()
        };

        this.recorders = {};
        this.replayers = {};

        // For each function in the inner context generate our custom thunks (record/playback)
        for (var propertyName in context.innerContext) {
            if (typeof context.innerContext[propertyName] == 'function') {
                this.recorders[propertyName] = generateRecordFunction(this, context, propertyName, context.innerContext[propertyName]);
                this.replayers[propertyName] = generateReplayFunction(this, context, propertyName, context.innerContext[propertyName]);
            }
        }
    };

    Stream.prototype.reset = function () {
        // TODO: other?
        for (var category in this.objects) {
            this.objects[category].reset();
        }
        this.commands.length = 0;
    };

    Stream.prototype.markFrame = function (frameNumber) {
        var command = allocateCommand(this);
        command.type = CommandType.FRAME;
        command.args.length = 2;
        command.args[0] = frameNumber;
        command.args[1] = captureState(this, this.context);

        // For all default bound objects, register
        var gl = this.context.innerContext;
        var value;
        value = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
        if (value) {
            this.objects['[object WebGLBuffer]'].registerAndCapture(value, this.context.frameNumber);
        }
        value = gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING);
        if (value) {
            this.objects['[object WebGLBuffer]'].registerAndCapture(value, this.context.frameNumber);
        }
        value = gl.getParameter(gl.FRAMEBUFFER_BINDING);
        if (value) {
            this.objects['[object WebGLFramebuffer]'].registerAndCapture(value, this.context.frameNumber);
        }
        value = gl.getParameter(gl.RENDERBUFFER_BINDING);
        if (value) {
            this.objects['[object WebGLRenderbuffer]'].registerAndCapture(value, this.context.frameNumber);
        }
        var maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
        for (var n = 0; n < maxTextureUnits; n++) {
            gl.activeTexture(n);
            value = gl.getParameter(gl.TEXTURE_BINDING_2D);
            if (value) {
                this.objects['[object WebGLTexture]'].registerAndCapture(value, this.context.frameNumber);
            }
            value = gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP);
            if (value) {
                this.objects['[object WebGLTexture]'].registerAndCapture(value, this.context.frameNumber);
            }
        }
        value = gl.getParameter(gl.CURRENT_PROGRAM);
        if (value) {
            this.objects['[object WebGLProgram]'].registerAndCapture(value, this.context.frameNumber);
        }
    };

    Stream.prototype.preparePlayback = function () {
        // Restore all objects to their initial values
        //        for (var category in stream.objects) {
        //            stream.objects[category].restoreInitialValues();
        //        }
    }

    gli.Stream = Stream;
})();
