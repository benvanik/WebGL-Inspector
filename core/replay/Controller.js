(function () {
    var replay = glinamespace("gli.replay");

    var Controller = function () {
        this.output = {};

        this.currentFrame = null;
        this.callIndex = 0;
        this.stepping = false;

        this.stepCompleted = new gli.EventSource("stepCompleted");
    };

    Controller.prototype.setOutput = function (canvas) {
        this.output.canvas = canvas;
        var gl = this.output.gl = gli.util.getWebGLContext(canvas, null, null);
        gli.info.initialize(gl);
    };

    Controller.prototype.reset = function (force) {
        if (this.currentFrame) {
            var gl = this.output.gl;
            if (force) {
                this.currentFrame.cleanup(gl);
            }
        }

        this.currentFrame = null;
        this.callIndex = 0;
        this.stepping = false;
    };

    Controller.prototype.getCurrentState = function () {
        return new gli.host.StateSnapshot(this.output.gl);
    };

    Controller.prototype.openFrame = function (frame, suppressEvents, force) {
        var gl = this.output.gl;

        this.currentFrame = frame;

        frame.makeActive(gl, force);

        this.beginStepping();
        this.callIndex = 0;
        this.endStepping(suppressEvents);
    };

    function emitMark(mark) {
        console.log("mark hit");
    };

    Controller.prototype.issueCall = function (callIndex) {
        var gl = this.output.gl;

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

        switch (call.type) {
            case 0: // MARK
                emitMark(call);
                break;
            case 1: // GL
                call.emit(gl);
                break;
        }

        return true;
    };

    Controller.prototype.beginStepping = function () {
        this.stepping = true;
    };

    Controller.prototype.endStepping = function (suppressEvents, overrideCallIndex) {
        this.stepping = false;
        if (!suppressEvents) {
            var callIndex = overrideCallIndex || this.callIndex;
            this.stepCompleted.fire(callIndex);
        }
    };

    Controller.prototype.stepUntil = function (callIndex) {
        if (this.callIndex > callIndex) {
            var frame = this.currentFrame;
            this.reset();
            this.openFrame(frame);
        }
        var wasStepping = this.stepping;
        if (!wasStepping) {
            this.beginStepping();
        }
        while (this.callIndex <= callIndex) {
            if (this.issueCall()) {
                this.callIndex++;
            } else {
                this.endStepping();
                return false;
            }
        }
        if (!wasStepping) {
            this.endStepping();
        }
        return true;
    };

    Controller.prototype.stepForward = function () {
        return this.stepUntil(this.callIndex);
    };

    Controller.prototype.stepBackward = function () {
        if (this.callIndex == 0) {
            return false;
        }
        return this.stepUntil(this.callIndex - 2);
    };

    Controller.prototype.stepUntilError = function () {
        //
    };

    Controller.prototype.stepUntilDraw = function () {
        this.beginStepping();
        while (this.issueCall()) {
            var call = this.currentFrame.calls[this.callIndex];
            var info = gli.info.functions[call.name];
            if (info.type == gli.FunctionType.DRAW) {
                this.callIndex++;
                break;
            } else {
                this.callIndex++;
            }
        }
        this.endStepping();
    };

    Controller.prototype.stepUntilEnd = function () {
        this.beginStepping();
        while (this.stepForward());
        this.endStepping();
    };

    Controller.prototype.runFrame = function (frame) {
        this.openFrame(frame);
        this.stepUntilEnd();
    };

    Controller.prototype.runIsolatedDraw = function (frame, targetCall) {
        this.openFrame(frame, true);

        var gl = this.output.gl;

        this.beginStepping();
        while (true) {
            var call = this.currentFrame.calls[this.callIndex];
            var shouldExec = false;

            if (call.name == "clear") {
                // Allow clear calls
                shouldExec = true;
            } else if (call == targetCall) {
                // The target call
                shouldExec = true;

                // Before executing the call, clear the color buffer
                var oldColorMask = gl.getParameter(gl.COLOR_WRITEMASK);
                var oldColorClearValue = gl.getParameter(gl.COLOR_CLEAR_VALUE);
                gl.colorMask(true, true, true, true);
                gl.clearColor(0, 0, 0, 0);
                gl.clear(gl.COLOR_BUFFER_BIT);
                gl.colorMask(oldColorMask[0], oldColorMask[1], oldColorMask[2], oldColorMask[3]);
                gl.clearColor(oldColorClearValue[0], oldColorClearValue[1], oldColorClearValue[2], oldColorClearValue[3]);
            } else {
                var info = gli.info.functions[call.name];
                if (info.type == gli.FunctionType.DRAW) {
                    // Ignore all other draws
                    shouldExec = false;
                } else {
                    shouldExec = true;
                }
            }

            if (shouldExec) {
                if (!this.issueCall()) {
                    break;
                }
            }

            this.callIndex++;
            if (call == targetCall) {
                break;
            }
        }

        var finalCallIndex = this.callIndex;

        this.openFrame(frame, true);

        this.endStepping(false, finalCallIndex);
    };

    replay.Controller = Controller;

})();
