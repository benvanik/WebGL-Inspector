(function () {
    var resources = glinamespace("gli.playback.resources");

    var Buffer = function Buffer(session, source) {
        this.super.call(this, session, source);
    };
    glisubclass(gli.playback.resources.Resource, Buffer);
    Buffer.prototype.creationOrder = 0;
    
    Buffer.prototype.determineTarget = function determineTarget(version) {
        for (var n = 0; n < version.calls.length; n++) {
            var call = version.calls[n];
            switch (call.name) {
                case "bufferData":
                case "bufferSubData":
                    return call.args[0];
                    break;
            }
        }
        return null;
    };

    Buffer.prototype.createTargetValue = function createTargetValue(gl, options, version) {
        var target = this.determineTarget(version);
        if (!target) {
            return null;
        }
        var value = gl.createBuffer();
        gl.bindBuffer(target, value);
        return value;
    };

    Buffer.prototype.deleteTargetValue = function deleteTargetValue(gl, value) {
        gl.deleteBuffer(value);
    };

    resources.Buffer = Buffer;

})();
