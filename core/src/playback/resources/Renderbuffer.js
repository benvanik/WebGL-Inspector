(function () {
    var resources = glinamespace("gli.playback.resources");

    var Renderbuffer = function Renderbuffer(session, source) {
        this.super.call(this, session, source);
    };
    glisubclass(gli.playback.resources.Resource, Renderbuffer);
    Renderbuffer.prototype.creationOrder = 2;

    Renderbuffer.prototype.createTargetValue = function createTargetValue(gl, options, version) {
        var value = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, value);
        return value;
    };

    Renderbuffer.prototype.deleteTargetValue = function deleteTargetValue(gl, value) {
        gl.deleteRenderbuffer(value);
    };

    resources.Renderbuffer = Renderbuffer;

})();
