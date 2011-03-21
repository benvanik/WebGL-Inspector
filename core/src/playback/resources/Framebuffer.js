(function () {
    var resources = glinamespace("gli.playback.resources");

    var Framebuffer = function Framebuffer(session, source) {
        this.super.call(this, session, source);
    };
    glisubclass(gli.playback.resources.Resource, Framebuffer);
    Framebuffer.prototype.creationOrder = 3;

    Framebuffer.prototype.createTargetValue = function createTargetValue(gl, options, version) {
        var value = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, value);
        return value;
    };
    
    Framebuffer.prototype.deleteTargetValue = function deleteTargetValue(gl, value) {
        gl.deleteFramebuffer(value);
    };

    resources.Framebuffer = Framebuffer;

})();
