(function () {
    var resources = glinamespace("gli.playback.resources");

    var Texture = function Texture(session, source) {
        this.super.call(this, session, source);
    };
    glisubclass(gli.playback.resources.Resource, Texture);
    Texture.prototype.creationOrder = 1;

    resources.Texture = Texture;

})();
