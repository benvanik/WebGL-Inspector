(function () {
    var resources = glinamespace("gli.playback.resources");

    var Shader = function Shader(session, source) {
        glisubclass(gli.playback.resources.Resource, this, [session, source]);
        
        this.shaderType = source.shaderType;
    };
    Shader.prototype.creationOrder = 4;

    resources.Shader = Shader;

})();
