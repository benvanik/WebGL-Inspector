(function () {
    var resources = glinamespace("gli.playback.resources");

    var Renderbuffer = function Renderbuffer(session, source) {
        this.super.call(this, session, source);
    };
    glisubclass(gli.playback.resources.Resource, Renderbuffer);
    Renderbuffer.prototype.creationOrder = 2;

    Renderbuffer.prototype.createTarget = function createTarget(version, options) {
        //
        return null;
    };

    Renderbuffer.prototype.deleteTarget = function deleteTarget(value) {
        //
    };

    resources.Renderbuffer = Renderbuffer;

})();
