(function () {
    var resources = glinamespace("gli.playback.resources");

    var Framebuffer = function Framebuffer(session, source) {
        this.super.call(this, session, source);
    };
    glisubclass(gli.playback.resources.Resource, Framebuffer);
    Framebuffer.prototype.creationOrder = 3;

    Framebuffer.prototype.createTarget = function createTarget(version, options) {
        //
        return null;
    };

    Framebuffer.prototype.deleteTarget = function deleteTarget(value) {
        //
    };

    resources.Framebuffer = Framebuffer;

})();