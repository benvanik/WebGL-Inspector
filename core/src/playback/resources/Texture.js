(function () {
    var resources = glinamespace("gli.playback.resources");

    var Texture = function Texture(session, source) {
        this.super.call(this, session, source);
    };
    glisubclass(gli.playback.resources.Resource, Texture);
    Texture.prototype.creationOrder = 1;

    Texture.prototype.createTarget = function createTarget(version, options) {
        //
        return null;
    };

    Texture.prototype.deleteTarget = function deleteTarget(value) {
        //
    };

    resources.Texture = Texture;

})();
