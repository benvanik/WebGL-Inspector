(function () {
    var resources = glinamespace("gli.playback.resources");

    var Buffer = function Buffer(session, source) {
        this.super.call(this, session, source);
    };
    glisubclass(gli.playback.resources.Resource, Buffer);
    Buffer.prototype.creationOrder = 0;

    Buffer.prototype.createTargetValue = function createTargetValue(gl, options, version) {
        return gl.createBuffer();
    };

    Buffer.prototype.deleteTargetValue = function deleteTargetValue(gl, value) {
        gl.deleteBuffer(value);
    };

    resources.Buffer = Buffer;

})();
