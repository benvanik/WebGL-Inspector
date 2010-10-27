(function () {

    var Replay = function (context, targetgl) {
        this.context = context;
        this.gl = targetgl;

        this.currentFrame = null;
        this.callIndex = 0;

        this.mirrorResources = {};

        // TODO: better event system
        this.onStep = function () { };
    };

    Replay.prototype.reset = function () {
        for (var n in this.mirrorResources) {
            var resource = this.mirrorResources[n];
            resource.dispose();
        }
        this.mirrorResources = {};

        this.currentFrame = null;
        this.callIndex = 0;
    };

    Replay.prototype.runFrame = function (frame) {
        this.beginFrame(frame);
        this.stepUntilEnd();
    };

    Replay.prototype.beginFrame = function (frame) {
        var gl = this.gl;

        this.reset();

        this.currentFrame = frame;

        // Upload all resources used in this frame
        for (var n = 0; n < frame.resourcesRead.length; n++) {
            var resource = frame.resourcesRead[n];
            var mirror = resource.createMirror(gl);

            mirror.source = resource;
            resource.mirror = mirror;
            this.mirrorResources[resource.id] = mirror;
        }

        // Apply state
        frame.initialState.apply(gl, true);

        this.callIndex = 0;
        if (this.onStep) {
            this.onStep(this, this.currentFrame, null);
        }
    };

    function getTargetValue(value) {
        if (value) {
            if (value.trackedObject) {
                return value.trackedObject.mirror;
            } else {
                return value;
            }
        } else {
            return value;
        }
    };

    Replay.prototype.step = function (callIndex) {
        var gl = this.gl;

        if (this.currentFrame == null) {
            return false;
        }
        if (this.callIndex + 1 > this.currentFrame.calls.length) {
            return false;
        }

        if (callIndex >= 0) {
            this.callIndex = callIndex;
        } else {
            callIndex = this.callIndex;
        }

        var call = this.currentFrame.calls[callIndex];

        var args = [];
        for (var n = 0; n < call.args.length; n++) {
            args[n] = getTargetValue(call.args[n]);

            if (args[n] && args[n].uniformName) {
                // TODO: faster way?
                args[n] = gl.getUniformLocation(args[n].sourceProgram.trackedObject.mirror, args[n].uniformName);
            }
        }

        // TODO: handle result?
        call.fn.apply(gl, args);

        // TODO: handle error?

        if (this.onStep) {
            this.onStep(this, this.currentFrame, callIndex);
        }

        return true;
    };

    Replay.prototype.stepUntil = function (callIndex) {
        if (this.callIndex > callIndex) {
            var frame = this.currentFrame;
            this.reset();
            this.beginFrame(frame);
        }
        while (this.callIndex <= callIndex) {
            if (this.step()) {
                this.callIndex++;
            } else {
                return false;
            }
        }
        return true;
    };

    Replay.prototype.stepUntilError = function () {
        console.error("stepUntilError not implemented");
    };

    Replay.prototype.stepUntilDraw = function () {
        while (this.step()) {
            var call = this.currentFrame.calls[this.callIndex];
            if (call.info.type == gli.FunctionType.DRAW) {
                this.callIndex++;
                break;
            } else {
                this.callIndex++;
            }
        }
    };

    Replay.prototype.stepUntilEnd = function () {
        while (this.step()) {
            this.callIndex++;
        }
    };

    Replay.prototype.stepBack = function () {
        if (this.callIndex == 0) {
            return false;
        }
        return this.stepUntil(this.callIndex - 2);
    };

    Replay.prototype.stepForward = function () {
        if (this.step()) {
            this.callIndex++;
            return true;
        } else {
            return false;
        }
    };

    gli = gli || {};
    gli.Replay = Replay;

})();
