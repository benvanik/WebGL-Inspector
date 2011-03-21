(function () {
    var resources = glinamespace("gli.playback.resources");

    var Texture = function Texture(session, source) {
        this.super.call(this, session, source);
    };
    glisubclass(gli.playback.resources.Resource, Texture);
    Texture.prototype.creationOrder = 1;

    Texture.prototype.createTargetValue = function createTargetValue(gl, options, version) {
        return gl.createTexture();
    };

    Texture.prototype.deleteTargetValue = function deleteTargetValue(gl, value) {
        gl.deleteTexture(value);
    };

    resources.Texture = Texture;

})();
