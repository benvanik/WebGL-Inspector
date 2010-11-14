(function () {
    var resources = glinamespace("gli.resources");

    var Texture = function (gl, frameNumber, stack, target) {
        glisubclass(gli.host.Resource, this, [gl, frameNumber, stack, target]);

        this.defaultName = "Texture " + this.id;

        this.type = gl.TEXTURE_2D; // TEXTURE_2D, TEXTURE_CUBE_MAP

        this.parameters = {};
        this.parameters[gl.TEXTURE_MAG_FILTER] = gl.LINEAR;
        this.parameters[gl.TEXTURE_MIN_FILTER] = gl.NEAREST_MIPMAP_LINEAR;
        this.parameters[gl.TEXTURE_WRAP_S] = gl.REPEAT;
        this.parameters[gl.TEXTURE_WRAP_T] = gl.REPEAT;

        this.currentVersion.target = this.type;
        this.currentVersion.setParameters(this.parameters);
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
        var gltexture = gl.getParameter(bindingEnum);
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
            tracked.type = arguments[0];
            tracked.parameters[arguments[1]] = arguments[2];
            tracked.markDirty(false);
            tracked.currentVersion.target = tracked.type;
            tracked.currentVersion.setParameters(tracked.parameters);
            return original_texParameterf.apply(gl, arguments);
        };
        var original_texParameteri = gl.texParameteri;
        gl.texParameteri = function () {
            var tracked = Texture.getTracked(gl, arguments);
            tracked.type = arguments[0];
            tracked.parameters[arguments[1]] = arguments[2];
            tracked.markDirty(false);
            tracked.currentVersion.target = tracked.type;
            tracked.currentVersion.setParameters(tracked.parameters);
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
        gl.texImage2D = function () {
            var tracked = Texture.getTracked(gl, arguments);
            tracked.type = arguments[0];

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
            return original_texImage2D.apply(gl, arguments);
        };

        var original_texSubImage2D = gl.texSubImage2D;
        gl.texSubImage2D = function () {
            var tracked = Texture.getTracked(gl, arguments);
            tracked.type = arguments[0];
            tracked.markDirty(false);
            tracked.currentVersion.target = tracked.type;
            pushPixelStoreState(gl, tracked.currentVersion);
            tracked.currentVersion.pushCall("texSubImage2D", arguments);
            return original_texSubImage2D.apply(gl, arguments);
        };

        var original_generateMipmap = gl.generateMipmap;
        gl.generateMipmap = function () {
            var tracked = Texture.getTracked(gl, arguments);
            tracked.type = arguments[0];
            // TODO: figure out what to do with mipmaps
            pushPixelStoreState(gl, tracked.currentVersion);
            tracked.currentVersion.pushCall("generateMipmap", arguments);
            return original_generateMipmap.apply(gl, arguments);
        };
    };

    // If a face is supplied the texture created will be a 2D texture containing only the given face
    Texture.prototype.createTarget = function (gl, version, face) {
        var target = version.target;
        if (face) {
            target = gl.TEXTURE_2D;
        }

        var texture = gl.createTexture();
        gl.bindTexture(target, texture);

        for (var n in version.parameters) {
            gl.texParameteri(target, parseInt(n), version.parameters[n]);
        }

        for (var n = 0; n < version.calls.length; n++) {
            var call = version.calls[n];

            var args = [];
            for (var m = 0; m < call.args.length; m++) {
                // TODO: unpack refs?
                args[m] = call.args[m];
            }

            // Filter non-face calls and rewrite the target if this is a face-specific call
            if ((call.name == "texImage2D") || (call.name == "texSubImage2D")) {
                if (face && (args.length > 0)) {
                    if (args[0] != face) {
                        continue;
                    }
                    args[0] = gl.TEXTURE_2D;
                }
            } else if (call.name == "generateMipmap") {
                args[0] = target;
            }

            gl[call.name].apply(gl, args);
        }

        return texture;
    };

    Texture.prototype.deleteTarget = function (gl, target) {
        gl.deleteTexture(target);
    };

    resources.Texture = Texture;

})();
