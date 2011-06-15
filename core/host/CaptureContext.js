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
        original_setTimeout(function () {
            host.frameTerminator.fire();
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

        this.frameCompleted = new gli.EventSource("frameCompleted");

        // NOTE: this should happen ASAP so that we make sure to wrap the faked function, not the real-REAL one
        gli.hacks.installAll(rawgl);

        // NOTE: this should also happen really early, but after hacks
        gli.installExtensions(rawgl);

        // Listen for inferred frame termination and extension termination
        function frameEndedWrapper() {
            frameEnded(this);
        };
        host.frameTerminator.addListener(this, frameEndedWrapper);
        var ext = rawgl.getExtension("GLI_frame_terminator");
        ext.frameEvent.addListener(this, frameEndedWrapper);

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

    host.frameTerminator = new gli.EventSource("frameTerminator");
    
    // This replaces setTimeout/setInterval with versions that, after the user code is called, try to end the frame
    // This should be a reliable way to bracket frame captures, unless the user is doing something crazy (like
    // rendering in mouse event handlers)
    var timerHijacking = {
        value: 0, // 0 = normal, N = ms between frames, Infinity = stopped
        activeIntervals: [],
        activeTimeouts: []
    };
    host.setFrameControl = function (value) {
        timerHijacking.value = value;
        
        // Reset all intervals
        var oldIntervals = timerHijacking.activeIntervals;
        timerHijacking.activeIntervals = [];
        for (var n = 0; n < oldIntervals.length; n++) {
            var interval = oldIntervals[n];
            original_clearInterval(interval.id);
            window.setInterval(interval.code, interval.delay);
        }
        
        // Reset all timeouts
        var oldTimeouts = timerHijacking.activeTimeouts;
        timerHijacking.activeTimeouts = [];
        for (var n = 0; n < oldTimeouts.length; n++) {
            var timeout = oldTimeouts[n];
            original_clearTimeout(timeout.id);
            window.setTimeout(timeout.code, timeout.delay);
        }
    };
    
    function wrapCode(code, args) {
        args = Array.prototype.slice.call(args, 2);
        return function () {
            if (code) {
                if (glitypename(code) == "String") {
                    eval(code);
                } else {
                    code.apply(window, args);
                }
            }
            host.frameTerminator.fire();
        };
    };
    
    var original_setInterval = window.setInterval;
    window.setInterval = function (code, delay) {
        var maxDelay = Math.max(delay, timerHijacking.value);
        if (!isFinite(maxDelay)) {
            maxDelay = 999999999;
        }
        var wrappedCode = wrapCode(code, arguments);
        var intervalId = original_setInterval.apply(window, [wrappedCode, maxDelay]);
        timerHijacking.activeIntervals.push({
            id: intervalId,
            code: code,
            delay: delay
        });
    };
    var original_clearInterval = window.clearInterval;
    window.clearInterval = function (intervalId) {
        for (var n = 0; n < timerHijacking.activeIntervals.length; n++) {
            if (timerHijacking.activeIntervals[n].id == intervalId) {
                timerHijacking.activeIntervals.splice(n, 1);
                break;
            }
        }
        return original_clearInterval.apply(window, arguments);
    };
    var original_setTimeout = window.setTimeout;
    window.setTimeout = function (code, delay) {
        var maxDelay = Math.max(delay, timerHijacking.value);
        if (!isFinite(maxDelay)) {
            maxDelay = 999999999;
        }
        var wrappedCode = wrapCode(code, arguments);
        var cleanupCode = function () {
            // Need to remove from the active timeout list
            window.clearTimeout(timeoutId);
            wrappedCode();
        };
        var timeoutId = original_setTimeout.apply(window, [cleanupCode, maxDelay]);
        timerHijacking.activeTimeouts.push({
            id: timeoutId,
            code: code,
            delay: delay
        });
    };
    var original_clearTimeout = window.clearTimeout;
    window.clearTimeout = function (timeoutId) {
        for (var n = 0; n < timerHijacking.activeTimeouts.length; n++) {
            if (timerHijacking.activeTimeouts[n].id == timeoutId) {
                timerHijacking.activeTimeouts.splice(n, 1);
                break;
            }
        }
        return original_clearTimeout.apply(window, arguments);
    };
    
    // Some apps, like q3bsp, use the postMessage hack - because of that, we listen in and try to use it too
    // Note that there is a race condition here such that we may fire in BEFORE the app message, but oh well
    window.addEventListener("message", function () {
        host.frameTerminator.fire();
    }, false);
    
    // Support for requestAnimationFrame-like APIs
    var requestAnimationFrameNames = [
        "requestAnimationFrame",
        "webkitRequestAnimationFrame",
        "mozRequestAnimationFrame",
        "operaRequestAnimationFrame",
        "msAnimationFrame"
    ];
    for (var n = 0; n < requestAnimationFrameNames.length; n++) {
        var name = requestAnimationFrameNames[n];
        if (window[name]) {
            (function(name) {
                var originalFn = window[name];
                var lastFrameTime = (new Date());
                window[name] = function(callback, element) {
                    var time = (new Date());
                    var delta = (time - lastFrameTime);
                    if (delta > timerHijacking.value) {
                        lastFrameTime = time;
                        var wrappedCallback = function() {
                          callback();
                          host.frameTerminator.fire();
                        };
                        return originalFn.call(window, wrappedCallback, element);
                    } else {
                        window.setTimeout(callback, delta);
                    }
                };
            })(name);
        }
    }
    
    // Everything in the inspector should use these instead of the global values
    host.setInterval = function () {
        return original_setInterval.apply(window, arguments);
    };
    host.clearInterval = function () {
        return original_clearInterval.apply(window, arguments);
    };
    host.setTimeout = function () {
        return original_setTimeout.apply(window, arguments);
    };
    host.clearTimeout = function () {
        return original_clearTimeout.apply(window, arguments);
    };
    
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
