(function () {

    var Shader = function (gl, target, type) {
        gli.Resource.apply(this, [gl, target]);

        this.type = type; // VERTEX_SHADER, FRAGMENT_SHADER

        this.source = null;

        this.parameters = {};
        this.infoLog = null;
        this.refresh();
    };

    Shader.prototype.refresh = function () {
        var gl = this.gl;

        var paramEnums = [gl.SHADER_TYPE, gl.DELETE_STATUS, gl.COMPILE_STATUS, gl.INFO_LOG_LENGTH, gl.SHADER_SOURCE_LENGTH];
        for (var n = 0; n < paramEnums.length; n++) {
            this.parameters[paramEnums[n]] = gl.getShaderParameter(this.target, paramEnums[n]);
        }
        this.infoLog = gl.getShaderInfoLog(this.target);
    };

    Shader.prototype.setSource = function (source) {
        this.refresh();
        this.source = source;
    };

    Shader.prototype.createMirror = function (gl) {
        var mirror = gl.createShader(this.type);

        gl.shaderSource(mirror, this.source);
        gl.compileShader(mirror);

        mirror.dispose = function () {
            gl.deleteShader(mirror);
        };
        return mirror;
    };

    gli.Shader = Shader;

})();
