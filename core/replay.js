(function () {

    var Replay = function (context, targetgl) {
        this.context = context;
        this.gl = targetgl;

        this.currentFrame = null;
        this.callIndex = 0;

        this.mirrorResources = {};
    };

    Replay.prototype.reset = function () {
        for (var n in this.mirrorResources) {
            var resource = this.mirrorResources[n];
            //resource.dispose();
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

    Replay.prototype.step = function () {
        var gl = this.gl;

        if (this.currentFrame == null) {
            return false;
        }
        if (this.callIndex + 1 >= this.currentFrame.calls.length) {
            return false;
        }

        this.callIndex++;

        var call = this.currentFrame.calls[this.callIndex];

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

        return true;
    };

    Replay.prototype.stepUntilError = function () {
    };

    Replay.prototype.stepUntilDraw = function () {
    };

    Replay.prototype.stepUntilEnd = function () {
        while (this.step());
    };

    gli.Replay = Replay;

})();
