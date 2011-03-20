(function () {
    var resources = glinamespace("gli.playback.resources");

    var Shader = function Shader(session, source) {
        glisubclass(gli.playback.resources.Resource, this, [session, source]);
        this.creationOrder = 4;

        this.shaderType = source.shaderType;
    };

    resources.Shader = Shader;

})();
