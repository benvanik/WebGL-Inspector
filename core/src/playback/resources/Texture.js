(function () {
    var resources = glinamespace("gli.playback.resources");

    var Texture = function Texture(session, source) {
        glisubclass(gli.playback.resources.Resource, this, [session, source]);
    };
    Texture.prototype.creationOrder = 1;

    resources.Texture = Texture;

})();
