(function () {
    var resources = glinamespace("gli.playback.resources");

    var Program = function Program(session, source) {
        this.super.call(this, session, source);
    };
    glisubclass(gli.playback.resources.Resource, Program);
    Program.prototype.creationOrder = 5;
    
    Program.prototype.getShader = function getShader(gl, version, type) {
        for (var n = version.calls.length - 1; n >= 0; n--) {
            var call = version.calls[n];
            switch (call.name) {
                case "attachShader":
                    var shader = call.args[1];
                    if (shader && shader.shaderType === type) {
                        return call.args[1];
                    }
                    break;
            }
        }
        return null;
    };
    Program.prototype.getVertexShader = function getVertexShader(gl, version) {
        return this.getShader(gl, version, gl.VERTEX_SHADER);
    };
    Program.prototype.getFragmentShader = function getFragmentShader(gl, version) {
        return this.getShader(gl, version, gl.FRAGMENT_SHADER);
    };

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
