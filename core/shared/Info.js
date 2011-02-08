(function () {
    var gli = glinamespace("gli");
    var info = glinamespace("gli.info");

    var UIType = {
        ENUM: 0, // a specific enum
        ARRAY: 1, // array of values (tightly packed)
        BOOL: 2,
        LONG: 3,
        ULONG: 4,
        COLORMASK: 5, // 4 bools
        OBJECT: 6, // some WebGL object (texture/program/etc)
        WH: 7, // width x height (array with 2 values)
        RECT: 8, // x, y, w, h (array with 4 values)
        STRING: 9, // some arbitrary string
        COLOR: 10, // 4 floats
        FLOAT: 11,
        BITMASK: 12, // 32bit boolean mask
        RANGE: 13, // 2 floats
        MATRIX: 14 // 2x2, 3x3, or 4x4 matrix
    };

    var UIInfo = function (type, values) {
        this.type = type;
        this.values = values;
    };

    var FunctionType = {
        GENERIC: 0,
        DRAW: 1
    };

    var FunctionInfo = function (staticgl, name, returnType, args, type) {
        this.name = name;
        this.returnType = returnType;
        this.args = args;
        this.type = type;
    };
    FunctionInfo.prototype.getArgs = function (call) {
        return this.args;
    };

    var FunctionParam = function (staticgl, name, ui) {
        this.name = name;
        this.ui = ui;
    };

    function setupFunctionInfos(gl) {
        if (info.functions) {
            return;
        }

        var functionInfos = [
            new FunctionInfo(gl, "activeTexture", null, [
                new FunctionParam(gl, "texture", new UIInfo(UIType.ENUM, ["TEXTURE0", "TEXTURE1", "TEXTURE2", "TEXTURE3", "TEXTURE4", "TEXTURE5", "TEXTURE6", "TEXTURE7", "TEXTURE8", "TEXTURE9", "TEXTURE10", "TEXTURE11", "TEXTURE12", "TEXTURE13", "TEXTURE14", "TEXTURE15", "TEXTURE16", "TEXTURE17", "TEXTURE18", "TEXTURE19", "TEXTURE20", "TEXTURE21", "TEXTURE22", "TEXTURE23", "TEXTURE24", "TEXTURE25", "TEXTURE26", "TEXTURE27", "TEXTURE28", "TEXTURE29", "TEXTURE30", "TEXTURE31"]))
            ]),
            new FunctionInfo(gl, "attachShader", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "bindAttribLocation", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "index", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "name", new UIInfo(UIType.STRING))
            ]),
            new FunctionInfo(gl, "bindBuffer", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["ARRAY_BUFFER", "ELEMENT_ARRAY_BUFFER"])),
                new FunctionParam(gl, "buffer", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "bindFramebuffer", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["FRAMEBUFFER"])),
                new FunctionParam(gl, "framebuffer", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "bindRenderbuffer", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["RENDERBUFFER"])),
                new FunctionParam(gl, "renderbuffer", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "bindTexture", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP"])),
                new FunctionParam(gl, "texture", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "blendColor", null, new UIInfo(UIType.COLOR)),
            new FunctionInfo(gl, "blendEquation", null, [
                new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, ["FUNC_ADD", "FUNC_SUBTRACT", "FUNC_REVERSE_SUBTRACT"]))
            ]),
            new FunctionInfo(gl, "blendEquationSeparate", null, [
                new FunctionParam(gl, "modeRGB", new UIInfo(UIType.ENUM, ["FUNC_ADD", "FUNC_SUBTRACT", "FUNC_REVERSE_SUBTRACT"])),
                new FunctionParam(gl, "modeAlpha", new UIInfo(UIType.ENUM, ["FUNC_ADD", "FUNC_SUBTRACT", "FUNC_REVERSE_SUBTRACT"]))
            ]),
            new FunctionInfo(gl, "blendFunc", null, [
                new FunctionParam(gl, "sfactor", new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA", "CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA", "SRC_ALPHA_SATURATE"])),
                new FunctionParam(gl, "dfactor", new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA. GL_CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA"]))
            ]),
            new FunctionInfo(gl, "blendFuncSeparate", null, [
                new FunctionParam(gl, "srcRGB", new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA", "CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA", "SRC_ALPHA_SATURATE"])),
                new FunctionParam(gl, "dstRGB", new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA. GL_CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA"])),
                new FunctionParam(gl, "srcAlpha", new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA", "CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA", "SRC_ALPHA_SATURATE"])),
                new FunctionParam(gl, "dstAlpha", new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA. GL_CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA"]))
            ]),
            new FunctionInfo(gl, "bufferData", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["ARRAY_BUFFER", "ELEMENT_ARRAY_BUFFER"])),
                new FunctionParam(gl, "sizeOrData", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "usage", new UIInfo(UIType.ENUM, ["STREAM_DRAW", "STATIC_DRAW", "DYNAMIC_DRAW"]))
            ]),
            new FunctionInfo(gl, "bufferSubData", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["ARRAY_BUFFER", "ELEMENT_ARRAY_BUFFER"])),
                new FunctionParam(gl, "offset", new UIInfo(UIType.ULONG)),
                new FunctionParam(gl, "data", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "checkFramebufferStatus", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["FRAMEBUFFER"]))
            ]),
            new FunctionInfo(gl, "clear", null, [
                new FunctionParam(gl, "mask", new UIInfo(UIType.BITMASK, ["COLOR_BUFFER_BIT", "DEPTH_BUFFER_BIT", "STENCIL_BUFFER_BIT"]))
            ]),
            new FunctionInfo(gl, "clearColor", null, new UIInfo(UIType.COLOR)),
            new FunctionInfo(gl, "clearDepth", null, [
                new FunctionParam(gl, "depth", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "clearStencil", null, [
                new FunctionParam(gl, "s", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "colorMask", null, new UIInfo(UIType.COLORMASK)),
            new FunctionInfo(gl, "compileShader", null, [
                new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "copyTexImage2D", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP_POSITIVE_X", "TEXTURE_CUBE_MAP_NEGATIVE_X", "TEXTURE_CUBE_MAP_POSITIVE_Y", "TEXTURE_CUBE_MAP_NEGATIVE_Y", "TEXTURE_CUBE_MAP_POSITIVE_Z", "TEXTURE_CUBE_MAP_NEGATIVE_Z"])),
                new FunctionParam(gl, "level", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "internalformat", new UIInfo(UIType.ENUM, ["ALPHA", "LUMINANCE", "LUMINANCE_ALPHA", "RGB", "RGBA"])),
                new FunctionParam(gl, "x", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "y", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "width", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "height", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "border", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "copyTexSubImage2D", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP_POSITIVE_X", "TEXTURE_CUBE_MAP_NEGATIVE_X", "TEXTURE_CUBE_MAP_POSITIVE_Y", "TEXTURE_CUBE_MAP_NEGATIVE_Y", "TEXTURE_CUBE_MAP_POSITIVE_Z", "TEXTURE_CUBE_MAP_NEGATIVE_Z"])),
                new FunctionParam(gl, "level", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "xoffset", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "yoffset", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "x", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "y", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "width", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "height", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "createBuffer", null, [
            ]),
            new FunctionInfo(gl, "createFramebuffer", null, [
            ]),
            new FunctionInfo(gl, "createProgram", null, [
            ]),
            new FunctionInfo(gl, "createRenderbuffer", null, [
            ]),
            new FunctionInfo(gl, "createShader", null, [
                new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, ["VERTEX_SHADER", "FRAGMENT_SHADER"]))
            ]),
            new FunctionInfo(gl, "createTexture", null, [
            ]),
            new FunctionInfo(gl, "cullFace", null, [
                new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, ["FRONT", "BACK", "FRONT_AND_BACK"]))
            ]),
            new FunctionInfo(gl, "deleteBuffer", null, [
                new FunctionParam(gl, "buffer", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "deleteFramebuffer", null, [
                new FunctionParam(gl, "framebuffer", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "deleteProgram", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "deleteRenderbuffer", null, [
                new FunctionParam(gl, "renderbuffer", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "deleteShader", null, [
                new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "deleteTexture", null, [
                new FunctionParam(gl, "texture", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "depthFunc", null, [
                new FunctionParam(gl, "func", new UIInfo(UIType.ENUM, ["NEVER", "LESS", "LEQUAL", "GREATER", "GEQUAL", "EQUAL", "NOTEQUAL", "ALWAYS"]))
            ]),
            new FunctionInfo(gl, "depthMask", null, [
                new FunctionParam(gl, "flag", new UIInfo(UIType.BOOL))
            ]),
            new FunctionInfo(gl, "depthRange", null, [
                new FunctionParam(gl, "zNear", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "zFar", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "detachShader", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "disable", null, [
                new FunctionParam(gl, "cap", new UIInfo(UIType.ENUM, ["BLEND", "CULL_FACE", "DEPTH_TEST", "DITHER", "POLYGON_OFFSET_FILL", "SAMPLE_ALPHA_TO_COVERAGE", "SAMPLE_COVERAGE", "SCISSOR_TEST", "STENCIL_TEST"]))
            ]),
            new FunctionInfo(gl, "disableVertexAttribArray", null, [
                new FunctionParam(gl, "index", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "drawArrays", null, [
                new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, ["POINTS", "LINE_STRIP", "LINE_LOOP", "LINES", "TRIANGLE_STRIP", "TRIANGLE_FAN", "TRIANGLES"])),
                new FunctionParam(gl, "first", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "count", new UIInfo(UIType.LONG))
            ], FunctionType.DRAW),
            new FunctionInfo(gl, "drawElements", null, [
                new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, ["POINTS", "LINE_STRIP", "LINE_LOOP", "LINES", "TRIANGLE_STRIP", "TRIANGLE_FAN", "TRIANGLES"])),
                new FunctionParam(gl, "count", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, ["UNSIGNED_BYTE", "UNSIGNED_SHORT"])),
                new FunctionParam(gl, "offset", new UIInfo(UIType.LONG))
            ], FunctionType.DRAW),
            new FunctionInfo(gl, "enable", null, [
                new FunctionParam(gl, "cap", new UIInfo(UIType.ENUM, ["BLEND", "CULL_FACE", "DEPTH_TEST", "DITHER", "POLYGON_OFFSET_FILL", "SAMPLE_ALPHA_TO_COVERAGE", "SAMPLE_COVERAGE", "SCISSOR_TEST", "STENCIL_TEST"]))
            ]),
            new FunctionInfo(gl, "enableVertexAttribArray", null, [
                new FunctionParam(gl, "index", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "finish", null, [
            ]),
            new FunctionInfo(gl, "flush", null, [
            ]),
            new FunctionInfo(gl, "framebufferRenderbuffer", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["FRAMEBUFFER"])),
                new FunctionParam(gl, "attachment", new UIInfo(UIType.ENUM, ["COLOR_ATTACHMENT0", "DEPTH_ATTACHMENT", "STENCIL_ATTACHMENT"])),
                new FunctionParam(gl, "renderbuffertarget", new UIInfo(UIType.ENUM, ["RENDERBUFFER"])),
                new FunctionParam(gl, "renderbuffer", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "framebufferTexture2D", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["FRAMEBUFFER"])),
                new FunctionParam(gl, "attachment", new UIInfo(UIType.ENUM, ["COLOR_ATTACHMENT0", "DEPTH_ATTACHMENT", "STENCIL_ATTACHMENT"])),
                new FunctionParam(gl, "textarget", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP_POSITIVE_X", "TEXTURE_CUBE_MAP_NEGATIVE_X", "TEXTURE_CUBE_MAP_POSITIVE_Y", "TEXTURE_CUBE_MAP_NEGATIVE_Y", "TEXTURE_CUBE_MAP_POSITIVE_Z", "TEXTURE_CUBE_MAP_NEGATIVE_Z"])),
                new FunctionParam(gl, "texture", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "level", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "frontFace", null, [
                new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, ["CW", "CCW"]))
            ]),
            new FunctionInfo(gl, "generateMipmap", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP"]))
            ]),
            new FunctionInfo(gl, "getActiveAttrib", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "index", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "getActiveUniform", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "index", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "getAttachedShaders", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "getAttribLocation", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "name", new UIInfo(UIType.STRING))
            ]),
            new FunctionInfo(gl, "getParameter", null, [
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["ACTIVE_TEXTURE", "ALIASED_LINE_WIDTH_RANGE", "ALIASED_POINT_SIZE_RANGE", "ALPHA_BITS", "ARRAY_BUFFER_BINDING", "BLEND", "BLEND_COLOR", "BLEND_DST_ALPHA", "BLEND_DST_RGB", "BLEND_EQUATION_ALPHA", "BLEND_EQUATION_RGB", "BLEND_SRC_ALPHA", "BLEND_SRC_RGB", "BLUE_BITS", "COLOR_CLEAR_VALUE", "COLOR_WRITEMASK", "COMPRESSED_TEXTURE_FORMATS", "CULL_FACE", "CULL_FACE_MODE", "CURRENT_PROGRAM", "DEPTH_BITS", "DEPTH_CLEAR_VALUE", "DEPTH_FUNC", "DEPTH_RANGE", "DEPTH_TEST", "DEPTH_WRITEMASK", "DITHER", "ELEMENT_ARRAY_BUFFER_BINDING", "FRAMEBUFFER_BINDING", "FRONT_FACE", "GENERATE_MIPMAP_HINT", "GREEN_BITS", "IMPLEMENTATION_COLOR_READ_FORMAT", "IMPLEMENTATION_COLOR_READ_TYPE", "LINE_WIDTH", "MAX_COMBINED_TEXTURE_IMAGE_UNITS", "MAX_CUBE_MAP_TEXTURE_SIZE", "MAX_FRAGMENT_UNIFORM_VECTORS", "MAX_RENDERBUFFER_SIZE", "MAX_TEXTURE_IMAGE_UNITS", "MAX_TEXTURE_SIZE", "MAX_VARYING_VECTORS", "MAX_VERTEX_ATTRIBS", "MAX_VERTEX_TEXTURE_IMAGE_UNITS", "MAX_VERTEX_UNIFORM_VECTORS", "MAX_VIEWPORT_DIMS", "NUM_COMPRESSED_TEXTURE_FORMATS", "PACK_ALIGNMENT", "POLYGON_OFFSET_FACTOR", "POLYGON_OFFSET_FILL", "POLYGON_OFFSET_UNITS", "RED_BITS", "RENDERBUFFER_BINDING", "RENDERER", "SAMPLE_BUFFERS", "SAMPLE_COVERAGE_INVERT", "SAMPLE_COVERAGE_VALUE", "SAMPLES", "SCISSOR_BOX", "SCISSOR_TEST", "SHADING_LANGUAGE_VERSION", "STENCIL_BACK_FAIL", "STENCIL_BACK_FUNC", "STENCIL_BACK_PASS_DEPTH_FAIL", "STENCIL_BACK_PASS_DEPTH_PASS", "STENCIL_BACK_REF", "STENCIL_BACK_VALUE_MASK", "STENCIL_BACK_WRITEMASK", "STENCIL_BITS", "STENCIL_CLEAR_VALUE", "STENCIL_FAIL", "STENCIL_FUNC", "STENCIL_PASS_DEPTH_FAIL", "STENCIL_PASS_DEPTH_PASS", "STENCIL_REF", "STENCIL_TEST", "STENCIL_VALUE_MASK", "STENCIL_WRITEMASK", "SUBPIXEL_BITS", "TEXTURE_BINDING_2D", "TEXTURE_BINDING_CUBE_MAP", "UNPACK_ALIGNMENT", "UNPACK_COLORSPACE_CONVERSION_WEBGL", "UNPACK_FLIP_Y_WEBGL", "UNPACK_PREMULTIPLY_ALPHA_WEBGL", "VENDOR", "VERSION", "VIEWPORT"]))
            ]),
            new FunctionInfo(gl, "getBufferParameter", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["ARRAY_BUFFER", "ELEMENT_ARRAY_BUFFER"])),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["BUFFER_SIZE", "BUFFER_USAGE"]))
            ]),
            new FunctionInfo(gl, "getError", null, [
            ]),
            new FunctionInfo(gl, "getSupportedExtensions", null, [
            ]),
            new FunctionInfo(gl, "getExtension", null, [
                new FunctionParam(gl, "name", new UIInfo(UIType.STRING))
            ]),
            new FunctionInfo(gl, "getFramebufferAttachmentParameter", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["FRAMEBUFFER"])),
                new FunctionParam(gl, "attachment", new UIInfo(UIType.ENUM, ["COLOR_ATTACHMENT0", "DEPTH_ATTACHMENT", "STENCIL_ATTACHMENT"])),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["FRAMEBUFFER_ATTACHMENT_OBJECT_TYPE", "FRAMEBUFFER_ATTACHMENT_OBJECT_NAME", "FRAMEBUFFER_ATTACHMENT_TEXTURE_LEVEL", "FRAMEBUFFER_ATTACHMENT_TEXTURE_CUBE_MAP_FACE"]))
            ]),
            new FunctionInfo(gl, "getProgramParameter", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["DELETE_STATUS", "LINK_STATUS", "VALIDATE_STATUS", "INFO_LOG_LENGTH", "ATTACHED_SHADERS", "ACTIVE_ATTRIBUTES", "ACTIVE_ATTRIBUTE_MAX_LENGTH", "ACTIVE_UNIFORMS", "ACTIVE_UNIFORM_MAX_LENGTH"]))
            ]),
            new FunctionInfo(gl, "getProgramInfoLog", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "getRenderbufferParameter", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["RENDERBUFFER"])),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["RENDERBUFFER_WIDTH", "RENDERBUFFER_HEIGHT", "RENDERBUFFER_INTERNAL_FORMAT", "RENDERBUFFER_RED_SIZE", "RENDERBUFFER_GREEN_SIZE", "RENDERBUFFER_BLUE_SIZE", "RENDERBUFFER_ALPHA_SIZE", "RENDERBUFFER_DEPTH_SIZE", "RENDERBUFFER_STENCIL_SIZE"]))
            ]),
            new FunctionInfo(gl, "getShaderParameter", null, [
                new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["SHADER_TYPE", "DELETE_STATUS", "COMPILE_STATUS", "INFO_LOG_LENGTH", "SHADER_SOURCE_LENGTH"]))
            ]),
            new FunctionInfo(gl, "getShaderInfoLog", null, [
                new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "getShaderSource", null, [
                new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "getTexParameter", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP"])),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["TEXTURE_MAG_FILTER", "TEXTURE_MIN_FILTER", "TEXTURE_WRAP_S", "TEXTURE_WRAP_T"]))
            ]),
            new FunctionInfo(gl, "getUniform", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)) // TODO: find a way to treat this as an integer? browsers don't like this...
            ]),
            new FunctionInfo(gl, "getUniformLocation", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "name", new UIInfo(UIType.STRING))
            ]),
            new FunctionInfo(gl, "getVertexAttrib", null, [
                new FunctionParam(gl, "index", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["VERTEX_ATTRIB_ARRAY_BUFFER_BINDING", "VERTEX_ATTRIB_ARRAY_ENABLED", "VERTEX_ATTRIB_ARRAY_SIZE", "VERTEX_ATTRIB_ARRAY_STRIDE", "VERTEX_ATTRIB_ARRAY_TYPE", "VERTEX_ATTRIB_ARRAY_NORMALIZED", "CURRENT_VERTEX_ATTRIB"]))
            ]),
            new FunctionInfo(gl, "getVertexAttribOffset", null, [
                new FunctionParam(gl, "index", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["VERTEX_ATTRIB_ARRAY_POINTER"]))
            ]),
            new FunctionInfo(gl, "hint", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["GENERATE_MIPMAP_HINT"])),
                new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, ["FASTEST", "NICEST", "DONT_CARE"]))
            ]),
            new FunctionInfo(gl, "isBuffer", null, [
                new FunctionParam(gl, "buffer", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "isEnabled", null, [
                new FunctionParam(gl, "cap", new UIInfo(UIType.ENUM, ["BLEND", "CULL_FACE", "DEPTH_TEST", "DITHER", "POLYGON_OFFSET_FILL", "SAMPLE_ALPHA_TO_COVERAGE", "SAMPLE_COVERAGE", "SCISSOR_TEST", "STENCIL_TEST"]))
            ]),
            new FunctionInfo(gl, "isFramebuffer", null, [
                new FunctionParam(gl, "framebuffer", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "isProgram", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "isRenderbuffer", null, [
                new FunctionParam(gl, "renderbuffer", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "isShader", null, [
                new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "isTexture", null, [
                new FunctionParam(gl, "texture", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "lineWidth", null, [
                new FunctionParam(gl, "width", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "linkProgram", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "pixelStorei", null, [
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["PACK_ALIGNMENT", "UNPACK_ALIGNMENT", "UNPACK_COLORSPACE_CONVERSION_WEBGL", "UNPACK_FLIP_Y_WEBGL", "UNPACK_PREMULTIPLY_ALPHA_WEBGL"])),
                new FunctionParam(gl, "param", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "polygonOffset", null, [
                new FunctionParam(gl, "factor", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "units", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "readPixels", null, [
                new FunctionParam(gl, "x", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "y", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "width", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "height", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, ["ALPHA", "RGB", "RGBA"])),
                new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, ["UNSIGNED_BYTE", "UNSIGNED_SHORT_5_6_5", "UNSIGNED_SHORT_4_4_4_4", "UNSIGNED_SHORT_5_5_5_1"])),
                new FunctionParam(gl, "pixels", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "renderbufferStorage", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["RENDERBUFFER"])),
                new FunctionParam(gl, "internalformat", new UIInfo(UIType.ENUM, ["RGBA4", "RGB565", "RGB5_A1", "DEPTH_COMPONENT16", "STENCIL_INDEX8"])),
                new FunctionParam(gl, "width", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "height", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "sampleCoverage", null, [
                new FunctionParam(gl, "value", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "invert", new UIInfo(UIType.BOOL))
            ]),
            new FunctionInfo(gl, "scissor", null, [
                new FunctionParam(gl, "x", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "y", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "width", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "height", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "shaderSource", null, [
                new FunctionParam(gl, "shader", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "source", new UIInfo(UIType.STRING))
            ]),
            new FunctionInfo(gl, "stencilFunc", null, [
                new FunctionParam(gl, "func", new UIInfo(UIType.ENUM, ["NEVER", "LESS", "LEQUAL", "GREATER", "GEQUAL", "EQUAL", "NOTEQUAL", "ALWAYS"])),
                new FunctionParam(gl, "ref", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "mask", new UIInfo(UIType.BITMASK))
            ]),
            new FunctionInfo(gl, "stencilFuncSeparate", null, [
                new FunctionParam(gl, "face", new UIInfo(UIType.ENUM, ["FRONT", "BACK", "FRONT_AND_BACK"])),
                new FunctionParam(gl, "func", new UIInfo(UIType.ENUM, ["NEVER", "LESS", "LEQUAL", "GREATER", "GEQUAL", "EQUAL", "NOTEQUAL", "ALWAYS"])),
                new FunctionParam(gl, "ref", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "mask", new UIInfo(UIType.BITMASK))
            ]),
            new FunctionInfo(gl, "stencilMask", null, [
                new FunctionParam(gl, "mask", new UIInfo(UIType.BITMASK))
            ]),
            new FunctionInfo(gl, "stencilMaskSeparate", null, [
                new FunctionParam(gl, "face", new UIInfo(UIType.ENUM, ["FRONT", "BACK", "FRONT_AND_BACK"])),
                new FunctionParam(gl, "mask", new UIInfo(UIType.BITMASK))
            ]),
            new FunctionInfo(gl, "stencilOp", null, [
                new FunctionParam(gl, "fail", new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])),
                new FunctionParam(gl, "zfail", new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])),
                new FunctionParam(gl, "zpass", new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"]))
            ]),
            new FunctionInfo(gl, "stencilOpSeparate", null, [
                new FunctionParam(gl, "face", new UIInfo(UIType.ENUM, ["FRONT", "BACK", "FRONT_AND_BACK"])),
                new FunctionParam(gl, "fail", new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])),
                new FunctionParam(gl, "zfail", new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])),
                new FunctionParam(gl, "zpass", new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"]))
            ]),
            new FunctionInfo(gl, "texImage2D", null, null), // handled specially below
            new FunctionInfo(gl, "texParameterf", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP"])),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["TEXTURE_MAG_FILTER", "TEXTURE_MIN_FILTER", "TEXTURE_WRAP_S", "TEXTURE_WRAP_T"])),
                new FunctionParam(gl, "param", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "texParameteri", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP"])),
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["TEXTURE_MAG_FILTER", "TEXTURE_MIN_FILTER", "TEXTURE_WRAP_S", "TEXTURE_WRAP_T"])),
                new FunctionParam(gl, "param", new UIInfo(UIType.ENUM, ["NEAREST", "LINEAR", "NEAREST_MIPMAP_NEAREST", "LINEAR_MIPMAP_NEAREST", "NEAREST_MIPMAP_LINEAR", "LINEAR_MIPMAP_LINEAR", "CLAMP_TO_EDGE", "MIRRORED_REPEAT", "REPEAT"]))
            ]),
            new FunctionInfo(gl, "texSubImage2D", null, null), // handled specially below
            new FunctionInfo(gl, "uniform1f", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "uniform1fv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "v", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "uniform1i", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "x", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "uniform1iv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "v", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "uniform2f", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "y", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "uniform2fv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "v", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "uniform2i", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "x", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "y", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "uniform2iv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "v", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "uniform3f", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "y", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "z", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "uniform3fv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "v", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "uniform3i", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "x", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "y", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "z", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "uniform3iv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "v", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "uniform4f", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "y", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "z", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "w", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "uniform4fv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "v", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "uniform4i", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "x", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "y", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "z", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "w", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "uniform4iv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "v", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "uniformMatrix2fv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "transpose", new UIInfo(UIType.BOOL)),
                new FunctionParam(gl, "value", new UIInfo(UIType.MATRIX))
            ]),
            new FunctionInfo(gl, "uniformMatrix3fv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "transpose", new UIInfo(UIType.BOOL)),
                new FunctionParam(gl, "value", new UIInfo(UIType.MATRIX))
            ]),
            new FunctionInfo(gl, "uniformMatrix4fv", null, [
                new FunctionParam(gl, "location", new UIInfo(UIType.OBJECT)),
                new FunctionParam(gl, "transpose", new UIInfo(UIType.BOOL)),
                new FunctionParam(gl, "value", new UIInfo(UIType.MATRIX))
            ]),
            new FunctionInfo(gl, "useProgram", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "validateProgram", null, [
                new FunctionParam(gl, "program", new UIInfo(UIType.OBJECT))
            ]),
            new FunctionInfo(gl, "vertexAttrib1f", null, [
                new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "vertexAttrib1fv", null, [
                new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "values", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "vertexAttrib2f", null, [
                new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "y", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "vertexAttrib2fv", null, [
                new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "values", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "vertexAttrib3f", null, [
                new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "y", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "z", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "vertexAttrib3fv", null, [
                new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "values", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "vertexAttrib4f", null, [
                new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "x", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "y", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "z", new UIInfo(UIType.FLOAT)),
                new FunctionParam(gl, "w", new UIInfo(UIType.FLOAT))
            ]),
            new FunctionInfo(gl, "vertexAttrib4fv", null, [
                new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "values", new UIInfo(UIType.ARRAY))
            ]),
            new FunctionInfo(gl, "vertexAttribPointer", null, [
                new FunctionParam(gl, "indx", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "size", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, ["BYTE", "UNSIGNED_BYTE", "SHORT", "UNSIGNED_SHORT", "FIXED", "FLOAT"])),
                new FunctionParam(gl, "normalized", new UIInfo(UIType.BOOL)),
                new FunctionParam(gl, "stride", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "offset", new UIInfo(UIType.LONG))
            ]),
            new FunctionInfo(gl, "viewport", null, [
                new FunctionParam(gl, "x", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "y", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "width", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "height", new UIInfo(UIType.LONG))
            ])
        ];

        // Build lookup
        for (var n = 0; n < functionInfos.length; n++) {
            functionInfos[functionInfos[n].name] = functionInfos[n];
        }

        var textureTypes = new UIInfo(UIType.ENUM, ["UNSIGNED_BYTE", "UNSIGNED_SHORT_5_6_5", "UNSIGNED_SHORT_4_4_4_4", "UNSIGNED_SHORT_5_5_5_1", "FLOAT"]);
        functionInfos["texImage2D"].getArgs = function (call) {
            var args = [];
            args.push(new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP_POSITIVE_X", "TEXTURE_CUBE_MAP_NEGATIVE_X", "TEXTURE_CUBE_MAP_POSITIVE_Y", "TEXTURE_CUBE_MAP_NEGATIVE_Y", "TEXTURE_CUBE_MAP_POSITIVE_Z", "TEXTURE_CUBE_MAP_NEGATIVE_Z"])));
            args.push(new FunctionParam(gl, "level", new UIInfo(UIType.LONG)));
            args.push(new FunctionParam(gl, "internalformat", new UIInfo(UIType.ENUM, ["ALPHA", "LUMINANCE", "LUMINANCE_ALPHA", "RGB", "RGBA"])));
            if (call.args.length == 9) {
                args.push(new FunctionParam(gl, "width", new UIInfo(UIType.LONG)));
                args.push(new FunctionParam(gl, "height", new UIInfo(UIType.LONG)));
                args.push(new FunctionParam(gl, "border", new UIInfo(UIType.LONG)));
                args.push(new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, ["ALPHA", "LUMINANCE", "LUMINANCE_ALPHA", "RGB", "RGBA"])));
                args.push(new FunctionParam(gl, "type", textureTypes));
                args.push(new FunctionParam(gl, "pixels", new UIInfo(UIType.ARRAY)));
            } else {
                args.push(new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, ["ALPHA", "LUMINANCE", "LUMINANCE_ALPHA", "RGB", "RGBA"])));
                args.push(new FunctionParam(gl, "type", textureTypes));
                args.push(new FunctionParam(gl, "value", new UIInfo(UIType.OBJECT)));
            }
            return args;
        };
        functionInfos["texSubImage2D"].getArgs = function (call) {
            var args = [];
            args.push(new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP_POSITIVE_X", "TEXTURE_CUBE_MAP_NEGATIVE_X", "TEXTURE_CUBE_MAP_POSITIVE_Y", "TEXTURE_CUBE_MAP_NEGATIVE_Y", "TEXTURE_CUBE_MAP_POSITIVE_Z", "TEXTURE_CUBE_MAP_NEGATIVE_Z"])));
            args.push(new FunctionParam(gl, "level", new UIInfo(UIType.LONG)));
            args.push(new FunctionParam(gl, "xoffset", new UIInfo(UIType.LONG)));
            args.push(new FunctionParam(gl, "yoffset", new UIInfo(UIType.LONG)));
            if (call.args.length == 9) {
                args.push(new FunctionParam(gl, "width", new UIInfo(UIType.LONG)));
                args.push(new FunctionParam(gl, "height", new UIInfo(UIType.LONG)));
                args.push(new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, ["ALPHA", "LUMINANCE", "LUMINANCE_ALPHA", "RGB", "RGBA"])));
                args.push(new FunctionParam(gl, "type", textureTypes));
                args.push(new FunctionParam(gl, "pixels", new UIInfo(UIType.ARRAY)));
            } else {
                args.push(new FunctionParam(gl, "format", new UIInfo(UIType.ENUM, ["ALPHA", "LUMINANCE", "LUMINANCE_ALPHA", "RGB", "RGBA"])));
                args.push(new FunctionParam(gl, "type", textureTypes));
                args.push(new FunctionParam(gl, "value", new UIInfo(UIType.OBJECT)));
            }
            return args;
        };

        info.functions = functionInfos;
    };

    var StateParameter = function (staticgl, name, readOnly, ui) {
        this.value = staticgl[name];
        this.name = name;
        this.readOnly = readOnly;
        this.ui = ui;

        this.getter = function (gl) {
            try {
                return gl.getParameter(gl[this.name]);
            } catch (e) {
                console.log("unable to get state parameter " + this.name);
                return null;
            }
        };
    };

    function setupStateParameters(gl) {
        if (info.stateParameters) {
            return;
        }

        var maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);

        var stateParameters = [
            new StateParameter(gl, "ACTIVE_TEXTURE", false, new UIInfo(UIType.ENUM, ["TEXTURE0", "TEXTURE1", "TEXTURE2", "TEXTURE3", "TEXTURE4", "TEXTURE5", "TEXTURE6", "TEXTURE7", "TEXTURE8", "TEXTURE9", "TEXTURE10", "TEXTURE11", "TEXTURE12", "TEXTURE13", "TEXTURE14", "TEXTURE15", "TEXTURE16", "TEXTURE17", "TEXTURE18", "TEXTURE19", "TEXTURE20", "TEXTURE21", "TEXTURE22", "TEXTURE23", "TEXTURE24", "TEXTURE25", "TEXTURE26", "TEXTURE27", "TEXTURE28", "TEXTURE29", "TEXTURE30", "TEXTURE31"])),
            new StateParameter(gl, "ALIASED_LINE_WIDTH_RANGE", true, new UIInfo(UIType.RANGE)),
            new StateParameter(gl, "ALIASED_POINT_SIZE_RANGE", true, new UIInfo(UIType.RANGE)),
            new StateParameter(gl, "ALPHA_BITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "ARRAY_BUFFER_BINDING", false, new UIInfo(UIType.OBJECT)),
            new StateParameter(gl, "BLEND", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "BLEND_COLOR", false, new UIInfo(UIType.COLOR)),
            new StateParameter(gl, "BLEND_DST_ALPHA", false, new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA. GL_CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA"])),
            new StateParameter(gl, "BLEND_DST_RGB", false, new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA. GL_CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA"])),
            new StateParameter(gl, "BLEND_EQUATION_ALPHA", false, new UIInfo(UIType.ENUM, ["FUNC_ADD", "FUNC_SUBTRACT", "FUNC_REVERSE_SUBTRACT"])),
            new StateParameter(gl, "BLEND_EQUATION_RGB", false, new UIInfo(UIType.ENUM, ["FUNC_ADD", "FUNC_SUBTRACT", "FUNC_REVERSE_SUBTRACT"])),
            new StateParameter(gl, "BLEND_SRC_ALPHA", false, new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA", "CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA", "SRC_ALPHA_SATURATE"])),
            new StateParameter(gl, "BLEND_SRC_RGB", false, new UIInfo(UIType.ENUM, ["ZERO", "ONE", "SRC_COLOR", "ONE_MINUS_SRC_COLOR", "DST_COLOR", "ONE_MINUS_DST_COLOR", "SRC_ALPHA", "ONE_MINUS_SRC_ALPHA", "DST_ALPHA", "ONE_MINUS_DST_ALPHA", "CONSTANT_COLOR", "ONE_MINUS_CONSTANT_COLOR", "CONSTANT_ALPHA", "ONE_MINUS_CONSTANT_ALPHA", "SRC_ALPHA_SATURATE"])),
            new StateParameter(gl, "BLUE_BITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "COLOR_CLEAR_VALUE", false, new UIInfo(UIType.COLOR)),
            new StateParameter(gl, "COLOR_WRITEMASK", false, new UIInfo(UIType.COLORMASK)),
            new StateParameter(gl, "CULL_FACE", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "CULL_FACE_MODE", false, new UIInfo(UIType.ENUM, ["FRONT", "BACK", "FRONT_AND_BACK"])),
            new StateParameter(gl, "CURRENT_PROGRAM", false, new UIInfo(UIType.OBJECT)),
            new StateParameter(gl, "DEPTH_BITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "DEPTH_CLEAR_VALUE", false, new UIInfo(UIType.FLOAT)),
            new StateParameter(gl, "DEPTH_FUNC", false, new UIInfo(UIType.ENUM, ["NEVER", "LESS", "EQUAL", "LEQUAL", "GREATER", "NOTEQUAL", "GEQUAL", "ALWAYS"])),
            new StateParameter(gl, "DEPTH_RANGE", false, new UIInfo(UIType.RANGE)),
            new StateParameter(gl, "DEPTH_TEST", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "DEPTH_WRITEMASK", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "DITHER", true, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "ELEMENT_ARRAY_BUFFER_BINDING", false, new UIInfo(UIType.OBJECT)),
            new StateParameter(gl, "FRAMEBUFFER_BINDING", false, new UIInfo(UIType.OBJECT)),
            new StateParameter(gl, "FRONT_FACE", false, new UIInfo(UIType.ENUM, ["CW", "CCW"])),
            new StateParameter(gl, "GENERATE_MIPMAP_HINT", false, new UIInfo(UIType.ENUM, ["FASTEST", "NICEST", "DONT_CARE"])),
            new StateParameter(gl, "GREEN_BITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "LINE_WIDTH", false, new UIInfo(UIType.FLOAT)),
            new StateParameter(gl, "MAX_COMBINED_TEXTURE_IMAGE_UNITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_CUBE_MAP_TEXTURE_SIZE", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_FRAGMENT_UNIFORM_VECTORS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_RENDERBUFFER_SIZE", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_TEXTURE_IMAGE_UNITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_TEXTURE_SIZE", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_VARYING_VECTORS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_VERTEX_ATTRIBS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_VERTEX_TEXTURE_IMAGE_UNITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_VERTEX_UNIFORM_VECTORS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "MAX_VIEWPORT_DIMS", true, new UIInfo(UIType.WH)),
            new StateParameter(gl, "NUM_COMPRESSED_TEXTURE_FORMATS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "PACK_ALIGNMENT", false, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "POLYGON_OFFSET_FACTOR", false, new UIInfo(UIType.FLOAT)),
            new StateParameter(gl, "POLYGON_OFFSET_FILL", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "POLYGON_OFFSET_UNITS", false, new UIInfo(UIType.FLOAT)),
            new StateParameter(gl, "RED_BITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "RENDERBUFFER_BINDING", false, new UIInfo(UIType.OBJECT)),
            new StateParameter(gl, "RENDERER", true, new UIInfo(UIType.STRING)),
            new StateParameter(gl, "SAMPLE_ALPHA_TO_COVERAGE", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "SAMPLE_BUFFERS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "SAMPLE_COVERAGE", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "SAMPLE_COVERAGE_INVERT", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "SAMPLE_COVERAGE_VALUE", false, new UIInfo(UIType.FLOAT)),
            new StateParameter(gl, "SAMPLES", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "SCISSOR_BOX", false, new UIInfo(UIType.RECT)),
            new StateParameter(gl, "SCISSOR_TEST", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "SHADING_LANGUAGE_VERSION", true, new UIInfo(UIType.STRING)),
            new StateParameter(gl, "STENCIL_BACK_FAIL", false, new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])),
            new StateParameter(gl, "STENCIL_BACK_FUNC", false, new UIInfo(UIType.ENUM, ["NEVER", "LESS", "LEQUAL", "GREATER", "GEQUAL", "EQUAL", "NOTEQUAL", "ALWAYS"])),
            new StateParameter(gl, "STENCIL_BACK_PASS_DEPTH_FAIL", false, new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])),
            new StateParameter(gl, "STENCIL_BACK_PASS_DEPTH_PASS", false, new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])),
            new StateParameter(gl, "STENCIL_BACK_REF", false, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "STENCIL_BACK_VALUE_MASK", false, new UIInfo(UIType.BITMASK)),
            new StateParameter(gl, "STENCIL_BACK_WRITEMASK", false, new UIInfo(UIType.BITMASK)),
            new StateParameter(gl, "STENCIL_BITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "STENCIL_CLEAR_VALUE", false, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "STENCIL_FAIL", false, new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])),
            new StateParameter(gl, "STENCIL_FUNC", false, new UIInfo(UIType.ENUM, ["NEVER", "LESS", "LEQUAL", "GREATER", "GEQUAL", "EQUAL", "NOTEQUAL", "ALWAYS"])),
            new StateParameter(gl, "STENCIL_PASS_DEPTH_FAIL", false, new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])),
            new StateParameter(gl, "STENCIL_PASS_DEPTH_PASS", false, new UIInfo(UIType.ENUM, ["KEEP", "ZERO", "REPLACE", "INCR", "INCR_WRAP", "DECR", "DECR_WRAP", "INVERT"])),
            new StateParameter(gl, "STENCIL_REF", false, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "STENCIL_TEST", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "STENCIL_VALUE_MASK", false, new UIInfo(UIType.BITMASK)),
            new StateParameter(gl, "STENCIL_WRITEMASK", false, new UIInfo(UIType.BITMASK)),
            new StateParameter(gl, "SUBPIXEL_BITS", true, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "UNPACK_ALIGNMENT", false, new UIInfo(UIType.LONG)),
            new StateParameter(gl, "UNPACK_COLORSPACE_CONVERSION_WEBGL", false, new UIInfo(UIType.ENUM, ["NONE", "BROWSER_DEFAULT_WEBGL"])),
            new StateParameter(gl, "UNPACK_FLIP_Y_WEBGL", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "UNPACK_PREMULTIPLY_ALPHA_WEBGL", false, new UIInfo(UIType.BOOL)),
            new StateParameter(gl, "VENDOR", true, new UIInfo(UIType.STRING)),
            new StateParameter(gl, "VERSION", true, new UIInfo(UIType.STRING)),
            new StateParameter(gl, "VIEWPORT", false, new UIInfo(UIType.RECT))
        ];

        for (var n = 0; n < maxTextureUnits; n++) {
            var param = new StateParameter(gl, "TEXTURE_BINDING_2D_" + n, false, new UIInfo(UIType.OBJECT));
            param.getter = (function (n) {
                return function (gl) {
                    var existingBinding = gl.getParameter(gl.ACTIVE_TEXTURE);
                    gl.activeTexture(gl.TEXTURE0 + n);
                    var result = gl.getParameter(gl.TEXTURE_BINDING_2D);
                    gl.activeTexture(existingBinding);
                    return result;
                };
            })(n);
            stateParameters.push(param);
        }
        for (var n = 0; n < maxTextureUnits; n++) {
            var param = new StateParameter(gl, "TEXTURE_BINDING_CUBE_MAP_" + n, false, new UIInfo(UIType.OBJECT));
            param.getter = (function (n) {
                return function (gl) {
                    var existingBinding = gl.getParameter(gl.ACTIVE_TEXTURE);
                    gl.activeTexture(gl.TEXTURE0 + n);
                    var result = gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP);
                    gl.activeTexture(existingBinding);
                    return result;
                };
            })(n);
            stateParameters.push(param);
        }

        // Build lookup
        for (var n = 0; n < stateParameters.length; n++) {
            stateParameters[stateParameters[n].name] = stateParameters[n];
        }

        info.stateParameters = stateParameters;
    };
    
    function setupEnumMap(gl) {
        if (info.enumMap) {
            return;
        }
        
        var enumMap = {};
        for (var n in gl) {
            if (typeof gl[n] == 'number') {
                enumMap[gl[n]] = n;
            }
        }
        
        info.enumMap = enumMap;
    };

    gli.UIType = UIType;
    gli.FunctionType = FunctionType;
    //info.functions - deferred
    //info.stateParameters - deferred
    //info.enumMap - deferred
    
    info.enumToString = function (n) {
        var string = info.enumMap[n];
        if (string !== undefined) {
            return string;
        }
        return "0x" + n.toString(16);
    };

    info.initialize = function (gl) {
        setupFunctionInfos(gl);
        setupStateParameters(gl);
        setupEnumMap(gl);
    };
})();
