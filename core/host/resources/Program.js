(function () {
    var resources = glinamespace("gli.resources");

    var Program = function (gl, frameNumber, stack, target) {
        glisubclass(gli.host.Resource, this, [gl, frameNumber, stack, target]);
        this.creationOrder = 5;

        this.defaultName = "Program " + this.id;

        this.shaders = [];

        this.parameters = {};
        this.parameters[gl.DELETE_STATUS] = 0;
        this.parameters[gl.LINK_STATUS] = 0;
        this.parameters[gl.VALIDATE_STATUS] = 0;
        this.parameters[gl.INFO_LOG_LENGTH] = 0;
        this.parameters[gl.ATTACHED_SHADERS] = 0;
        this.parameters[gl.ACTIVE_ATTRIBUTES] = 0;
        this.parameters[gl.ACTIVE_ATTRIBUTE_MAX_LENGTH] = 0;
        this.parameters[gl.ACTIVE_UNIFORMS] = 0;
        this.parameters[gl.ACTIVE_UNIFORM_MAX_LENGTH] = 0;
        this.infoLog = null;

        this.uniformInfos = [];
        this.attribInfos = [];
        this.attribBindings = {};

        this.currentVersion.setParameters(this.parameters);
        this.currentVersion.setExtraParameters("extra", { infoLog: "" });
        this.currentVersion.setExtraParameters("uniformInfos", this.uniformInfos);
        this.currentVersion.setExtraParameters("attribInfos", this.attribInfos);
        this.currentVersion.setExtraParameters("attribBindings", this.attribBindings);
    };

    Program.prototype.getDependentResources = function () {
        return this.shaders;
    };

    Program.prototype.getShader = function (type) {
        for (var n = 0; n < this.shaders.length; n++) {
            var shader = this.shaders[n];
            if (shader.type == type) {
                return shader;
            }
        }
        return null;
    }

    Program.prototype.getVertexShader = function (gl) {
        return this.getShader(gl.VERTEX_SHADER);
    };

    Program.prototype.getFragmentShader = function (gl) {
        return this.getShader(gl.FRAGMENT_SHADER);
    };

    Program.prototype.refresh = function (gl) {
        var paramEnums = [gl.DELETE_STATUS, gl.LINK_STATUS, gl.VALIDATE_STATUS, gl.INFO_LOG_LENGTH, gl.ATTACHED_SHADERS, gl.ACTIVE_ATTRIBUTES, gl.ACTIVE_ATTRIBUTE_MAX_LENGTH, gl.ACTIVE_UNIFORMS, gl.ACTIVE_UNIFORM_MAX_LENGTH];
        for (var n = 0; n < paramEnums.length; n++) {
            this.parameters[paramEnums[n]] = gl.getProgramParameter(this.target, paramEnums[n]);
        }
        this.infoLog = gl.getProgramInfoLog(this.target);
    };

    Program.setCaptures = function (gl) {
        var original_attachShader = gl.attachShader;
        gl.attachShader = function () {
            var tracked = arguments[0].trackedObject;
            var trackedShader = arguments[1].trackedObject;
            tracked.shaders.push(trackedShader);
            tracked.parameters[gl.ATTACHED_SHADERS]++;
            tracked.markDirty(false);
            tracked.currentVersion.setParameters(tracked.parameters);
            tracked.currentVersion.pushCall("attachShader", arguments);
            return original_attachShader.apply(gl, arguments);
        };

        var original_detachShader = gl.detachShader;
        gl.detachShader = function () {
            var tracked = arguments[0].trackedObject;
            var trackedShader = arguments[1].trackedObject;
            var index = tracked.shaders.indexOf(trackedShader);
            if (index >= 0) {
                tracked.shaders.splice(index, 1);
            }
            tracked.parameters[gl.ATTACHED_SHADERS]--;
            tracked.markDirty(false);
            tracked.currentVersion.setParameters(tracked.parameters);
            tracked.currentVersion.pushCall("detachShader", arguments);
            return original_detachShader.apply(gl, arguments);
        };

        var original_linkProgram = gl.linkProgram;
        gl.linkProgram = function () {
            var tracked = arguments[0].trackedObject;
            var result = original_linkProgram.apply(gl, arguments);

            // Refresh params
            tracked.refresh(gl);

            // Grab uniforms
            tracked.uniformInfos = [];
            for (var n = 0; n < tracked.parameters[gl.ACTIVE_UNIFORMS]; n++) {
                var activeInfo = gl.getActiveUniform(tracked.target, n);
                if (activeInfo) {
                    var loc = gl.getUniformLocation(tracked.target, activeInfo.name);
                    var value = gli.util.clone(gl.getUniform(tracked.target, loc));
                    tracked.uniformInfos[n] = value;
                }
                gl.ignoreErrors();
            }

            // Grab attribs
            tracked.attribInfos = [];
            var remainingAttribs = tracked.parameters[gl.ACTIVE_ATTRIBUTES];
            var maxAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
            var attribIndex = 0;
            while (remainingAttribs > 0) {
                var activeInfo = gl.getActiveAttrib(tracked.target, attribIndex);
                if (activeInfo && activeInfo.type) {
                    remainingAttribs--;
                    var loc = gl.getAttribLocation(tracked.target, activeInfo.name);
                    tracked.attribInfos.push({
                        index: attribIndex,
                        loc: loc,
                        name: activeInfo.name
                    });
                }
                gl.ignoreErrors();
                attribIndex++;
                if (attribIndex >= maxAttribs) {
                    break;
                }
            }

            tracked.markDirty(false);
            tracked.currentVersion.setParameters(tracked.parameters);
            tracked.currentVersion.pushCall("linkProgram", arguments);
            tracked.currentVersion.setExtraParameters("extra", { infoLog: tracked.infoLog });
            tracked.currentVersion.setExtraParameters("uniformInfos", tracked.uniformInfos);
            tracked.currentVersion.setExtraParameters("attribInfos", tracked.attribInfos);
            tracked.currentVersion.setExtraParameters("attribBindings", tracked.attribBindings);

            return result;
        };

        var original_bindAttribLocation = gl.bindAttribLocation;
        gl.bindAttribLocation = function () {
            var tracked = arguments[0].trackedObject;
            var index = arguments[1];
            var name = arguments[2];
            tracked.attribBindings[index] = name;

            tracked.markDirty(false);
            tracked.currentVersion.setParameters(tracked.parameters);
            tracked.currentVersion.pushCall("bindAttribLocation", arguments);
            tracked.currentVersion.setExtraParameters("attribBindings", tracked.attribBindings);

            return original_bindAttribLocation.apply(gl, arguments);
        };

        // Cache off uniform name so that we can retrieve it later
        var original_getUniformLocation = gl.getUniformLocation;
        gl.getUniformLocation = function () {
            var result = original_getUniformLocation.apply(gl, arguments);
            if (result) {
                var tracked = arguments[0].trackedObject;
                result.sourceProgram = tracked;
                result.sourceUniformName = arguments[1];
            }
            return result;
        };
    };

    Program.prototype.createTarget = function (gl, version, options) {
        options = options || {};

        var program = gl.createProgram();

        this.replayCalls(gl, version, program, function (call, args) {
            // Filter links if requested
            if (options.ignoreLinkProgram) {
                if (call.name == "linkProgram") {
                    return false;
                }
            }
            return true;
        });

        return program;
    };

    Program.prototype.deleteTarget = function (gl, target) {
        gl.deleteProgram(target);
    };

    resources.Program = Program;

})();
