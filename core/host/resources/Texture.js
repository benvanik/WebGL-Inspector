(function () {
    var resources = glinamespace("gli.resources");

    var Texture = function (gl, frameNumber, stack, target) {
        glisubclass(gli.host.Resource, this, [gl, frameNumber, stack, target]);
        this.creationOrder = 1;

        this.defaultName = "Texture " + this.id;

        this.type = gl.TEXTURE_2D; // TEXTURE_2D, TEXTURE_CUBE_MAP

        this.parameters = {};
        this.parameters[gl.TEXTURE_MAG_FILTER] = gl.LINEAR;
        this.parameters[gl.TEXTURE_MIN_FILTER] = gl.NEAREST_MIPMAP_LINEAR;
        this.parameters[gl.TEXTURE_WRAP_S] = gl.REPEAT;
        this.parameters[gl.TEXTURE_WRAP_T] = gl.REPEAT;

        this.currentVersion.target = this.type;
        this.currentVersion.setParameters(this.parameters);

        this.estimatedSize = 0;
    };

    Texture.prototype.guessSize = function (gl, version, face) {
        version = version || this.currentVersion;
        for (var n = version.calls.length - 1; n >= 0; n--) {
            var call = version.calls[n];
            if (call.name == "texImage2D") {
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
            }
        }
        return null;
    };

    Texture.prototype.refresh = function (gl) {
        var paramEnums = [gl.TEXTURE_MAG_FILTER, gl.TEXTURE_MIN_FILTER, gl.TEXTURE_WRAP_S, gl.TEXTURE_WRAP_T];
        for (var n = 0; n < paramEnums.length; n++) {
            this.parameters[paramEnums[n]] = gl.getTexParameter(this.type, paramEnums[n]);
        }
    };

    Texture.getTracked = function (gl, args) {
        var bindingEnum;
        switch (args[0]) {
            case gl.TEXTURE_2D:
                bindingEnum = gl.TEXTURE_BINDING_2D;
                break;
            case gl.TEXTURE_CUBE_MAP:
            case gl.TEXTURE_CUBE_MAP_POSITIVE_X:
            case gl.TEXTURE_CUBE_MAP_NEGATIVE_X:
            case gl.TEXTURE_CUBE_MAP_POSITIVE_Y:
            case gl.TEXTURE_CUBE_MAP_NEGATIVE_Y:
            case gl.TEXTURE_CUBE_MAP_POSITIVE_Z:
            case gl.TEXTURE_CUBE_MAP_NEGATIVE_Z:
                bindingEnum = gl.TEXTURE_BINDING_CUBE_MAP;
                break;
        }
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
        gl.texParameterf = function () {
            var tracked = Texture.getTracked(gl, arguments);
            if (tracked) {
                tracked.type = arguments[0];
                tracked.parameters[arguments[1]] = arguments[2];
                tracked.markDirty(false);
                tracked.currentVersion.target = tracked.type;
                tracked.currentVersion.setParameters(tracked.parameters);
            }

            return original_texParameterf.apply(gl, arguments);
        };
        var original_texParameteri = gl.texParameteri;
        gl.texParameteri = function () {
            var tracked = Texture.getTracked(gl, arguments);
            if (tracked) {
                tracked.type = arguments[0];
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

        function calculateBpp(gl, format, type) {
            switch (type) {
                default:
                case gl.UNSIGNED_BYTE:
                    switch (format) {
                        case gl.ALPHA:
                        case gl.LUMINANCE:
                            return 1;
                        case gl.LUMINANCE_ALPHA:
                            return 2;
                        case gl.RGB:
                            return 3;
                        default:
                        case gl.RGBA:
                            return 4;
                    }
                    return 4;
                case gl.UNSIGNED_SHORT_5_6_5:
                    return 2;
                case gl.UNSIGNED_SHORT_4_4_4_4:
                    return 2;
                case gl.UNSIGNED_SHORT_5_5_5_1:
                    return 2;
            }
        };

        var original_texImage2D = gl.texImage2D;
        gl.texImage2D = function () {
            // Track texture writes
            var totalBytes = 0;
            if (arguments.length == 9) {
                totalBytes = arguments[3] * arguments[4] * calculateBpp(gl, arguments[6], arguments[7]);
            } else {
                var sourceArg = arguments[5];
                var width = sourceArg.width;
                var height = sourceArg.height;
                totalBytes = width * height * calculateBpp(gl, arguments[3], arguments[4]);
            }
            gl.statistics.textureWrites.value += totalBytes;

            var tracked = Texture.getTracked(gl, arguments);
            if (tracked) {
                tracked.type = arguments[0];

                // Track total texture bytes consumed
                gl.statistics.textureBytes.value -= tracked.estimatedSize;
                gl.statistics.textureBytes.value += totalBytes;
                tracked.estimatedSize = totalBytes;

                // If a 2D texture this is always a reset, otherwise it may be a single face of the cube
                if (arguments[0] == gl.TEXTURE_2D) {
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
        gl.texSubImage2D = function () {
            // Track texture writes
            var totalBytes = 0;
            if (arguments.length == 9) {
                totalBytes = arguments[4] * arguments[5] * calculateBpp(gl, arguments[6], arguments[7]);
            } else {
                var sourceArg = arguments[6];
                var width = sourceArg.width;
                var height = sourceArg.height;
                totalBytes = width * height * calculateBpp(gl, arguments[4], arguments[5]);
            }
            gl.statistics.textureWrites.value += totalBytes;

            var tracked = Texture.getTracked(gl, arguments);
            if (tracked) {
                tracked.type = arguments[0];
                tracked.markDirty(false);
                tracked.currentVersion.target = tracked.type;
                pushPixelStoreState(gl.rawgl, tracked.currentVersion);
                tracked.currentVersion.pushCall("texSubImage2D", arguments);
            }

            return original_texSubImage2D.apply(gl, arguments);
        };

        var original_generateMipmap = gl.generateMipmap;
        gl.generateMipmap = function () {
            var tracked = Texture.getTracked(gl, arguments);
            if (tracked) {
                tracked.type = arguments[0];
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
                if ((call.name == "texImage2D") || (call.name == "texSubImage2D")) {
                    return false;
                }
            }

            // Filter non-face calls and rewrite the target if this is a face-specific call
            if ((call.name == "texImage2D") || (call.name == "texSubImage2D")) {
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

    resources.Texture = Texture;

})();
