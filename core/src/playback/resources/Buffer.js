(function () {
    var resources = glinamespace("gli.playback.resources");

    var Buffer = function Buffer(session, source) {
        this.super.call(this, session, source);
    };
    glisubclass(gli.playback.resources.Resource, Buffer);
    Buffer.prototype.creationOrder = 0;

    resources.Buffer = Buffer;

})();
