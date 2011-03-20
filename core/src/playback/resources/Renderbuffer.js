(function () {
    var resources = glinamespace("gli.playback.resources");

    var Renderbuffer = function Renderbuffer(session, source) {
        glisubclass(gli.playback.resources.Resource, this, [session, source]);
    };
    Renderbuffer.prototype.creationOrder = 2;

    resources.Renderbuffer = Renderbuffer;

})();
