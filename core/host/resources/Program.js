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
        this.parameters[gl.ATTACHED_SHADERS] = 0;
        this.parameters[gl.ACTIVE_ATTRIBUTES] = 0;
        this.parameters[gl.ACTIVE_UNIFORMS] = 0;
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

    Program.prototype.getUniformInfos = function (gl, target) {
        var originalActiveTexture = gl.getParameter(gl.ACTIVE_TEXTURE);

        var uniformInfos = [];
        var uniformCount = gl.getProgramParameter(target, gl.ACTIVE_UNIFORMS);
        for (var n = 0; n < uniformCount; n++) {
            var activeInfo = gl.getActiveUniform(target, n);
            if (activeInfo) {
                var loc = gl.getUniformLocation(target, activeInfo.name);
                var value = gli.util.clone(gl.getUniform(target, loc));
                value = (value !== null) ? value : 0;

                var isSampler = false;
                var textureType;
                var bindingType;
                var textureValue = null;
                switch (activeInfo.type) {
                    case gl.SAMPLER_2D:
                        isSampler = true;
                        textureType = gl.TEXTURE_2D;
                        bindingType = gl.TEXTURE_BINDING_2D;
                        break;
                    case gl.SAMPLER_CUBE:
                        isSampler = true;
                        textureType = gl.TEXTURE_CUBE_MAP;
                        bindingType = gl.TEXTURE_BINDING_CUBE_MAP;
                        break;
                }
                if (isSampler) {
                    gl.activeTexture(gl.TEXTURE0 + value);
                    var texture = gl.getParameter(bindingType);
                    textureValue = texture ? texture.trackedObject : null;
                }

                uniformInfos[n] = {
                    index: n,
                    name: activeInfo.name,
                    size: activeInfo.size,
                    type: activeInfo.type,
                    value: value,
                    textureValue: textureValue
                };
            }
            if (gl.ignoreErrors) {
                gl.ignoreErrors();
            }
        }

        gl.activeTexture(originalActiveTexture);
        return uniformInfos;
    };

    Program.prototype.getAttribInfos = function (gl, target) {
        var attribInfos = [];
        var remainingAttribs = gl.getProgramParameter(target, gl.ACTIVE_ATTRIBUTES);
        var maxAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        var attribIndex = 0;
        while (remainingAttribs > 0) {
            var activeInfo = gl.getActiveAttrib(target, attribIndex);
            if (activeInfo && activeInfo.type) {
                remainingAttribs--;
                var loc = gl.getAttribLocation(target, activeInfo.name);
                var bufferBinding = gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
                attribInfos.push({
                    index: attribIndex,
                    loc: loc,
                    name: activeInfo.name,
                    size: activeInfo.size,
                    type: activeInfo.type,
                    state: {
                        enabled: gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_ENABLED),
                        buffer: bufferBinding ? bufferBinding.trackedObject : null,
                        size: gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_SIZE),
                        stride: gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_STRIDE),
                        type: gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_TYPE),
                        normalized: gl.getVertexAttrib(loc, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED),
                        pointer: gl.getVertexAttribOffset(loc, gl.VERTEX_ATTRIB_ARRAY_POINTER),
                        value: gl.getVertexAttrib(loc, gl.CURRENT_VERTEX_ATTRIB)
                    }
                });
            }
            if (gl.ignoreErrors) {
                gl.ignoreErrors();
            }
            attribIndex++;
            if (attribIndex >= maxAttribs) {
                break;
            }
        }
        return attribInfos;
    };

    Program.prototype.refresh = function (gl) {
        var paramEnums = [gl.DELETE_STATUS, gl.LINK_STATUS, gl.VALIDATE_STATUS, gl.ATTACHED_SHADERS, gl.ACTIVE_ATTRIBUTES, gl.ACTIVE_UNIFORMS];
        for (var n = 0; n < paramEnums.length; n++) {
            this.parameters[paramEnums[n]] = gl.getProgramParameter(this.target, paramEnums[n]);
        }
        this.infoLog = gl.getProgramInfoLog(this.target);
    };

    Program.setCaptures = function (gl) {
        var original_attachShader = gl.attachShader;
        gl.attachShader = function () {
            if (arguments[0] && arguments[1]) {
                var tracked = arguments[0].trackedObject;
                var trackedShader = arguments[1].trackedObject;
                tracked.shaders.push(trackedShader);
                tracked.parameters[gl.ATTACHED_SHADERS]++;
                tracked.markDirty(false);
                tracked.currentVersion.setParameters(tracked.parameters);
                tracked.currentVersion.pushCall("attachShader", arguments);
            }
            return original_attachShader.apply(gl, arguments);
        };

        var original_detachShader = gl.detachShader;
        gl.detachShader = function () {
            if (arguments[0] && arguments[1]) {
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
            }
            return original_detachShader.apply(gl, arguments);
        };

        var original_linkProgram = gl.linkProgram;
        gl.linkProgram = function () {
            var tracked = arguments[0].trackedObject;
            var result = original_linkProgram.apply(gl, arguments);

            // Refresh params
            tracked.refresh(gl.rawgl);

            // Grab uniforms
            tracked.uniformInfos = tracked.getUniformInfos(gl, tracked.target);

            // Grab attribs
            tracked.attribInfos = tracked.getAttribInfos(gl, tracked.target);

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

        this.replayCalls(gl, version, program);

        return program;
    };

    Program.prototype.deleteTarget = function (gl, target) {
        gl.deleteProgram(target);
    };

    resources.Program = Program;

})();
