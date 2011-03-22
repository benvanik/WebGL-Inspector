(function () {
    var resources = glinamespace("gli.playback.resources");

    var Program = function Program(session, source) {
        this.super.call(this, session, source);
    };
    glisubclass(gli.playback.resources.Resource, Program);
    Program.prototype.creationOrder = 5;

    Program.prototype.createTargetValue = function createTargetValue(gl, options, version) {
        return gl.createProgram();
    };
    
    Program.prototype.deleteTargetValue = function deleteTargetValue(gl, value) {
        gl.deleteProgram(value);
    };

    Program.setupCaptures = function setupCaptures(pool) {
        var dirtyingCalls = [
            "attachShader",
            "detachShader",
            "linkProgram"
        ];
        gli.playback.resources.Resource.buildDirtiers(pool, dirtyingCalls, null);
    };

    resources.Program = Program;

})();
