(function () {
    var host = glinamespace("gli.host");

    var CallType = {
        MARK: 0,
        GL: 1
    };

    var Call = function (ordinal, type, name, stack, sourceArgs, frame) {
        this.ordinal = ordinal;
        this.time = (new Date()).getTime();

        this.type = type;
        this.name = name;
        this.stack = stack;

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

    Call.prototype.complete = function (result, error) {
        this.duration = (new Date()).getTime() - this.time;
        this.result = result;
        this.error = error;
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
        var call = new Call(this.calls.length, CallType.MARK, "mark", null, args);
        this.calls.push(call);
        call.complete(undefined, undefined); // needed?
        return call;
    };

    Frame.prototype.allocateCall = function (name, stack, args) {
        var call = new Call(this.calls.length, CallType.GL, name, stack, args, this);
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
        }
    };

    Frame.prototype.makeActive = function (gl) {
        for (var n = 0; n < this.resourcesUsed.length; n++) {
            var resource = this.resourcesUsed[n];

            // TODO: faster lookup
            var version = null;
            for (var m = 0; m < this.resourceVersions.length; m++) {
                if (this.resourceVersions[m].resource.id === resource.id) {
                    version = this.resourceVersions[m].value;
                    break;
                }
            }

            resource.restoreVersion(gl, version);
        }

        this.initialState.apply(gl);
    };

    host.CallType = CallType;
    host.Call = Call;
    host.Frame = Frame;
})();
