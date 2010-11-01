(function () {
    var resources = glinamespace("gli.resources");

    var Texture = function (gl, frameNumber, stack, target) {
        glisubclass(gli.host.Resource, this, [gl, frameNumber, stack, target]);

        this.type = gl.TEXTURE_2D; // TEXTURE_2D, TEXTURE_CUBE_MAP

        this.parameters = {};
        this.parameters[gl.TEXTURE_MAG_FILTER] = gl.LINEAR;
        this.parameters[gl.TEXTURE_MIN_FILTER] = gl.NEAREST_MIPMAP_LINEAR;
        this.parameters[gl.TEXTURE_WRAP_S] = gl.REPEAT;
        this.parameters[gl.TEXTURE_WRAP_T] = gl.REPEAT;

        this.currentVersion.target = this.type;
        this.currentVersion.setParameters(this.parameters);
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
                var enum = pixelStoreEnums[n];
                if (enum === undefined) {
                    continue;
                }
                var value = gl.getParameter(pixelStoreEnums[n]);
                version.pushCall("pixelStorei", [enum, value]);
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

    Texture.prototype.createTarget = function (gl, version) {
        var texture = gl.createTexture();
        gl.bindTexture(version.target, texture);

        for (var n in version.parameters) {
            gl.texParameteri(version.target, parseInt(n), version.parameters[n]);
        }

        for (var n = 0; n < version.calls.length; n++) {
            var call = version.calls[n];

            var args = [];
            for (var m = 0; m < call.args.length; m++) {
                // TODO: unpack refs?
                args[m] = call.args[m];
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
