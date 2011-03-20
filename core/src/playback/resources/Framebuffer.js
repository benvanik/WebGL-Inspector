(function () {
    var resources = glinamespace("gli.playback.resources");

    var Framebuffer = function Framebuffer(session, source) {
        glisubclass(gli.playback.resources.Resource, this, [session, source]);
    };
    Framebuffer.prototype.creationOrder = 3;

    resources.Framebuffer = Framebuffer;

})();
