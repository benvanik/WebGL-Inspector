(function () {
    var host = glinamespace("gli.host");

    function errorBreak() {
        throw "WebGL error!";
    };

    function startCapturing(context) {
        context.ignoreErrors();
        context.captureFrame = true;
        //context.notifier.postMessage("capturing frame " + context.frameNumber + "...");
    };

    function stopCapturing(context) {
        context.notifier.postMessage("captured frame " + (context.frameNumber - 1));
        context.captureFrame = false;
        context.ignoreErrors();

        var frame = context.currentFrame;

        context.markFrame(null); // mark end

        // Fire off callback (if present)
        if (context.captureCallback) {
            context.captureCallback(context, frame);
        }
    };

    function frameEnded(context) {
        if (context.inFrame) {
            context.inFrame = false;
            context.statistics.endFrame();
            context.frameCompleted.fire();
            context.ignoreErrors();
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

        context.statistics.beginFrame();

        // Even though we are watching most timing methods, we can't be too safe
        gli.util.setTimeout(function () {
            gli.util.frameTerminator.fire();
        }, 0);
    };

    function wrapFunction(context, functionName) {
        var originalFunction = context.rawgl[functionName];
        var statistics = context.statistics;
        var callsPerFrame = statistics.callsPerFrame;
        return function () {
            var gl = context.rawgl;

            var stack = null;
            function generateStack() {
                // Generate stack trace
                var stackResult = printStackTrace();
                // ignore garbage
                stackResult = stackResult.slice(4);
                // Fix up our type
                stackResult[0] = stackResult[0].replace("[object Object].", "gl.");
                return stackResult;
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
                call = context.currentFrame.allocateCall(functionName, arguments);
            }

            callsPerFrame.value++;

            if (context.captureFrame) {
                // Ignore all errors before this call is made
                gl.ignoreErrors();
            }

            // Call real function
            var result = originalFunction.apply(context.rawgl, arguments);

            // Get error state after real call - if we don't do this here, tracing/capture calls could mess things up
            var error = context.NO_ERROR;
            if (!context.options.ignoreErrors || context.captureFrame) {
                error = gl.getError();
            }

            // POST:
            if (context.captureFrame) {
                if (error != context.NO_ERROR) {
                    stack = stack || generateStack();
                }
                call.complete(result, error, stack);
            }

            if (error != context.NO_ERROR) {
                context.errorMap[error] = true;

                if (context.options.breakOnError) {
                    // TODO: backtrace?
                    errorBreak();
                }
            }

            // If this is the frame separator then handle it
            if (context.options.frameSeparators.indexOf(functionName) >= 0) {
                frameEnded(context);
            }

            return result;
        };
    };

    var CaptureContext = function (canvas, rawgl, options) {
        var defaultOptions = {
            ignoreErrors: true,
            breakOnError: false,
            resourceStacks: false,
            callStacks: false,
            frameSeparators: gli.settings.global.captureOn
        };
        options = options || defaultOptions;
        for (var n in defaultOptions) {
            if (options[n] === undefined) {
                options[n] = defaultOptions[n];
            }
        }

        this.options = options;
        this.canvas = canvas;
        this.rawgl = rawgl;
        this.isWrapped = true;

        this.notifier = new host.Notifier();

        this.rawgl.canvas = canvas;
        gli.info.initialize(this.rawgl);
        
        this.attributes = rawgl.getContextAttributes ? rawgl.getContextAttributes() : {};

        this.statistics = new host.Statistics();

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

        this.enabledExtensions = [];

        this.frameCompleted = new gli.util.EventSource("frameCompleted");

        // NOTE: this should happen ASAP so that we make sure to wrap the faked function, not the real-REAL one
        gli.hacks.installAll(rawgl);

        // NOTE: this should also happen really early, but after hacks
        gli.capture.installExtension(rawgl);

        // Listen for inferred frame termination and extension termination
        function frameEndedWrapper() {
            frameEnded(this);
        };
        gli.util.frameTerminator.addListener(this, frameEndedWrapper);

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

        // Capture all extension requests
        var original_getExtension = this.getExtension;
        this.getExtension = function (name) {
            var result = original_getExtension.apply(this, arguments);
            if (result) {
                this.enabledExtensions.push(name);
            }
            return result;
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

        var frame = new gli.host.Frame(this.canvas, this.rawgl, frameNumber, this.resources);
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
    //     frameSeparators: ['finish'] / etc
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
