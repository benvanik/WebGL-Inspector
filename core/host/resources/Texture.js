define([
        '../../shared/Base',
        '../../shared/GLConsts',
        '../../shared/Utilities',
        '../Resource',
    ], function (
        base,
        glc,
        util,
        Resource) {

    const texTargetInfo = {}
    texTargetInfo[glc.TEXTURE_2D]                  = { target: glc.TEXTURE_2D,       query: glc.TEXTURE_BINDING_2D, };
    texTargetInfo[glc.TEXTURE_CUBE_MAP]            = { target: glc.TEXTURE_CUBE_MAP, query: glc.TEXTURE_BINDING_CUBE_MAP, };
    texTargetInfo[glc.TEXTURE_3D]                  = { target: glc.TEXTURE_3D,       query: glc.TEXTURE_BINDING_3D, };
    texTargetInfo[glc.TEXTURE_2D_ARRAY]            = { target: glc.TEXTURE_2D_ARRAY, query: glc.TEXTURE_BINDING_2D_ARRAY, };
    texTargetInfo[glc.TEXTURE_CUBE_MAP_POSITIVE_X] = { target: glc.TEXTURE_CUBE_MAP, query: glc.TEXTURE_BINDING_CUBE_MAP, face: true, };
    texTargetInfo[glc.TEXTURE_CUBE_MAP_NEGATIVE_X] = { target: glc.TEXTURE_CUBE_MAP, query: glc.TEXTURE_BINDING_CUBE_MAP, face: true, };
    texTargetInfo[glc.TEXTURE_CUBE_MAP_POSITIVE_Y] = { target: glc.TEXTURE_CUBE_MAP, query: glc.TEXTURE_BINDING_CUBE_MAP, face: true, };
    texTargetInfo[glc.TEXTURE_CUBE_MAP_NEGATIVE_Y] = { target: glc.TEXTURE_CUBE_MAP, query: glc.TEXTURE_BINDING_CUBE_MAP, face: true, };
    texTargetInfo[glc.TEXTURE_CUBE_MAP_POSITIVE_Z] = { target: glc.TEXTURE_CUBE_MAP, query: glc.TEXTURE_BINDING_CUBE_MAP, face: true, };
    texTargetInfo[glc.TEXTURE_CUBE_MAP_NEGATIVE_Z] = { target: glc.TEXTURE_CUBE_MAP, query: glc.TEXTURE_BINDING_CUBE_MAP, face: true, };

    const defaultTargetInfo = texTargetInfo[glc.TEXTURE_2D];

    function getTargetInfo(target) {
      return texTargetInfo[target] || defaultTargetInfo;
    }

    const formatTypeInfo = {};
    const textureInternalFormatInfo = {};
    {
        const t = textureInternalFormatInfo;
        // unsized formats
        t[glc.ALPHA]              = { format: glc.ALPHA,           colorRenderable: true,  textureFilterable: true,  bytesPerElement: [1, 2, 4],        type: [glc.UNSIGNED_BYTE, glc.HALF_FLOAT, glc.FLOAT], };
        t[glc.LUMINANCE]          = { format: glc.LUMINANCE,       colorRenderable: true,  textureFilterable: true,  bytesPerElement: [1, 2, 4],        type: [glc.UNSIGNED_BYTE, glc.HALF_FLOAT, glc.FLOAT], };
        t[glc.LUMINANCE_ALPHA]    = { format: glc.LUMINANCE_ALPHA, colorRenderable: true,  textureFilterable: true,  bytesPerElement: [2, 4, 8],        type: [glc.UNSIGNED_BYTE, glc.HALF_FLOAT, glc.FLOAT], };
        t[glc.RGB]                = { format: glc.RGB,             colorRenderable: true,  textureFilterable: true,  bytesPerElement: [3, 6, 12, 2],    type: [glc.UNSIGNED_BYTE, glc.HALF_FLOAT, glc.FLOAT, glc.UNSIGNED_SHORT_5_6_5], };
        t[glc.RGBA]               = { format: glc.RGBA,            colorRenderable: true,  textureFilterable: true,  bytesPerElement: [4, 8, 16, 2, 2], type: [glc.UNSIGNED_BYTE, glc.HALF_FLOAT, glc.FLOAT, glc.UNSIGNED_SHORT_4_4_4_4, glc.UNSIGNED_SHORT_5_5_5_1], };

        // sized formats
        t[glc.R8]                 = { format: glc.RED,             colorRenderable: true,  textureFilterable: true,  bytesPerElement:  1,         type: glc.UNSIGNED_BYTE, };
        t[glc.R8_SNORM]           = { format: glc.RED,             colorRenderable: false, textureFilterable: true,  bytesPerElement:  1,         type: glc.BYTE, };
        t[glc.R16F]               = { format: glc.RED,             colorRenderable: false, textureFilterable: true,  bytesPerElement: [2, 4],     type: [glc.HALF_FLOAT, glc.FLOAT], };
        t[glc.R32F]               = { format: glc.RED,             colorRenderable: false, textureFilterable: false, bytesPerElement:  4,         type: glc.FLOAT, };
        t[glc.R8UI]               = { format: glc.RED_INTEGER,     colorRenderable: true,  textureFilterable: false, bytesPerElement:  1,         type: glc.UNSIGNED_BYTE, };
        t[glc.R8I]                = { format: glc.RED_INTEGER,     colorRenderable: true,  textureFilterable: false, bytesPerElement:  1,         type: glc.BYTE, };
        t[glc.R16UI]              = { format: glc.RED_INTEGER,     colorRenderable: true,  textureFilterable: false, bytesPerElement:  2,         type: glc.UNSIGNED_SHORT, };
        t[glc.R16I]               = { format: glc.RED_INTEGER,     colorRenderable: true,  textureFilterable: false, bytesPerElement:  2,         type: glc.SHORT, };
        t[glc.R32UI]              = { format: glc.RED_INTEGER,     colorRenderable: true,  textureFilterable: false, bytesPerElement:  4,         type: glc.UNSIGNED_INT, };
        t[glc.R32I]               = { format: glc.RED_INTEGER,     colorRenderable: true,  textureFilterable: false, bytesPerElement:  4,         type: glc.INT, };
        t[glc.RG8]                = { format: glc.RG,              colorRenderable: true,  textureFilterable: true,  bytesPerElement:  2,         type: glc.UNSIGNED_BYTE, };
        t[glc.RG8_SNORM]          = { format: glc.RG,              colorRenderable: false, textureFilterable: true,  bytesPerElement:  2,         type: glc.BYTE, };
        t[glc.RG16F]              = { format: glc.RG,              colorRenderable: false, textureFilterable: true,  bytesPerElement: [4, 8],     type: [glc.HALF_FLOAT, glc.FLOAT], };
        t[glc.RG32F]              = { format: glc.RG,              colorRenderable: false, textureFilterable: false, bytesPerElement:  8,         type: glc.FLOAT, };
        t[glc.RG8UI]              = { format: glc.RG_INTEGER,      colorRenderable: true,  textureFilterable: false, bytesPerElement:  2,         type: glc.UNSIGNED_BYTE, };
        t[glc.RG8I]               = { format: glc.RG_INTEGER,      colorRenderable: true,  textureFilterable: false, bytesPerElement:  2,         type: glc.BYTE, };
        t[glc.RG16UI]             = { format: glc.RG_INTEGER,      colorRenderable: true,  textureFilterable: false, bytesPerElement:  4,         type: glc.UNSIGNED_SHORT, };
        t[glc.RG16I]              = { format: glc.RG_INTEGER,      colorRenderable: true,  textureFilterable: false, bytesPerElement:  4,         type: glc.SHORT, };
        t[glc.RG32UI]             = { format: glc.RG_INTEGER,      colorRenderable: true,  textureFilterable: false, bytesPerElement:  8,         type: glc.UNSIGNED_INT, };
        t[glc.RG32I]              = { format: glc.RG_INTEGER,      colorRenderable: true,  textureFilterable: false, bytesPerElement:  8,         type: glc.INT, };
        t[glc.RGB8]               = { format: glc.RGB,             colorRenderable: true,  textureFilterable: true,  bytesPerElement:  3,         type: glc.UNSIGNED_BYTE, };
        t[glc.SRGB8]              = { format: glc.RGB,             colorRenderable: false, textureFilterable: true,  bytesPerElement:  3,         type: glc.UNSIGNED_BYTE, };
        t[glc.RGB565]             = { format: glc.RGB,             colorRenderable: true,  textureFilterable: true,  bytesPerElement: [3, 2],     type: [glc.UNSIGNED_BYTE, glc.UNSIGNED_SHORT_5_6_5], };
        t[glc.RGB8_SNORM]         = { format: glc.RGB,             colorRenderable: false, textureFilterable: true,  bytesPerElement:  3,         type: glc.BYTE, };
        t[glc.R11F_G11F_B10F]     = { format: glc.RGB,             colorRenderable: false, textureFilterable: true,  bytesPerElement: [4, 6, 12], type: [glc.UNSIGNED_INT_10F_11F_11F_REV, glc.HALF_FLOAT, glc.FLOAT], };
        t[glc.RGB9_E5]            = { format: glc.RGB,             colorRenderable: false, textureFilterable: true,  bytesPerElement: [4, 6, 12], type: [glc.UNSIGNED_INT_5_9_9_9_REV, glc.HALF_FLOAT, glc.FLOAT], };
        t[glc.RGB16F]             = { format: glc.RGB,             colorRenderable: false, textureFilterable: true,  bytesPerElement: [6, 12],    type: [glc.HALF_FLOAT, glc.FLOAT], };
        t[glc.RGB32F]             = { format: glc.RGB,             colorRenderable: false, textureFilterable: false, bytesPerElement: 12,         type: glc.FLOAT, };
        t[glc.RGB8UI]             = { format: glc.RGB_INTEGER,     colorRenderable: false, textureFilterable: false, bytesPerElement:  3,         type: glc.UNSIGNED_BYTE, };
        t[glc.RGB8I]              = { format: glc.RGB_INTEGER,     colorRenderable: false, textureFilterable: false, bytesPerElement:  3,         type: glc.BYTE, };
        t[glc.RGB16UI]            = { format: glc.RGB_INTEGER,     colorRenderable: false, textureFilterable: false, bytesPerElement:  6,         type: glc.UNSIGNED_SHORT, };
        t[glc.RGB16I]             = { format: glc.RGB_INTEGER,     colorRenderable: false, textureFilterable: false, bytesPerElement:  6,         type: glc.SHORT, };
        t[glc.RGB32UI]            = { format: glc.RGB_INTEGER,     colorRenderable: false, textureFilterable: false, bytesPerElement: 12,         type: glc.UNSIGNED_INT, };
        t[glc.RGB32I]             = { format: glc.RGB_INTEGER,     colorRenderable: false, textureFilterable: false, bytesPerElement: 12,         type: glc.INT, };
        t[glc.RGBA8]              = { format: glc.RGBA,            colorRenderable: true,  textureFilterable: true,  bytesPerElement:  4,         type: glc.UNSIGNED_BYTE, };
        t[glc.SRGB8_ALPHA8]       = { format: glc.RGBA,            colorRenderable: true,  textureFilterable: true,  bytesPerElement:  4,         type: glc.UNSIGNED_BYTE, };
        t[glc.RGBA8_SNORM]        = { format: glc.RGBA,            colorRenderable: false, textureFilterable: true,  bytesPerElement:  4,         type: glc.BYTE, };
        t[glc.RGB5_A1]            = { format: glc.RGBA,            colorRenderable: true,  textureFilterable: true,  bytesPerElement: [4, 2, 4],  type: [glc.UNSIGNED_BYTE, glc.UNSIGNED_SHORT_5_5_5_1, glc.UNSIGNED_INT_2_10_10_10_REV], };
        t[glc.RGBA4]              = { format: glc.RGBA,            colorRenderable: true,  textureFilterable: true,  bytesPerElement: [4, 2],     type: [glc.UNSIGNED_BYTE, glc.UNSIGNED_SHORT_4_4_4_4], };
        t[glc.RGB10_A2]           = { format: glc.RGBA,            colorRenderable: true,  textureFilterable: true,  bytesPerElement:  4,         type: glc.UNSIGNED_INT_2_10_10_10_REV, };
        t[glc.RGBA16F]            = { format: glc.RGBA,            colorRenderable: false, textureFilterable: true,  bytesPerElement: [8, 16],    type: [glc.HALF_FLOAT, glc.FLOAT], };
        t[glc.RGBA32F]            = { format: glc.RGBA,            colorRenderable: false, textureFilterable: false, bytesPerElement: 16,         type: glc.FLOAT, };
        t[glc.RGBA8UI]            = { format: glc.RGBA_INTEGER,    colorRenderable: true,  textureFilterable: false, bytesPerElement:  4,         type: glc.UNSIGNED_BYTE, };
        t[glc.RGBA8I]             = { format: glc.RGBA_INTEGER,    colorRenderable: true,  textureFilterable: false, bytesPerElement:  4,         type: glc.BYTE, };
        t[glc.RGB10_A2UI]         = { format: glc.RGBA_INTEGER,    colorRenderable: true,  textureFilterable: false, bytesPerElement:  4,         type: glc.UNSIGNED_INT_2_10_10_10_REV, };
        t[glc.RGBA16UI]           = { format: glc.RGBA_INTEGER,    colorRenderable: true,  textureFilterable: false, bytesPerElement:  8,         type: glc.UNSIGNED_SHORT, };
        t[glc.RGBA16I]            = { format: glc.RGBA_INTEGER,    colorRenderable: true,  textureFilterable: false, bytesPerElement:  8,         type: glc.SHORT, };
        t[glc.RGBA32I]            = { format: glc.RGBA_INTEGER,    colorRenderable: true,  textureFilterable: false, bytesPerElement: 16,         type: glc.INT, };
        t[glc.RGBA32UI]           = { format: glc.RGBA_INTEGER,    colorRenderable: true,  textureFilterable: false, bytesPerElement: 16,         type: glc.UNSIGNED_INT, };
        // Sized Internal FormatFormat	Type	Depth Bits	Stencil Bits
        t[glc.DEPTH_COMPONENT16]  = { format: glc.DEPTH_COMPONENT, colorRenderable: true,  textureFilterable: false, bytesPerElement: [2, 4],     type: [glc.UNSIGNED_SHORT, glc.UNSIGNED_INT], };
        t[glc.DEPTH_COMPONENT24]  = { format: glc.DEPTH_COMPONENT, colorRenderable: true,  textureFilterable: false, bytesPerElement:  4,         type: glc.UNSIGNED_INT, };
        t[glc.DEPTH_COMPONENT32F] = { format: glc.DEPTH_COMPONENT, colorRenderable: true,  textureFilterable: false, bytesPerElement:  4,         type: glc.FLOAT, };
        t[glc.DEPTH24_STENCIL8]   = { format: glc.DEPTH_STENCIL,   colorRenderable: true,  textureFilterable: false, bytesPerElement:  4,         type: glc.UNSIGNED_INT_24_8, };
        t[glc.DEPTH32F_STENCIL8]  = { format: glc.DEPTH_STENCIL,   colorRenderable: true,  textureFilterable: false, bytesPerElement:  4,         type: glc.FLOAT_32_UNSIGNED_INT_24_8_REV, };

        Object.keys(t).forEach(function(internalFormat) {
            const info = t[internalFormat];
            info.bytesPerElementMap = {};

            const formatToTypeMap = formatTypeInfo[info.format] || {};
            formatTypeInfo[info.format] = formatToTypeMap;

            if (Array.isArray(info.bytesPerElement)) {
                info.bytesPerElement.forEach(function(bytesPerElement, ndx) {
                    const type = info.type[ndx];
                    info.bytesPerElementMap[type] = bytesPerElement;
                    formatToTypeMap[type] = bytesPerElement;
                });
            } else {
                const type = info.type;
                info.bytesPerElementMap[type] = info.bytesPerElement;
                formatToTypeMap[type] = info.bytesPerElement;
            }
        });
    }

    function calculateNumSourceBytes(width, height, depth, internalFormat, format, type) {
        const formatToTypeMap = formatTypeInfo[format];
        const bytesPerElement = formatToTypeMap[type];
        return width * height * depth * bytesPerElement;
    }

    var Texture = function (gl, frameNumber, stack, target) {
        base.subclass(Resource, this, [gl, frameNumber, stack, target]);
        this.creationOrder = 1;

        this.defaultName = "Texture " + this.id;

        this.type = gl.TEXTURE_2D; // TEXTURE_2D, TEXTURE_CUBE_MAP

        this.parameters = {};
        this.parameters[gl.TEXTURE_MAG_FILTER] = gl.LINEAR;
        this.parameters[gl.TEXTURE_MIN_FILTER] = gl.NEAREST_MIPMAP_LINEAR;
        this.parameters[gl.TEXTURE_WRAP_S] = gl.REPEAT;
        this.parameters[gl.TEXTURE_WRAP_T] = gl.REPEAT;

        if (util.isWebGL2(gl)) {
            this.parameters[gl.TEXTURE_BASE_LEVEL] = 0;
            this.parameters[gl.TEXTURE_COMPARE_FUNC] = gl.LEQUAL;
            this.parameters[gl.TEXTURE_COMPARE_MODE] = gl.NONE;
            this.parameters[gl.TEXTURE_MIN_LOD] = -1000;
            this.parameters[gl.TEXTURE_MAX_LOD] = 1000;
            this.parameters[gl.TEXTURE_MAX_LEVEL] = 1000;
            this.parameters[gl.TEXTURE_WRAP_R] = gl.REPEAT;
        }

        // TODO: handle TEXTURE_MAX_ANISOTROPY_EXT

        this.currentVersion.target = this.type;
        this.currentVersion.setParameters(this.parameters);

        this.estimatedSize = 0;
    };

    Texture.prototype.guessSize = function (gl, version, face) {
        version = version || this.currentVersion;
        for (var n = version.calls.length - 1; n >= 0; n--) {
            var call = version.calls[n];
            if (call.name == "texImage2D") {
                // Ignore all but level 0
                if (call.args[1]) {
                    continue;
                }
                if (face) {
                    if (call.args[0] != face) {
                        continue;
                    }
                }
                if (call.args.length == 9) {
                    return [call.args[3], call.args[4]];
                } else {
                    var sourceObj = call.args[5];
                    if (sourceObj) {
                        return [sourceObj.width, sourceObj.height];
                    } else {
                        return null;
                    }
                }
            } else if (call.name == "compressedTexImage2D") {
                // Ignore all but level 0
                if (call.args[1]) {
                    continue;
                }
                if (face) {
                    if (call.args[0] != face) {
                        continue;
                    }
                }
                return [call.args[3], call.args[4]];
            }
        }
        return null;
    };

    const webgl1RefreshParamEnums = [
        glc.TEXTURE_MAG_FILTER,
        glc.TEXTURE_MIN_FILTER,
        glc.TEXTURE_WRAP_S,
        glc.TEXTURE_WRAP_T,
    ];

    const webgl2RefreshParamEnums = [
        ...webgl1RefreshParamEnums,
        glc.TEXTURE_BASE_LEVEL,
        glc.TEXTURE_COMPARE_FUNC,
        glc.TEXTURE_COMPARE_MODE,
        glc.TEXTURE_MIN_LOD,
        glc.TEXTURE_MAX_LOD,
        glc.TEXTURE_MAX_LEVEL,
        glc.TEXTURE_WRAP_R,
    ];

    Texture.prototype.refresh = function (gl) {
        var paramEnums = util.isWebGL2(gl) ? webgl2RefreshParamEnums : webgl1RefreshParamEnums;
        for (var n = 0; n < paramEnums.length; n++) {
            this.parameters[paramEnums[n]] = gl.getTexParameter(this.type, paramEnums[n]);
        }
    };

    Texture.getTracked = function (gl, args) {
        const bindingEnum = getTargetInfo(args[0]).query;
        var gltexture = gl.rawgl.getParameter(bindingEnum);
        if (gltexture == null) {
            // Going to fail
            return null;
        }
        return gltexture.trackedObject;
    };

    Texture.setCaptures = function (gl) {
        // TODO: copyTexImage2D
        // TODO: copyTexSubImage2D

        var original_texParameterf = gl.texParameterf;
        gl.texParameterf = function (target) {
            var tracked = Texture.getTracked(gl, arguments);
            if (tracked) {
                tracked.type = getTargetInfo(target).target;
                tracked.parameters[arguments[1]] = arguments[2];
                tracked.markDirty(false);
                tracked.currentVersion.target = tracked.type;
                tracked.currentVersion.setParameters(tracked.parameters);
            }

            return original_texParameterf.apply(gl, arguments);
        };
        var original_texParameteri = gl.texParameteri;
        gl.texParameteri = function (target) {
            var tracked = Texture.getTracked(gl, arguments);
            if (tracked) {
                tracked.type = getTargetInfo(target).target;
                tracked.parameters[arguments[1]] = arguments[2];
                tracked.markDirty(false);
                tracked.currentVersion.target = tracked.type;
                tracked.currentVersion.setParameters(tracked.parameters);
            }

            return original_texParameteri.apply(gl, arguments);
        };

        function pushPixelStoreState(gl, version) {
            var pixelStoreEnums = [gl.PACK_ALIGNMENT, gl.UNPACK_ALIGNMENT, gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.UNPACK_FLIP_Y_WEBGL, gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL];
            for (var n = 0; n < pixelStoreEnums.length; n++) {
                var pixelStoreEnum = pixelStoreEnums[n];
                if (pixelStoreEnum === undefined) {
                    continue;
                }
                var value = gl.getParameter(pixelStoreEnums[n]);
                version.pushCall("pixelStorei", [pixelStoreEnum, value]);
            }
        };

        var original_texImage2D = gl.texImage2D;
        gl.texImage2D = function (target) {
            // Track texture writes
            var totalBytes = 0;
            if (arguments.length == 9) {
                totalBytes = calculateNumSourceBytes(arguments[3], arguments[4], 1, arguments[2], arguments[6], arguments[7]);
            } else {
                var sourceArg = arguments[5];
                var width = sourceArg.width;
                var height = sourceArg.height;
                totalBytes = calculateNumSourceBytes(width, height, 1, arguments[2], arguments[3], arguments[4]);
            }
            gl.statistics.textureWrites.value += totalBytes;

            var tracked = Texture.getTracked(gl, arguments);
            if (tracked) {
                const targetInfo = getTargetInfo(target);
                tracked.type = targetInfo.target;

                // Track total texture bytes consumed
                gl.statistics.textureBytes.value -= tracked.estimatedSize;
                gl.statistics.textureBytes.value += totalBytes;
                tracked.estimatedSize = totalBytes;

                // If !face texture this is always a reset, otherwise it may be a single face of the cube
                if (!targetInfo.face) {
                    tracked.markDirty(true);
                    tracked.currentVersion.setParameters(tracked.parameters);
                } else {
                    // Cube face - always partial
                    tracked.markDirty(false);
                }
                tracked.currentVersion.target = tracked.type;

                pushPixelStoreState(gl.rawgl, tracked.currentVersion);
                tracked.currentVersion.pushCall("texImage2D", arguments);

                // If this is an upload from something with a URL and we haven't been named yet, auto name us
                if (arguments.length == 6) {
                    var sourceArg = arguments[5];
                    if (sourceArg && sourceArg.src) {
                        if (!tracked.target.displayName) {
                            var filename = sourceArg.src;
                            var lastSlash = filename.lastIndexOf("/");
                            if (lastSlash >= 0) {
                                filename = filename.substr(lastSlash + 1);
                            }
                            var lastDot = filename.lastIndexOf(".");
                            if (lastDot >= 0) {
                                filename = filename.substr(0, lastDot);
                            }
                            tracked.setName(filename, true);
                        }
                    }
                }
            }

            return original_texImage2D.apply(gl, arguments);
        };

        var original_texSubImage2D = gl.texSubImage2D;
        gl.texSubImage2D = function (target) {
            // Track texture writes
            var totalBytes = 0;
            if (arguments.length == 9) {
                totalBytes = calculateNumSourceBytes(arguments[4], arguments[5], 1, undefined, arguments[6], arguments[7]);
            } else {
                var sourceArg = arguments[6];
                var width = sourceArg.width;
                var height = sourceArg.height;
                totalBytes = calculateNumSourceBytes(width, height, 1, undefined, arguments[4], arguments[5]);
            }
            gl.statistics.textureWrites.value += totalBytes;

            var tracked = Texture.getTracked(gl, arguments);
            if (tracked) {
                tracked.type = getTargetInfo(target).target;
                tracked.markDirty(false);
                tracked.currentVersion.target = tracked.type;
                pushPixelStoreState(gl.rawgl, tracked.currentVersion);
                tracked.currentVersion.pushCall("texSubImage2D", arguments);
            }

            return original_texSubImage2D.apply(gl, arguments);
        };

        var original_compressedTexImage2D = gl.compressedTexImage2D;
        gl.compressedTexImage2D = function (target) {
            // Track texture writes
            var totalBytes = 0;
            switch (arguments[2]) {
                case glc.COMPRESSED_RGB_S3TC_DXT1_EXT:
                case glc.COMPRESSED_RGBA_S3TC_DXT1_EXT:
                    totalBytes = Math.floor((arguments[3] + 3) / 4) * Math.floor((arguments[4] + 3) / 4) * 8;
                    break;
                case glc.COMPRESSED_RGBA_S3TC_DXT3_EXT:
                case glc.COMPRESSED_RGBA_S3TC_DXT5_EXT:
                    totalBytes = Math.floor((arguments[3] + 3) / 4) * Math.floor((arguments[4] + 3) / 4) * 16;
                    break;
            }
            gl.statistics.textureWrites.value += totalBytes;

            var tracked = Texture.getTracked(gl, arguments);
            if (tracked) {
                tracked.type = getTargetInfo(target).target;

                // Track total texture bytes consumed
                gl.statistics.textureBytes.value -= tracked.estimatedSize;
                gl.statistics.textureBytes.value += totalBytes;
                tracked.estimatedSize = totalBytes;

                // If a 2D texture this is always a reset, otherwise it may be a single face of the cube
                // Note that we don't reset if we are adding extra levels.
                if (arguments[1] == 0 && arguments[0] == gl.TEXTURE_2D) {
                    tracked.markDirty(true);
                    tracked.currentVersion.setParameters(tracked.parameters);
                } else {
                    // Cube face - always partial
                    tracked.markDirty(false);
                }
                tracked.currentVersion.target = tracked.type;

                pushPixelStoreState(gl.rawgl, tracked.currentVersion);
                tracked.currentVersion.pushCall("compressedTexImage2D", arguments);
            }

            return original_compressedTexImage2D.apply(gl, arguments);
        };

        var original_compressedTexSubImage2D = gl.compressedTexSubImage2D;
        gl.compressedTexSubImage2D = function (target) {
            // Track texture writes
            var totalBytes = 0;
            switch (arguments[2]) {
                case glc.COMPRESSED_RGB_S3TC_DXT1_EXT:
                case glc.COMPRESSED_RGBA_S3TC_DXT1_EXT:
                    totalBytes = Math.floor((arguments[4] + 3) / 4) * Math.floor((arguments[5] + 3) / 4) * 8;
                    break;
                case glc.COMPRESSED_RGBA_S3TC_DXT3_EXT:
                case glc.COMPRESSED_RGBA_S3TC_DXT5_EXT:
                    totalBytes = Math.floor((arguments[4] + 3) / 4) * Math.floor((arguments[5] + 3) / 4) * 16;
                    break;
            }
            gl.statistics.textureWrites.value += totalBytes;

            var tracked = Texture.getTracked(gl, arguments);
            if (tracked) {
                tracked.type = getTargetInfo(target).target;
                tracked.markDirty(false);
                tracked.currentVersion.target = tracked.type;
                pushPixelStoreState(gl.rawgl, tracked.currentVersion);
                tracked.currentVersion.pushCall("compressedTexSubImage2D", arguments);
            }

            return original_compressedTexSubImage2D.apply(gl, arguments);
        };

        var original_generateMipmap = gl.generateMipmap;
        gl.generateMipmap = function (target) {
            var tracked = Texture.getTracked(gl, arguments);
            if (tracked) {
                tracked.type = getTargetInfo(target).target;
                // TODO: figure out what to do with mipmaps
                pushPixelStoreState(gl.rawgl, tracked.currentVersion);
                tracked.currentVersion.pushCall("generateMipmap", arguments);
            }

            return original_generateMipmap.apply(gl, arguments);
        };

        var original_readPixels = gl.readPixels;
        gl.readPixels = function () {
            var result = original_readPixels.apply(gl, arguments);
            if (result) {
                // Track texture reads
                // NOTE: only RGBA is supported for reads
                var totalBytes = arguments[2] * arguments[3] * 4;
                gl.statistics.textureReads.value += totalBytes;
            }
            return result;
        };
    };

    // If a face is supplied the texture created will be a 2D texture containing only the given face
    Texture.prototype.createTarget = function (gl, version, options, face) {
        options = options || {};
        var target = version.target;
        if (face) {
            target = gl.TEXTURE_2D;
        }

        var texture = gl.createTexture();
        gl.bindTexture(target, texture);

        for (var n in version.parameters) {
            gl.texParameteri(target, parseInt(n), version.parameters[n]);
        }

        this.replayCalls(gl, version, texture, function (call, args) {
            // Filter uploads if requested
            if (options.ignoreTextureUploads) {
                if ((call.name === "texImage2D") ||
                    (call.name === "texSubImage2D") ||
                    (call.name === "compressedTexImage2D") ||
                    (call.name === "compressedTexSubImage2D") ||
                    (call.name === "generateMipmap")) {
                    return false;
                }
            }

            // Filter non-face calls and rewrite the target if this is a face-specific call
            if ((call.name == "texImage2D") ||
                (call.name == "texSubImage2D") ||
                (call.name == "compressedTexImage2D") ||
                (call.name == "compressedTexSubImage2D")) {
                if (face && (args.length > 0)) {
                    if (args[0] != face) {
                        return false;
                    }
                    args[0] = gl.TEXTURE_2D;
                }
            } else if (call.name == "generateMipmap") {
                args[0] = target;
            }

            return true;
        });

        return texture;
    };

    Texture.prototype.deleteTarget = function (gl, target) {
        gl.deleteTexture(target);
    };

    return Texture;

});
