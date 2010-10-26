(function () {

    var Program = function (gl, target, type) {
        gli.Resource.apply(this, [gl, target]);

        this.shaders = [];

        this.parameters = {};
        this.infoLog = null;
        this.uniforms = [];

        this.refresh();
    };

    Program.prototype.refresh = function () {
        var gl = this.gl;

        var paramEnums = [gl.DELETE_STATUS, gl.LINK_STATUS, gl.VALIDATE_STATUS, gl.INFO_LOG_LENGTH, gl.ATTACHED_SHADERS, gl.ACTIVE_ATTRIBUTES, gl.ACTIVE_ATTRIBUTE_MAX_LENGTH, gl.ACTIVE_UNIFORMS, gl.ACTIVE_UNIFORM_MAX_LENGTH];
        for (var n = 0; n < paramEnums.length; n++) {
            this.parameters[paramEnums[n]] = gl.getProgramParameter(this.target, paramEnums[n]);
        }
        this.infoLog = gl.getProgramInfoLog(this.target);

        this.shaders.length = 0;
        var attached = gl.getAttachedShaders(this.target);
        if (attached) {
            for (var n = 0; n < attached.length; n++) {
                var glshader = attached[n];
                this.shaders.push(glshader.trackedObject);
            }
        }

        this.uniforms = [];
        for (var n = 0; n < this.parameters[gl.ACTIVE_UNIFORMS]; n++) {
            var activeInfo = gl.getActiveUniform(this.target, n);
            var loc = gl.getUniformLocation(this.target, activeInfo.name);
            var value = gli.util.clone(gl.getUniform(this.target, loc));
            this.uniforms[n] = value;
            gl.ignoreErrors();
        }
    };

    Program.prototype.createMirror = function (gl) {
        var mirror = gl.createProgram();

        // Ensure everything is up to date
        this.refresh();

        for (var n = 0; n < this.shaders.length; n++) {
            var sourceShader = this.shaders[n];
            var mirrorShader = sourceShader.createMirror(gl);
            gl.attachShader(mirror, mirrorShader);
        }

        gl.linkProgram(mirror);

        var status = gl.getProgramParameter(mirror, gl.LINK_STATUS);

        // TODO: bindAttribLocation
        // TODO: attribs?

        for (var n = 0; n < this.uniforms.length; n++) {
            var activeInfo = gl.getActiveUniform(mirror, n);
            var loc = gl.getUniformLocation(this.target, activeInfo.name);
            switch (activeInfo.type) {
                case gl.FLOAT:
                    if (this.uniforms[n].length) {
                        gl.uniform1fv(loc, this.uniforms[n]);
                    } else {
                        gl.uniform1f(loc, this.uniforms[n]);
                    }
                    break;
                case gl.FLOAT_VEC2:
                    gl.uniform2fv(loc, this.uniforms[n]);
                    break;
                case gl.FLOAT_VEC3:
                    gl.uniform3fv(loc, this.uniforms[n]);
                    break;
                case gl.FLOAT_VEC4:
                    gl.uniform4fv(loc, this.uniforms[n]);
                    break;
                case gl.INT:
                case gl.BOOL:
                    if (this.uniforms[n].length) {
                        gl.uniform1iv(loc, this.uniforms[n]);
                    } else {
                        gl.uniform1i(loc, this.uniforms[n]);
                    }
                    break;
                case gl.INT_VEC2:
                case gl.BOOL_VEC2:
                    gl.uniform2iv(loc, this.uniforms[n]);
                    break;
                case gl.INT_VEC3:
                case gl.BOOL_VEC3:
                    gl.uniform3iv(loc, this.uniforms[n]);
                    break;
                case gl.INT_VEC4:
                case gl.BOOL_VEC4:
                    gl.uniform4iv(loc, this.uniforms[n]);
                    break;
                case gl.FLOAT_MAT2:
                    gl.uniformMatrix2fv(loc, false, this.uniforms[n]);
                    break;
                case gl.FLOAT_MAT3:
                    gl.uniformMatrix3fv(loc, false, this.uniforms[n]);
                    break;
                case gl.FLOAT_MAT4:
                    gl.uniformMatrix4fv(loc, false, this.uniforms[n]);
                    break;
                case gl.SAMPLER_2D:
                case gl.SAMPLER_CUBE:
                    gl.uniform1i(loc, this.uniforms[n]);
                    break;
            }
        }

        mirror.dispose = function () {
            gl.deleteProgram(mirror);
        };
        return mirror;
    };

    gli = gli || {};
    gli.Program = Program;

})();
