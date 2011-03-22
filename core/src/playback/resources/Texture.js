(function () {
    var resources = glinamespace("gli.playback.resources");

    var Texture = function Texture(session, source) {
        this.super.call(this, session, source);
    };
    glisubclass(gli.playback.resources.Resource, Texture);
    Texture.prototype.creationOrder = 1;
    
    Texture.prototype.determineTarget = function determineTarget(version) {
        for (var n = 0; n < version.calls.length; n++) {
            var call = version.calls[n];
            switch (call.name) {
                case "texParameterf":
                case "texParameteri":
                case "texImage2D":
                case "texSubImage2D":
                case "copyTexImage2D":
                case "copyTexSubImage2D":
                case "generateMipmap":
                    return call.args[0];
            }
        }
        return null;
    };

    Texture.prototype.createTargetValue = function createTargetValue(gl, options, version) {
        var target = this.determineTarget(version);
        if (!target) {
            return null;
        }
        var value = gl.createTexture();
        gl.bindTexture(target, value);
        return value;
    };

    Texture.prototype.deleteTargetValue = function deleteTargetValue(gl, value) {
        gl.deleteTexture(value);
    };

    Texture.getActiveTarget = function getActiveTarget(gl, args) {
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
            default:
                console.log("Unknown texture binding type");
                break;
        }
        return gl.getParameter(bindingEnum);
    };
    
    Texture.setupCaptures = function setupCaptures(pool) {
        var dirtyingCalls = [
            "copyTexImage2D",
            "copyTexSubImage2D",
            "texParameteri",
            "texParameterf",
            "texImage2D",
            "texSubImage2D",
            "generateMipmap"
        ];
        gli.playback.resources.Resource.buildDirtiers(pool, dirtyingCalls, Texture.getActiveTarget);
    };

    resources.Texture = Texture;

})();
