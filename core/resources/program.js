(function () {

    var Program = function (gl, target, type) {
        gli.Resource.apply(this, [gl, target]);

        this.shaders = [];

        this.parameters = {};
        this.infoLog = null;
        this.refresh();
    };

    Program.prototype.refresh = function () {
        var gl = this.gl;
        var paramEnums = [gl.DELETE_STATUS, gl.LINK_STATUS, gl.VALIDATE_STATUS, gl.INFO_LOG_LENGTH, gl.ATTACHED_SHADERS, gl.ACTIVE_ATTRIBUTES, gl.ACTIVE_ATTRIBUTE_MAX_LENGTH, gl.ACTIVE_UNIFORMS, gl.ACTIVE_UNIFORM_MAX_LENGTH];
        for (var n = 0; n < paramEnums.length; n++) {
            this.parameters[paramEnums[n]] = gl.getProgramParameter(this.target, paramEnums[n]);
        }
        this.infoLog = gl.getProgramInfoLog(this.target);

        var attached = gl.getAttachedShaders(this.target);
        this.shaders.length = 0;
        for (var n = 0; n < attached.length; n++) {
            var glshader = attached[n];
            this.shaders.push(glshader.trackedObject);
        }

        // TODO: pull out all uniform values
    };

    gli.Program = Program;

})();
