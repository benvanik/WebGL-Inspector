(function () {
    var host = glinamespace("gli.host");

    var CallType = {
        MARK: 0,
        GL: 1
    };

    var Call = function (ordinal, type, name, sourceArgs, frame) {
        this.ordinal = ordinal;
        this.time = (new Date()).getTime();

        this.type = type;
        this.name = name;
        this.stack = null;

        this.isRedundant = false;

        // Clone arguments
        var args = [];
        for (var n = 0; n < sourceArgs.length; n++) {
            if (sourceArgs[n] && sourceArgs[n].sourceUniformName) {
                args[n] = sourceArgs[n]; // TODO: pull out uniform reference
            } else {
                args[n] = gli.util.clone(sourceArgs[n]);

                if (gli.util.isWebGLResource(args[n])) {
                    var tracked = args[n].trackedObject;
                    args[n] = tracked;

                    // TODO: mark resource access based on type
                    if (true) {
                        frame.markResourceRead(tracked);
                    }
                    if (true) {
                        frame.markResourceWrite(tracked);
                    }
                }
            }
        }
        this.args = args;

        // Set upon completion
        this.duration = 0;
        this.result = null;
        this.error = null;
    };

    Call.prototype.complete = function (result, error, stack) {
        this.duration = (new Date()).getTime() - this.time;
        this.result = result;
        this.error = error;
        this.stack = stack;
    };

    var Frame = function (rawgl, frameNumber) {
        this.frameNumber = frameNumber;
        this.initialState = new gli.host.StateSnapshot(rawgl);
        this.screenshot = null;

        this.resourcesUsed = [];
        this.resourcesRead = [];
        this.resourcesWritten = [];

        this.calls = [];

        // Mark all bound resources as read
        for (var n in this.initialState) {
            var value = this.initialState[n];
            if (gli.util.isWebGLResource(value)) {
                this.markResourceRead(value.trackedObject);
                // TODO: differentiate between framebuffers (as write) and the reads
            }
        }

        // Initialized later
        this.resourceVersions = null;
    };

    Frame.prototype.end = function (rawgl) {
        var canvas = rawgl.canvas;

        // Take a picture! Note, this may fail for many reasons, but seems ok right now
        this.screenshot = document.createElement("canvas");
        this.screenshot.width = canvas.width;
        this.screenshot.height = canvas.height;
        var ctx2d = this.screenshot.getContext("2d");
        ctx2d.drawImage(canvas, 0, 0);
    };

    Frame.prototype.mark = function (args) {
        var call = new Call(this.calls.length, CallType.MARK, "mark", args, this);
        this.calls.push(call);
        call.complete(undefined, undefined); // needed?
        return call;
    };

    Frame.prototype.allocateCall = function (name, args) {
        var call = new Call(this.calls.length, CallType.GL, name, args, this);
        this.calls.push(call);
        return call;
    };

    Frame.prototype.findResourceVersion = function (resource) {
        for (var n = 0; n < this.resourceVersions.length; n++) {
            if (this.resourceVersions[n].resource == resource) {
                return this.resourceVersions[n].value;
            }
        }
        return null;
    };

    Frame.prototype.findResourceUsages = function (resource) {
        // Quick check to see if we have it marked as being used
        if (this.resourcesUsed.indexOf(resource) == -1) {
            // Unused this frame
            return null;
        }

        // Search all call args
        var usages = [];
        for (var n = 0; n < this.calls.length; n++) {
            var call = this.calls[n];
            for (var m = 0; m < call.args.length; m++) {
                if (call.args[m] == resource) {
                    usages.push(call);
                }
            }
        }
        return usages;
    };

    Frame.prototype.markResourceRead = function (resource) {
        // TODO: faster check (this can affect performance)
        if (resource) {
            if (this.resourcesUsed.indexOf(resource) == -1) {
                this.resourcesUsed.push(resource);
            }
            if (this.resourcesRead.indexOf(resource) == -1) {
                this.resourcesRead.push(resource);
            }
            if (resource.getDependentResources) {
                var dependentResources = resource.getDependentResources();
                for (var n = 0; n < dependentResources.length; n++) {
                    this.markResourceRead(dependentResources[n]);
                }
            }
        }
    };

    Frame.prototype.markResourceWrite = function (resource) {
        // TODO: faster check (this can affect performance)
        if (resource) {
            if (this.resourcesUsed.indexOf(resource) == -1) {
                this.resourcesUsed.push(resource);
            }
            if (this.resourcesWritten.indexOf(resource) == -1) {
                this.resourcesWritten.push(resource);
            }
            if (resource.getDependentResources) {
                var dependentResources = resource.getDependentResources();
                for (var n = 0; n < dependentResources.length; n++) {
                    this.markResourceWrite(dependentResources[n]);
                }
            }
        }
    };

    Frame.prototype.getResourcesUsedOfType = function (typename) {
        var results = [];
        for (var n = 0; n < this.resourcesUsed.length; n++) {
            var resource = this.resourcesUsed[n];
            if (!resource.target) {
                continue;
            }
            if (typename == glitypename(resource.target)) {
                results.push(resource);
            }
        }
        return results;
    };

    Frame.prototype._lookupResourceVersion = function (resource) {
        // TODO: faster lookup
        for (var m = 0; m < this.resourceVersions.length; m++) {
            if (this.resourceVersions[m].resource.id === resource.id) {
                return this.resourceVersions[m].value;
            }
        }
        return null;
    };

    Frame.prototype.makeActive = function (gl, force, options, exclusions) {
        options = options || {};
        exclusions = exclusions || [];

        // Sort resources by creation order - this ensures that shaders are ready before programs, etc
        // Since dependencies are fairly straightforward, this *should* be ok
        // 0 - Buffer
        // 1 - Texture
        // 2 - Renderbuffer
        // 3 - Framebuffer
        // 4 - Shader
        // 5 - Program
        this.resourcesUsed.sort(function (a, b) {
            return a.creationOrder - b.creationOrder;
        });

        for (var n = 0; n < this.resourcesUsed.length; n++) {
            var resource = this.resourcesUsed[n];
            if (exclusions.indexOf(resource) != -1) {
                continue;
            }

            var version = this._lookupResourceVersion(resource);
            if (!version) {
                continue;
            }

            resource.restoreVersion(gl, version, force, options);
        }

        this.initialState.apply(gl);
    };

    Frame.prototype.cleanup = function (gl) {
        // Unbind everything
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.useProgram(null);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
        var maxVertexAttrs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
        for (var n = 0; n < maxVertexAttrs; n++) {
            gl.bindBuffer(gl.ARRAY_BUFFER, null);
            gl.vertexAttribPointer(0, 0, gl.FLOAT, false, 0, 0);
        }
        var maxTextureUnits = gl.getParameter(gl.MAX_COMBINED_TEXTURE_IMAGE_UNITS);
        for (var n = 0; n < maxTextureUnits; n++) {
            gl.activeTexture(gl.TEXTURE0 + n);
            gl.bindTexture(gl.TEXTURE_2D, null);
            gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
        }

        // Dispose all objects
        for (var n = 0; n < this.resourcesUsed.length; n++) {
            var resource = this.resourcesUsed[n];
            resource.disposeMirror(gl);
        }
    };

    host.CallType = CallType;
    host.Call = Call;
    host.Frame = Frame;
})();
