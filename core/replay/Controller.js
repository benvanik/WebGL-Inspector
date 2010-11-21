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
        try {
            if (canvas.getContextRaw) {
                this.output.gl = canvas.getContextRaw("experimental-webgl");
            } else {
                this.output.gl = canvas.getContext("experimental-webgl");
            }
        } catch (e) {
            // ?
            alert("Unable to create replay canvas: " + e);
        }
        gli.hacks.installAll(this.output.gl);
        gli.info.initialize(this.output.gl);
    };

    Controller.prototype.reset = function () {
        this.currentFrame = null;
        this.callIndex = 0;
        this.stepping = false;
    };

    Controller.prototype.getCurrentState = function () {
        return new gli.host.StateSnapshot(this.output.gl);
    };

    Controller.prototype.openFrame = function (frame) {
        var gl = this.output.gl;

        this.currentFrame = frame;

        frame.makeActive(gl);

        this.beginStepping();
        this.callIndex = 0;
        this.endStepping();
    };

    function emitMark(mark) {
        console.log("mark hit");
    };

    function emitCall(gl, call) {
        var args = [];
        for (var n = 0; n < call.args.length; n++) {
            args[n] = call.args[n];

            if (args[n]) {
                if (args[n].mirror) {
                    // Translate from resource -> mirror target
                    args[n] = args[n].mirror.target;
                } else if (args[n].sourceUniformName) {
                    // Get valid uniform location on new context
                    args[n] = gl.getUniformLocation(args[n].sourceProgram.mirror.target, args[n].sourceUniformName);
                }
            }
        }

        // TODO: handle result?
        gl[call.name].apply(gl, args);
        //console.log("call " + call.name);
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
                emitCall(gl, call);
                break;
        }

        return true;
    };

    Controller.prototype.beginStepping = function () {
        this.stepping = true;
    };

    Controller.prototype.endStepping = function () {
        this.stepping = false;
        this.stepCompleted.fire();
    };

    Controller.prototype.stepUntil = function (callIndex) {
        if (this.callIndex > callIndex) {
            var frame = this.currentFrame;
            this.reset();
            this.openFrame(frame);
        }
        this.beginStepping();
        while (this.callIndex <= callIndex) {
            if (this.issueCall()) {
                this.callIndex++;
            } else {
                this.endStepping();
                return false;
            }
        }
        this.endStepping();
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
        this.openFrame(frame);

        var gl = this.output.gl;
        var oldColorClearValue = gl.getParameter(gl.COLOR_CLEAR_VALUE);
        gl.colorMask(true, true, true, true);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clearColor(oldColorClearValue[0], oldColorClearValue[1], oldColorClearValue[2], oldColorClearValue[3]);

        this.beginStepping();
        while (true) {
            var call = this.currentFrame.calls[this.callIndex];
            var shouldExec = false;

            if (call.name == "clear") {
                // Ignore clear calls
                shouldExec = false;
            } else if (call == targetCall) {
                shouldExec = true;
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
        this.openFrame(frame);
        this.endStepping();
    };

    replay.Controller = Controller;

})();
