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

    Framebuffer.getActiveTarget = function getActiveTarget(gl, args) {
        // only FRAMEBUFFER
        var bindingEnum = gl.FRAMEBUFFER_BINDING;
        return gl.getParameter(bindingEnum);
    };
    
    Framebuffer.setupCaptures = function setupCaptures(pool) {
        var dirtyingCalls = [
            "framebufferRenderbuffer",
            "framebufferTexture2D"
        ];
        gli.playback.resources.Resource.buildDirtiers(pool, dirtyingCalls, Framebuffer.getActiveTarget);
    };

    resources.Framebuffer = Framebuffer;

})();
