(function () {
    var resources = glinamespace("gli.playback.resources");

    var Shader = function Shader(session, source) {
        this.super.call(this, session, source);
        
        this.shaderType = source.shaderType;
    };
    glisubclass(gli.playback.resources.Resource, Shader);
    Shader.prototype.creationOrder = 4;

    Shader.prototype.createTargetValue = function createTargetValue(gl, options, version) {
        return gl.createShader(this.shaderType);
    };

    Shader.prototype.deleteTargetValue = function deleteTargetValue(gl, value) {
        gl.deleteShader(value);
    };

    Shader.setupCaptures = function setupCaptures(pool) {
        var dirtyingCalls = [
            "shaderSource",
            "compileShader"
        ];
        gli.playback.resources.Resource.buildDirtiers(pool, dirtyingCalls, null);
    };

    resources.Shader = Shader;

})();
