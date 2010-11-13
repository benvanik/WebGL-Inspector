(function () {
    var resources = glinamespace("gli.resources");

    var Shader = function (gl, frameNumber, stack, target, args) {
        glisubclass(gli.host.Resource, this, [gl, frameNumber, stack, target]);
        
        this.defaultName = "Shader " + this.id;

        this.type = args[0]; // VERTEX_SHADER, FRAGMENT_SHADER

        this.source = null;

        this.parameters = {};
        this.parameters[gl.SHADER_TYPE] = this.type;
        this.parameters[gl.DELETE_STATUS] = 0;
        this.parameters[gl.COMPILE_STATUS] = 0;
        this.parameters[gl.INFO_LOG_LENGTH] = 0;
        this.parameters[gl.SHADER_SOURCE_LENGTH] = 0;
        this.infoLog = null;

        this.currentVersion.target = this.type;
        this.currentVersion.setParameters(this.parameters);
        this.currentVersion.setExtraParameters("extra", { infoLog: "" });
    };

    Shader.prototype.refresh = function (gl) {
        var paramEnums = [gl.SHADER_TYPE, gl.DELETE_STATUS, gl.COMPILE_STATUS, gl.INFO_LOG_LENGTH, gl.SHADER_SOURCE_LENGTH];
        for (var n = 0; n < paramEnums.length; n++) {
            this.parameters[paramEnums[n]] = gl.getShaderParameter(this.target, paramEnums[n]);
        }
        this.infoLog = gl.getShaderInfoLog(this.target);
    };

    Shader.setCaptures = function (gl) {
        var original_shaderSource = gl.shaderSource;
        gl.shaderSource = function () {
            var tracked = arguments[0].trackedObject;
            tracked.source = arguments[1];
            tracked.markDirty(true);
            tracked.currentVersion.target = tracked.type;
            tracked.currentVersion.setParameters(tracked.parameters);
            tracked.currentVersion.pushCall("shaderSource", arguments);
            return original_shaderSource.apply(gl, arguments);
        };

        var original_compileShader = gl.compileShader;
        gl.compileShader = function () {
            var tracked = arguments[0].trackedObject;
            tracked.markDirty(false);
            var result = original_compileShader.apply(gl, arguments);
            tracked.refresh(gl);
            tracked.currentVersion.setParameters(tracked.parameters);
            tracked.currentVersion.setExtraParameters("extra", { infoLog: tracked.infoLog });
            tracked.currentVersion.pushCall("compileShader", arguments);
            return result;
        };
    };

    Shader.prototype.createTarget = function (gl, version) {
        var shader = gl.createShader(version.target);

        for (var n = 0; n < version.calls.length; n++) {
            var call = version.calls[n];

            var args = [];
            for (var m = 0; m < call.args.length; m++) {
                // TODO: unpack refs?
                args[m] = call.args[m];
                if (args[m] == this) {
                    args[m] = shader;
                }
            }

            gl[call.name].apply(gl, args);
        }

        return shader;
    };

    Shader.prototype.deleteTarget = function (gl, target) {
        gl.deleteShader(target);
    };

    resources.Shader = Shader;

})();
