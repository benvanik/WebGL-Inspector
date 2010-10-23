(function () {

    function errorBreak() {
        throw "WebGL error!";
    };

    function startCapturing(context) {
        context.captureFrame = true;
        console.log("WebGL Inspector: beginning frame capture...");
    };

    function stopCapturing(context) {
        context.captureFrame = false;
        console.log("WebGL Inspector: ending frame capture");

        // Fire off callback (if present)
        if (context.captureCallback) {
            context.captureCallback(context, stream);
        }
    };

    function frameSeparator(context) {
        context.frameNumber++;

        // Start or stop capturing
        if (context.captureFrame) {
            if (context.captureFrameEnd == context.frameNumber) {
                stopCapturing(context);
            }
        } else {
            if (context.captureFrameStart == context.frameNumber) {
                startCapturing(context);
            }
        }

        if (context.captureFrame) {
            context.targetStream.markFrame(context.frameNumber);
        }
    };

    function wrapFunction(context, functionName, realFunction) {
        return function () {

            var command = null;
            if (context.captureFrame) {
                command = context.targetStream.recorders[functionName](arguments);
            }

            var result = realFunction.apply(context.innerContext, arguments);

            // Get error state after real call - if we don't do this here, tracing/capture calls could mess things up
            var error = context.innerContext.getError();
            if (error != context.NO_ERROR) {
                context.errorMap[error] = true;

                if (context.options.breakOnError) {
                    // TODO: backtrace?
                    errorBreak();
                }
            }

            if (context.captureFrame) {
                command.duration = (new Date()).getTime() - command.time;
            }

            // If this is the frame separator then handle it
            if (functionName == context.options.frameSeparator) {
                frameSeparator(context);
            }

            return result;
        };
    };

    var Context = function (innerContext, options) {
        // options: {
        //     breakOnError: bool
        //     frameSeparator: 'clear'/'finish'/'flush' etc
        // }
        options = options || {
            frameSeparator: 'finish'
        };

        this.options = options;
        this.innerContext = innerContext;
        this.isWrapped = true;

        this.frameNumber = 0;

        // Target stream for capture data
        this.targetStream = null;
        // Function to call when capture completes
        this.captureCallback = null;
        // Frame range to capture (inclusive) - if inside a capture window, captureFrame == true
        this.captureFrameStart = null;
        this.captureFrameEnd = null;
        this.captureFrame = false;

        this.errorMap = {};

        // Clone all properties in context
        for (var propertyName in innerContext) {
            if (typeof innerContext[propertyName] == 'function') {
                // Functions
                this[propertyName] = wrapFunction(this, propertyName, innerContext[propertyName]);
            } else {
                // Enums/constants/etc
                this[propertyName] = innerContext[propertyName];
            }
        }

        // Rewrite getError so that it uses our version instead
        this.getError = function () {
            for (var error in this.errorMap) {
                if (this.errorMap[error]) {
                    this.errorMap[error] = false;
                    return error;
                }
            }
            return this.NO_ERROR;
        };
    };

    Context.prototype.capture = function (stream, callback) {
        this.targetStream = stream;
        this.captureCallback = callback;
        this.captureFrameStart = this.frameNumber + 1;
        this.captureFrameEnd = this.captureFrameStart + 1;
        this.captureFrame = false;
    };

    gli.Context = Context;
})();
