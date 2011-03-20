(function () {
    var resources = glinamespace("gli.playback.resources");

    var Buffer = function Buffer(session, source) {
        this.super.call(this, session, source);
    };
    glisubclass(gli.playback.resources.Resource, Buffer);
    Buffer.prototype.creationOrder = 0;

    Buffer.prototype.createTarget = function createTarget(version, options) {
        //
        return null;
    };

    Buffer.prototype.deleteTarget = function deleteTarget(value) {
        //
    };

    resources.Buffer = Buffer;

})();
