(function () {
    var host = glinamespace("gli.host");

    function errorBreak() {
        throw "WebGL error!";
    };

    function startCapturing(context) {
        context.captureFrame = true;
        //context.notifier.postMessage("capturing frame " + context.frameNumber + "...");
    };

    function stopCapturing(context) {
        context.notifier.postMessage("captured frame " + (context.frameNumber - 1));
        context.captureFrame = false;

        var frame = context.currentFrame;

        context.markFrame(null); // mark end

        // Fire off callback (if present)
        if (context.captureCallback) {
            context.captureCallback(context, frame);
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
            context.markFrame(context.frameNumber);
        }

        // When this timeout gets called we can be pretty sure we are done with the current frame
        setTimeout(function () {
            context.inFrame = false;
        }, 0);
    };

    function wrapFunction(context, functionName) {
        var originalFunction = context.rawgl[functionName];
        return function () {
            var gl = context.rawgl;

            var stack = null;
            function generateStack() {
                // Generate stack trace
                var stack = printStackTrace();
                // ignore garbage
                stack = stack.slice(4);
                // Fix up our type
                stack[0] = stack[0].replace("[object Object].", "gl.");
            };

            if (context.inFrame == false) {
                // First call of a new frame!
                context.inFrame = true;
                frameSeparator(context);
            }

            // PRE:
            var call = null;
            if (context.captureFrame) {
                // NOTE: for timing purposes this should be the last thing before the actual call is made
                stack = stack || (context.options.resourceStacks ? generateStack() : null);
                call = context.currentFrame.allocateCall(functionName, stack, arguments);
            }

            var result = originalFunction.apply(context.rawgl, arguments);

            // Get error state after real call - if we don't do this here, tracing/capture calls could mess things up
            var error = context.options.ignoreErrors ? context.NO_ERROR : gl.getError();

            // POST:
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

    var CaptureContext = function (canvas, rawgl, options) {
        options = options || {
            ignoreErrors: true,
            breakOnError: false,
            resourceStacks: false,
            callStacks: false,
            frameSeparator: null
        };

        this.options = options;
        this.canvas = canvas;
        this.rawgl = rawgl;
        this.isWrapped = true;
        
        this.notifier = new host.Notifier();

        this.rawgl.canvas = canvas;
        gli.info.initialize(this.rawgl);

        this.frameNumber = 0;
        this.inFrame = false;

        // Function to call when capture completes
        this.captureCallback = null;
        // Frame range to capture (inclusive) - if inside a capture window, captureFrame == true
        this.captureFrameStart = null;
        this.captureFrameEnd = null;
        this.captureFrame = false;
        this.currentFrame = null;

        this.errorMap = {};

        // NOTE: this should happen ASAP so that we make sure to wrap the faked function, not the real-REAL one
        gli.hacks.installAll(rawgl);

        // Clone all properties in context and wrap all functions
        for (var propertyName in rawgl) {
            if (typeof rawgl[propertyName] == 'function') {
                // Functions
                this[propertyName] = wrapFunction(this, propertyName, rawgl[propertyName]);
            } else {
                // Enums/constants/etc
                this[propertyName] = rawgl[propertyName];
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

        // Add a few helper methods
        this.ignoreErrors = rawgl.ignoreErrors = function () {
            while (this.getError() != this.NO_ERROR);
        };

        // Add debug methods
        this.mark = function () {
            if (context.captureFrame) {
                context.currentFrame.mark(arguments);
            }
        };

        // TODO: before or after we wrap? if we do it here (after), then timings won't be affected by our captures
        this.resources = new gli.host.ResourceCache(this);
    };

    CaptureContext.prototype.markFrame = function (frameNumber) {
        if (this.currentFrame) {
            // Close the previous frame
            this.currentFrame.end(this.rawgl);
            this.currentFrame = null;
        }

        if (frameNumber == null) {
            // Abort if not a real frame
            return;
        }

        var frame = new gli.host.Frame(this.rawgl, frameNumber);
        frame.resourceVersions = this.resources.captureVersions();
        this.currentFrame = frame;
    };

    CaptureContext.prototype.requestCapture = function (callback) {
        this.captureCallback = callback;
        this.captureFrameStart = this.frameNumber + 1;
        this.captureFrameEnd = this.captureFrameStart + 1;
        this.captureFrame = false;
    };

    host.CaptureContext = CaptureContext;

    // options: {
    //     ignoreErrors: bool - ignore errors on calls (can drastically speed things up)
    //     breakOnError: bool - break on gl error
    //     resourceStacks: bool - collect resource creation/deletion callstacks
    //     callStacks: bool - collect callstacks for each call
    //     frameSeparator: 'clear'/'finish'/'flush' etc
    // }
    host.inspectContext = function (canvas, rawgl, options) {
        // Ignore if we have already wrapped the context
        if (rawgl.isWrapped) {
            // NOTE: if options differ we may want to unwrap and re-wrap
            return rawgl;
        }

        var wrapped = new CaptureContext(canvas, rawgl, options);

        return wrapped;
    };

})();
