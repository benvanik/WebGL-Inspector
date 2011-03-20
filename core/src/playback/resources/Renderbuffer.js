(function () {
    var resources = glinamespace("gli.playback.resources");

    var Renderbuffer = function Renderbuffer(session, source) {
        this.super.call(this, session, source);
    };
    glisubclass(gli.playback.resources.Resource, Renderbuffer);
    Renderbuffer.prototype.creationOrder = 2;

    resources.Renderbuffer = Renderbuffer;

})();
