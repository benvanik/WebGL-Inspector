(function () {

    // Will be populated on first capture
    var functionInfos = null;
    var stateParameters = null;

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

    var FunctionInfo = function (staticgl, name, returnType, args) {
        this.name = name;
        this.returnType = returnType;
        this.args = args;
    };

    var FunctionParam = function (staticgl, name, ui) {
        this.name = name;
        this.ui = ui;
    };

    function setupFunctionInfos(context) {
        var gl = context.innerContext;
        if (functionInfos) {
            return;
        }

        functionInfos = [
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
                new FunctionParam(gl, "dfactor", new UIInfo(UIType.ENUM, [""]))
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
        // TODO: flags
            new FunctionInfo(gl, "clear", null, [
                new FunctionParam(gl, "mask", new UIInfo(UIType.ULONG))
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
                new FunctionParam(gl, "func", new UIInfo(UIType.LONG))
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
            ]),
            new FunctionInfo(gl, "drawElements", null, [
                new FunctionParam(gl, "mode", new UIInfo(UIType.ENUM, ["POINTS", "LINE_STRIP", "LINE_LOOP", "LINES", "TRIANGLE_STRIP", "TRIANGLE_FAN", "TRIANGLES"])),
                new FunctionParam(gl, "count", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "type", new UIInfo(UIType.ENUM, ["UNSIGNED_BYTE", "UNSIGNED_SHORT"])),
                new FunctionParam(gl, "offset", new UIInfo(UIType.LONG))
            ]),
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
                new FunctionParam(gl, "pname", new UIInfo(UIType.ENUM, ["UNPACK_ALIGNMENT", "UNPACK_COLORSPACE_CONVERSION_WEBGL", "UNPACK_FLIP_Y_WEBGL", "UNPACK_PREMULTIPLY_ALPHA_WEBGL"])),
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
            new FunctionInfo(gl, "texImage2D", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP_POSITIVE_X", "TEXTURE_CUBE_MAP_NEGATIVE_X", "TEXTURE_CUBE_MAP_POSITIVE_Y", "TEXTURE_CUBE_MAP_NEGATIVE_Y", "TEXTURE_CUBE_MAP_POSITIVE_Z", "TEXTURE_CUBE_MAP_NEGATIVE_Z"])),
                new FunctionParam(gl, "level", new UIInfo(UIType.LONG)),
                new FunctionParam(gl, "internalformat", new UIInfo(UIType.ENUM, ["ALPHA", "LUMINANCE", "LUMINANCE_ALPHA", "RGB", "RGBA"]))
        // TODO: texImage2D versions?
            ]),
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
            new FunctionInfo(gl, "texSubImage2D", null, [
                new FunctionParam(gl, "target", new UIInfo(UIType.ENUM, ["TEXTURE_2D", "TEXTURE_CUBE_MAP_POSITIVE_X", "TEXTURE_CUBE_MAP_NEGATIVE_X", "TEXTURE_CUBE_MAP_POSITIVE_Y", "TEXTURE_CUBE_MAP_NEGATIVE_Y", "TEXTURE_CUBE_MAP_POSITIVE_Z", "TEXTURE_CUBE_MAP_NEGATIVE_Z"])),
                new FunctionParam(gl, "level", new UIInfo(UIType.LONG))
        // TODO: texSubImage2D versions?
            ]),
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

        gli.FunctionInfos = functionInfos;
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
                return null;
            }
        };
    };

    function setupStateParameters(context) {
        var gl = context.innerContext;
        if (stateParameters) {
            return;
        }

        var maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);

        stateParameters = [
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
            new StateParameter(gl, "IMPLEMENTATION_COLOR_READ_FORMAT", true, new UIInfo(UIType.ULONG)),
            new StateParameter(gl, "IMPLEMENTATION_COLOR_READ_TYPE", true, new UIInfo(UIType.ULONG)),
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
            var param;
            param = new StateParameter(gl, "TEXTURE_BINDING_2D_" + n, false, new UIInfo(UIType.OBJECT));
            param.getter = (function (n) {
                return function (gl) {
                    gl.activeTexture(gl.TEXTURE0 + n);
                    return gl.getParameter(gl.TEXTURE_BINDING_2D);
                };
            })(n);
            stateParameters.push(param);
            param = new StateParameter(gl, "TEXTURE_BINDING_CUBE_MAP_" + n, false, new UIInfo(UIType.OBJECT));
            param.getter = (function (n) {
                return function (gl) {
                    gl.activeTexture(gl.TEXTURE0 + n);
                    return gl.getParameter(gl.TEXTURE_BINDING_CUBE_MAP);
                };
            })(n);
            stateParameters.push(param);
        }

        // Build lookup
        for (var n = 0; n < stateParameters.length; n++) {
            stateParameters[stateParameters[n].name] = stateParameters[n];
        }

        gli.StateParameters = stateParameters;
    };

    function captureState(stream, context) {
        var gl = context.innerContext;

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
            command.info = functionInfos[functionName];
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
                    }
                }
            }
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

        setupFunctionInfos(context);
        setupStateParameters(context);

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

    gli.UIType = UIType;
    //gli.FunctionInfos = functionInfos;
    //gli.StateParameters = stateParameters;
})();
