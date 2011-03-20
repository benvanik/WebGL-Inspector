(function () {
    var resources = glinamespace("gli.playback.resources");

    var Shader = function Shader(session, source) {
        this.super.call(this, session, source);
        
        this.shaderType = source.shaderType;
    };
    glisubclass(gli.playback.resources.Resource, Shader);
    Shader.prototype.creationOrder = 4;

    Shader.prototype.createTarget = function createTarget(version, options) {
        //
        return null;
    };

    Shader.prototype.deleteTarget = function deleteTarget(value) {
        //
    };

    resources.Shader = Shader;

})();
