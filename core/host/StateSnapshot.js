(function () {
    var host = glinamespace("gli.host");

    var stateParameters = null;
    function setupStateParameters(gl) {
        stateParameters = [
            { name: "ACTIVE_TEXTURE" },
            { name: "ALIASED_LINE_WIDTH_RANGE" },
            { name: "ALIASED_POINT_SIZE_RANGE" },
            { name: "ALPHA_BITS" },
            { name: "ARRAY_BUFFER_BINDING" },
            { name: "BLEND" },
            { name: "BLEND_COLOR" },
            { name: "BLEND_DST_ALPHA" },
            { name: "BLEND_DST_RGB" },
            { name: "BLEND_EQUATION_ALPHA" },
            { name: "BLEND_EQUATION_RGB" },
            { name: "BLEND_SRC_ALPHA" },
            { name: "BLEND_SRC_RGB" },
            { name: "BLUE_BITS" },
            { name: "COLOR_CLEAR_VALUE" },
            { name: "COLOR_WRITEMASK" },
            { name: "CULL_FACE" },
            { name: "CULL_FACE_MODE" },
            { name: "CURRENT_PROGRAM" },
            { name: "DEPTH_BITS" },
            { name: "DEPTH_CLEAR_VALUE" },
            { name: "DEPTH_FUNC" },
            { name: "DEPTH_RANGE" },
            { name: "DEPTH_TEST" },
            { name: "DEPTH_WRITEMASK" },
            { name: "DITHER" },
            { name: "ELEMENT_ARRAY_BUFFER_BINDING" },
            { name: "FRAMEBUFFER_BINDING" },
            { name: "FRONT_FACE" },
            { name: "GENERATE_MIPMAP_HINT" },
            { name: "GREEN_BITS" },
            { name: "IMPLEMENTATION_COLOR_READ_FORMAT" },
            { name: "IMPLEMENTATION_COLOR_READ_TYPE" },
            { name: "LINE_WIDTH" },
            { name: "MAX_COMBINED_TEXTURE_IMAGE_UNITS" },
            { name: "MAX_CUBE_MAP_TEXTURE_SIZE" },
            { name: "MAX_FRAGMENT_UNIFORM_VECTORS" },
            { name: "MAX_RENDERBUFFER_SIZE" },
            { name: "MAX_TEXTURE_IMAGE_UNITS" },
            { name: "MAX_TEXTURE_SIZE" },
            { name: "MAX_VARYING_VECTORS" },
            { name: "MAX_VERTEX_ATTRIBS" },
            { name: "MAX_VERTEX_TEXTURE_IMAGE_UNITS" },
            { name: "MAX_VERTEX_UNIFORM_VECTORS" },
            { name: "MAX_VIEWPORT_DIMS" },
            { name: "NUM_COMPRESSED_TEXTURE_FORMATS" },
            { name: "PACK_ALIGNMENT" },
            { name: "POLYGON_OFFSET_FACTOR" },
            { name: "POLYGON_OFFSET_FILL" },
            { name: "POLYGON_OFFSET_UNITS" },
            { name: "RED_BITS" },
            { name: "RENDERBUFFER_BINDING" },
            { name: "RENDERER" },
            { name: "SAMPLE_ALPHA_TO_COVERAGE" },
            { name: "SAMPLE_BUFFERS" },
            { name: "SAMPLE_COVERAGE" },
            { name: "SAMPLE_COVERAGE_INVERT" },
            { name: "SAMPLE_COVERAGE_VALUE" },
            { name: "SAMPLES" },
            { name: "SCISSOR_BOX" },
            { name: "SCISSOR_TEST" },
            { name: "SHADING_LANGUAGE_VERSION" },
            { name: "STENCIL_BACK_FAIL" },
            { name: "STENCIL_BACK_FUNC" },
            { name: "STENCIL_BACK_PASS_DEPTH_FAIL" },
            { name: "STENCIL_BACK_PASS_DEPTH_PASS" },
            { name: "STENCIL_BACK_REF" },
            { name: "STENCIL_BACK_VALUE_MASK" },
            { name: "STENCIL_BACK_WRITEMASK" },
            { name: "STENCIL_BITS" },
            { name: "STENCIL_CLEAR_VALUE" },
            { name: "STENCIL_FAIL" },
            { name: "STENCIL_FUNC" },
            { name: "STENCIL_PASS_DEPTH_FAIL" },
            { name: "STENCIL_PASS_DEPTH_PASS" },
            { name: "STENCIL_REF" },
            { name: "STENCIL_TEST" },
            { name: "STENCIL_VALUE_MASK" },
            { name: "STENCIL_WRITEMASK" },
            { name: "SUBPIXEL_BITS" },
            { name: "UNPACK_ALIGNMENT" },
            { name: "UNPACK_COLORSPACE_CONVERSION_WEBGL" },
            { name: "UNPACK_FLIP_Y_WEBGL" },
            { name: "UNPACK_PREMULTIPLY_ALPHA_WEBGL" },
            { name: "VENDOR" },
            { name: "VERSION" },
            { name: "VIEWPORT" }
        ];

        var maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
        for (var n = 0; n < maxTextureUnits; n++) {
            var param = { name: "TEXTURE_BINDING_2D_" + n };
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
            var param = { name: "TEXTURE_BINDING_CUBE_MAP_" + n };
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

        // Setup values
        for (var n = 0; n < stateParameters.length; n++) {
            var param = stateParameters[n];
            param.value = gl[param.name];
        }
    };

    function defaultGetParameter(gl, name) {
        try {
            return gl.getParameter(gl[name]);
        } catch (e) {
            console.log("unable to get state parameter " + name);
            return null;
        }
    };

    var StateSnapshot = function (gl) {
        if (stateParameters == null) {
            setupStateParameters(gl);
        }

        for (var n = 0; n < stateParameters.length; n++) {
            var param = stateParameters[n];
            var value = param.getter ? param.getter(gl) : defaultGetParameter(gl, param.name);
            this[param.value ? param.value : param.name] = value;
        }

        this.attribs = [];
        var attribEnums = [gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING, gl.VERTEX_ATTRIB_ARRAY_ENABLED, gl.VERTEX_ATTRIB_ARRAY_SIZE, gl.VERTEX_ATTRIB_ARRAY_STRIDE, gl.VERTEX_ATTRIB_ARRAY_TYPE, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED, gl.CURRENT_VERTEX_ATTRIB];
        var maxVertexAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        for (var n = 0; n < maxVertexAttribs; n++) {
            var values = {};
            for (var m = 0; m < attribEnums.length; m++) {
                values[attribEnums[m]] = gl.getVertexAttrib(n, attribEnums[m]);
                // TODO: replace buffer binding with ref
            }
            values[0] = gl.getVertexAttribOffset(n, gl.VERTEX_ATTRIB_ARRAY_POINTER);
            this.attribs.push(values);
        }
    };

    StateSnapshot.prototype.clone = function () {
        var cloned = {};
        for (var k in this) {
            cloned[k] = gli.util.clone(this[k]);
        }
        return cloned;
    };

    host.StateSnapshot = StateSnapshot;
})();
