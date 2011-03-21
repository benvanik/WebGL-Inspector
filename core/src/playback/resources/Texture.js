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

    resources.Texture = Texture;

})();
