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

        context.stream.markFrame(null); // mark end

        // Fire off callback (if present)
        if (context.captureCallback) {
            context.captureCallback(context, context.stream);
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
            context.stream.markFrame(context.frameNumber);
        }

        // When this timeout gets called we can be pretty sure we are done with the current frame
        setTimeout(function () {
            context.inFrame = false;
        }, 0);
    };

    function wrapFunction(context, functionName, realFunction) {
        return function () {

            // Generate stack trace
            var stack = printStackTrace();
            // ignore garbage
            stack = stack.slice(3);
            // Fix up our type
            stack[0] = stack[0].replace("[object Object].", "gl.");

            if (context.inFrame == false) {
                // First call of a new frame!
                context.inFrame = true;
                frameSeparator(context);
            }

            var resourceCapture = context.stream.resourceCaptures[functionName];
            if (resourceCapture) {
                resourceCapture(stack, arguments);
            }

            var call = null;
            if (context.captureFrame) {
                call = context.stream.recorders[functionName](stack, arguments);
            }

            var result = realFunction.apply(context.innerContext, arguments);

            // Get error state after real call - if we don't do this here, tracing/capture calls could mess things up
            var error = context.innerContext.getError();

            if (resourceCapture) {
                resourceCapture(stack, arguments, result);
            }

            if (context.captureFrame) {
                call.complete(result, error);
            }

            if (error != context.NO_ERROR) {
                context.errorMap[error] = true;

                if (context.options.breakOnError) {
                    // TODO: backtrace?
                    errorBreak();
                }
            }

            // If this is the frame separator then handle it
            if (functionName == context.options.frameSeparator) {
                frameSeparator(context);
            }

            return result;
        };
    };

    var Context = function (canvas, innerContext, options) {
        // options: {
        //     breakOnError: bool
        //     frameSeparator: 'clear'/'finish'/'flush' etc
        // }
        options = options || {
            breakOnError: false,
            frameSeparator: null
        };

        this.options = options;
        this.canvas = canvas;
        this.innerContext = innerContext;
        this.isWrapped = true;

        this.frameNumber = 0;
        this.inFrame = false;

        this.stream = null;

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

        this.ignoreErrors = innerContext.ignoreErrors = function () {
            while (this.getError() != this.NO_ERROR);
        };

        this.stream = new gli.Stream(this);

        // TODO: hook resize events?
    };

    Context.prototype.capture = function (callback) {
        this.captureCallback = callback;
        this.captureFrameStart = this.frameNumber + 1;
        this.captureFrameEnd = this.captureFrameStart + 1;
        this.captureFrame = false;
    };

    gli.Context = Context;
})();
