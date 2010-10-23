(function () {

    var StateCapture = function (gl) {
        this.gl = gl;

        var stateParameters = gli.info.stateParameters;
        for (var n = 0; n < stateParameters.length; n++) {
            var param = stateParameters[n];
            var value = param.getter(gl);
            this[param.value ? param.value : param.name] = value;
        }
    };
    StateCapture.prototype.clone = function () {
        var cloned = {};
        for (var k in this) {
            cloned[k] = this[k];
        }
        return cloned;
    };
    StateCapture.prototype.apply = function () {
        var gl = this.gl;

        gl.bindFramebuffer(gl.FRAMEBUFFER, this[gl.FRAMEBUFFER_BINDING]);
        gl.bindRenderbuffer(gl.RENDERBUFFER, this[gl.RENDERBUFFER_BINDING]);

        gl.viewport(this[gl.VIEWPORT][0], this[gl.VIEWPORT][1], this[gl.VIEWPORT][2], this[gl.VIEWPORT][3]);

        var maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
        for (var n = 0; n < maxTextureUnits; n++) {
            gl.activeTexture(gl.TEXTURE0 + n);
            if (this["TEXTURE_BINDING_2D_" + n]) {
                gl.bindTexture(gl.TEXTURE_2D, this["TEXTURE_BINDING_2D_" + n]);
            } else {
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, this["TEXTURE_BINDING_CUBE_MAP_" + n]);
            }
        }

        gl.activeTexture(this[gl.ACTIVE_TEXTURE]);

        gl.clearColor(this[gl.COLOR_CLEAR_VALUE][0], this[gl.COLOR_CLEAR_VALUE][1], this[gl.COLOR_CLEAR_VALUE][2], this[gl.COLOR_CLEAR_VALUE][3]);
        gl.colorMask(this[gl.COLOR_WRITEMASK][0], this[gl.COLOR_WRITEMASK][1], this[gl.COLOR_WRITEMASK][2], this[gl.COLOR_WRITEMASK][3]);

        if (this[gl.DEPTH_TEST]) {
            gl.enable(gl.DEPTH_TEST);
        } else {
            gl.disable(gl.DEPTH_TEST);
        }
        gl.clearDepth(this[gl.DEPTH_CLEAR_VALUE]);
        gl.depthFunc(this[gl.DEPTH_FUNC]);
        gl.depthRange(this[gl.DEPTH_RANGE][0], this[gl.DEPTH_RANGE][1]);
        gl.depthMask(this[gl.DEPTH_WRITEMASK]);

        if (this[gl.BLEND]) {
            gl.enable(gl.BLEND);
        } else {
            gl.disable(gl.BLEND);
        }
        gl.blendColor(this[gl.BLEND_COLOR][0], this[gl.BLEND_COLOR][1], this[gl.BLEND_COLOR][2], this[gl.BLEND_COLOR][3]);
        gl.blendEquationSeparate(this[gl.BLEND_EQUATION_RGB], this[gl.BLEND_EQUATION_ALPHA]);
        gl.blendFuncSeparate(this[gl.BLEND_SRC_RGB], this[gl.BLEND_DST_RGB], this[gl.BLEND_SRC_ALPHA], this[gl.BLEND_DST_ALPHA]);

        //gl.DITHER, // ??????????????????????????????????????????????????????????

        if (this[gl.CULL_FACE]) {
            gl.enable(gl.CULL_FACE);
        } else {
            gl.disable(gl.CULL_FACE);
        }
        gl.cullFace(this[gl.CULL_FACE_MODE]);
        gl.frontFace(this[gl.FRONT_FACE]);

        gl.lineWidth(this[gl.LINE_WIDTH]);

        if (this[gl.POLYGON_OFFSET_FILL]) {
            gl.enable(gl.POLYGON_OFFSET_FILL);
        } else {
            gl.disable(gl.POLYGON_OFFSET_FILL);
        }
        gl.polygonOffset(this[gl.POLYGON_OFFSET_FACTOR], this[gl.POLYGON_OFFSET_UNITS]);

        if (this[gl.SAMPLE_COVERAGE]) {
            gl.enable(gl.SAMPLE_COVERAGE);
        } else {
            gl.disable(gl.SAMPLE_COVERAGE);
        }
        if (this[gl.SAMPLE_ALPHA_TO_COVERAGE]) {
            gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
        } else {
            gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
        }
        gl.sampleCoverage(this[gl.SAMPLE_COVERAGE_VALUE], this[gl.SAMPLE_COVERAGE_INVERT]);

        if (this[gl.SCISSOR_TEST]) {
            gl.enable(gl.SCISSOR_TEST);
        } else {
            gl.disable(gl.SCISSOR_TEST);
        }
        gl.scissor(this[gl.SCISSOR_BOX][0], this[gl.SCISSOR_BOX][1], this[gl.SCISSOR_BOX][2], this[gl.SCISSOR_BOX][3]);

        if (this[gl.STENCIL_TEST]) {
            gl.enable(gl.STENCIL_TEST);
        } else {
            gl.disable(gl.STENCIL_TEST);
        }
        gl.clearStencil(this[gl.STENCIL_CLEAR_VALUE]);
        gl.stencilFuncSeparate(gl.FRONT, this[gl.STENCIL_FUNC], this[gl.STENCIL_REF], this[gl.STENCIL_VALUE_MASK]);
        gl.stencilFuncSeparate(gl.FRONT, this[gl.STENCIL_BACK_FUNC], this[gl.STENCIL_BACK_REF], this[gl.STENCIL_VALUE_BACK_MASK]);
        gl.stencilOpSeparate(gl.FRONT, this[gl.STENCIL_FAIL], this[gl.STENCIL_PASS_DEPTH_FAIL], this[gl.STENCIL_PASS_DEPTH_PASS]);
        gl.stencilOpSeparate(gl.BACK, this[gl.STENCIL_BACK_FAIL], this[gl.STENCIL_BACK_PASS_DEPTH_FAIL], this[gl.STENCIL_BACK_PASS_DEPTH_PASS]);
        gl.stencilMaskSeparate(this[gl.STENCIL_WRITEMASK], this[gl.STENCIL_BACK_WRITEMASK]);

        gl.hint(gl.GENERATE_MIPMAP_HINT, this[gl.GENERATE_MIPMAP_HINT]);

        gl.pixelStorei(gl.PACK_ALIGNMENT, this[gl.PACK_ALIGNMENT]);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, this[gl.UNPACK_ALIGNMENT]);
        //gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, this[gl.UNPACK_COLORSPACE_CONVERSION_WEBGL]); ////////////////////// NOT YET SUPPORTED IN SOME BROWSERS
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, this[gl.UNPACK_FLIP_Y_WEBGL]);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this[gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL]);

        gl.bindBuffer(gl.ARRAY_BUFFER, this[gl.ARRAY_BUFFER_BINDING]);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this[gl.ELEMENT_ARRAY_BUFFER_BINDING]);

        gl.useProgram(this[gl.CURRENT_PROGRAM]);
    };

    var Frame = function (gl, frameNumber) {
        this.gl = gl;
        this.frameNumber = frameNumber;
        this.initialState = new StateCapture(gl);
        this.finalState = null;

        // TODO: preallocate better/etc
        this.calls = [];
    };
    Frame.prototype.end = function () {
        this.finalState = new StateCapture(gl);
    };
    Frame.prototype.allocateCall = function (info) {
        var call = new Call(info);
        this.calls.push(call);
        return call;
    };

    var Call = function (info) {
        this.time = (new Date()).getTime();
        this.duration = 0;

        this.info = info;
        this.args = [];
        this.result = null;
    };
    Call.prototype.complete = function (result) {
        this.duration = (new Date()).getTime() - this.time;
        this.result = result;
    };

    function generateRecordFunction(stream, context, functionName, realFunction) {
        return function (args) {
            var call = stream.currentFrame.allocateCall(gli.info.functions[functionName]);
            call.args.length = args.length;

            for (var n = 0; n < args.length; n++) {
                // TODO: inspect type/etc?
                call.args[n] = args[n];

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

            return call;
        };
    };

    function generateReplayFunction(stream, context, functionName, realFunction) {
        return function (call) {
            realFunction.apply(context.innerContext, call.args);
        };
    };

    function setupResourceCaptures(stream, context, resourceCaptures) {

        // Calls to these functions will have one arg (just 'args') or two ('args' plus the 'result')
        // If one arg it's before the call was made and if two args it's after

        // Framebuffers
        //resourceCaptures[""] = function (args, result) {
        //};

        // Renderbuffers
        //resourceCaptures[""] = function (args, result) {
        //};

        // Programs
        resourceCaptures["createProgram"] = function (args, result) {
            if (arguments.length == 1) {
            } else {
                // result = new WebGLProgram
            }
        };
        resourceCaptures["deleteProgram"] = function (args, result) {
            // args[0] = program
            if (arguments.length == 1) {
            } else {
            }
        };
        resourceCaptures["attachShader"] = function (args, result) {
            // args[0] = program
            // args[1] = shader
            if (arguments.length == 1) {
            } else {
            }
        };
        resourceCaptures["detachShader"] = function (args, result) {
            // args[0] = program
            // args[1] = shader
            if (arguments.length == 1) {
            } else {
            }
        };
        resourceCaptures["linkProgram"] = function (args, result) {
            // args[0] = program
            if (arguments.length == 1) {
            } else {
            }
        };

        // Shaders
        resourceCaptures["createShader"] = function (args, result) {
            // (GLenum type)
            if (arguments.length == 1) {
            } else {
                // result = new WebGLShader
            }
        };
        resourceCaptures["deleteShader"] = function (args, result) {
            // args[0] = shader
            if (arguments.length == 1) {
            } else {
            }
        };
        resourceCaptures["compileShader"] = function (args, result) {
            // args[0] = shader
            if (arguments.length == 1) {
            } else {
            }
        };
        resourceCaptures["shaderSource"] = function (args, result) {
            // args[0] = shader
            // args[1] = source
            if (arguments.length == 1) {
            } else {
            }
        };

        // Textures
        // TODO: copyTexImage2D
        // TODO: copyTexSubImage2D
        resourceCaptures["createTexture"] = function (args, result) {
            if (arguments.length == 1) {
            } else {
                // result = new WebGLTexture
            }
        };
        resourceCaptures["deleteTexture"] = function (args, result) {
            // args[0] = texture
            if (arguments.length == 1) {
            } else {
            }
        };
        resourceCaptures["generateMipmap"] = function (args, result) {
            // (GLenum target)
            if (arguments.length == 1) {
            } else {
            }
        };
        resourceCaptures["texImage2D"] = function (args, result) {
            // (GLenum target, GLint level, GLenum internalformat, GLsizei width, GLsizei height, GLint border, GLenum format, GLenum type, ArrayBufferView pixels)
            // (GLenum target, GLint level, GLenum internalformat, GLenum format, GLenum type, ImageData pixels)
            // (GLenum target, GLint level, GLenum internalformat, GLenum format, GLenum type, HTMLImageElement image)
            // (GLenum target, GLint level, GLenum internalformat, GLenum format, GLenum type, HTMLCanvasElement canvas)
            // (GLenum target, GLint level, GLenum internalformat, GLenum format, GLenum type, HTMLVideoElement video)
            if (arguments.length == 1) {
            } else {
            }
        };
        resourceCaptures["texSubImage2D"] = function (args, result) {
            // (GLenum target, GLint level, GLint xoffset, GLint yoffset, GLsizei width, GLsizei height, GLenum format, GLenum type, ArrayBufferView pixels)
            // (GLenum target, GLint level, GLint xoffset, GLint yoffset, GLenum format, GLenum type, ImageData pixels)
            // (GLenum target, GLint level, GLint xoffset, GLint yoffset, GLenum format, GLenum type, HTMLImageElement image)
            // (GLenum target, GLint level, GLint xoffset, GLint yoffset, GLenum format, GLenum type, HTMLCanvasElement canvas)
            // (GLenum target, GLint level, GLint xoffset, GLint yoffset, GLenum format, GLenum type, HTMLVideoElement video)
            if (arguments.length == 1) {
            } else {
            }
        };

        // Buffers
        resourceCaptures["createBuffer"] = function (args, result) {
            if (arguments.length == 1) {
            } else {
                // result = new WebGLBuffer
            }
        };
        resourceCaptures["deleteBuffer"] = function (args, result) {
            // args[0] = buffer
            if (arguments.length == 1) {
            } else {
            }
        };
        resourceCaptures["bufferData"] = function (args, result) {
            // (GLenum target, GLsizei size, GLenum usage)
            // (GLenum target, ArrayBufferView data, GLenum usage)
            // (GLenum target, ArrayBuffer data, GLenum usage)
            if (arguments.length == 1) {
            } else {
            }
        };
        resourceCaptures["bufferSubData"] = function (args, result) {
            // (GLenum target, GLsizeiptr offset, ArrayBufferView data)
            // (GLenum target, GLsizeiptr offset, ArrayBuffer data)
            if (arguments.length == 1) {
            } else {
            }
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

        this.frames = [];
        this.currentFrame = null;

        this.objects = {
            '[object WebGLTexture]': new TypeStore(),
            '[object WebGLProgram]': new TypeStore(),
            '[object WebGLShader]': new TypeStore(),
            '[object WebGLFramebuffer]': new TypeStore(),
            '[object WebGLRenderbuffer]': new TypeStore(),
            '[object WebGLBuffer]': new TypeStore()
        };

        this.resourceCaptures = {};
        this.recorders = {};
        this.replayers = {};

        // For each function in the inner context generate our custom thunks (record/playback)
        for (var propertyName in context.innerContext) {
            if (typeof context.innerContext[propertyName] == 'function') {
                this.recorders[propertyName] = generateRecordFunction(this, context, propertyName, context.innerContext[propertyName]);
                this.replayers[propertyName] = generateReplayFunction(this, context, propertyName, context.innerContext[propertyName]);
            }
        }

        // Specific resource capture routines
        setupResourceCaptures(this, context, this.resourceCaptures);
    };

    Stream.prototype.reset = function () {
        // TODO: other?
        for (var category in this.objects) {
            this.objects[category].reset();
        }
        this.frames.length = 0;
        this.currentFrame = null;
    };

    Stream.prototype.markFrame = function (frameNumber) {
        if (this.currentFrame) {
            // Close the previous frame
            this.currentFrame.end();
            this.currentFrame = null;
        }

        if (frameNumber == null) {
            // Abort if not a real frame
            return;
        }

        var frame = new Frame(this.context.innerContext, frameNumber);
        this.frames.push(frame);
        this.currentFrame = frame;

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
