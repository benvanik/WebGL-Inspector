(function () {
    var capture = glinamespace("gli.capture");
    
    var DebuggerImpl = function DebuggerImpl(context, transport, options) {
        this.context = context;
        this.options = options;
        this.canvas = context.canvas;
        this.raw = context.raw;
        
        // Global options
        this.options.ignoreErrors = true;
        
        this.session = new capture.CaptureSession(this, transport);
        
        this.errorMap = {};        
        
        // The order of initialization here matters!
        
        // 1: setup base method implementations
        this.methods = {};
        this.setupMethods();
        
        // 2: setup resource cache
        this.resourceCache = new gli.capture.ResourceCache(this);
        
        // 3: setup modes
        switch (options.mode) {
        default:
        case "capture":
            this.mode = new gli.capture.modes.CaptureMode(this);
            break;
        case "timing":
            this.mode = new gli.capture.modes.TimingMode(this);
            break;
        };
        
        this.enabledExtensions = [];
        this.customExtensions = {
            "GLI_debugger": new gli.capture.extensions.GLI_debugger(this)
        };
        
        this.frameNumber = 0;
        this.inFrame = false;
        
        gli.util.frameTerminator.addListener(this, this.frameTerminator);
        
        this.mode.attach();
    };
    
    // Build all the base methods
    DebuggerImpl.prototype.setupMethods = function setupMethods() {
        var self = this;
        var gl = this.raw;
        
        var methods = this.methods;
        
        // Grab all methods from the raw gl context
        for (var name in gl) {
            if (typeof gl[name] !== 'function') {
                continue;
            }
            methods[name] = gl[name];
        }
        
        // getSupportedExtensions
        var original_getSupportedExtensions = gl.getSupportedExtensions;
        methods["getSupportedExtensions"] = function getSupportedExtensions() {
            var supportedExtensions = original_getSupportedExtensions.apply(this);
            for (var name in self.customExtensions) {
                supportedExtensions.push(name);
            }
            return supportedExtensions;
        };
        
        // getExtension
        var original_getExtension = gl.getExtension;
        methods["getExtension"] = function getExtension(name) {
            // Check for custom extension or defer to implementation
            var ext = self.customExtensions[name];
            if (!ext) {
                ext = original_getExtension.apply(this, arguments);
            }
            
            // Track enabled extensions
            if (ext) {
                if (self.enabledExtensions.indexOf(name) === -1) {
                    self.enabledExtensions.push(name);
                }
            }
            
            return ext;
        };
        
        // Rewrite getError so that it uses our version instead
        var errorMap = this.errorMap;
        methods["getError"] = function getError() {
            for (var error in errorMap) {
                if (errorMap[error]) {
                    errorMap[error] = false;
                    return error;
                }
            }
            return gl.NO_ERROR;
        };
        
        return methods;
    };
    
    function forceFrameEnd() {
        gli.util.frameTerminator.fire();
    };
    
    // Main begin-frame logic
    DebuggerImpl.prototype.beginFrame = function beginFrame() {
        this.inFrame = true;
        
        // Even though we are watching most timing methods, we can't be too safe
        // This will (try) to ensure a termination event ASAP
        gli.util.setTimeout(forceFrameEnd, 0);
        
        this.mode.beginFrame();
    };
    
    // Main end-frame logic
    DebuggerImpl.prototype.endFrame = function endFrame() {
        this.inFrame = false;
        this.mode.endFrame();
        
        // TODO: event?
    };
    
    // Called every frame termination
    DebuggerImpl.prototype.frameTerminator = function frameTerminator() {
        if (this.inFrame) {
            // Frame just ended
            this.endFrame();
        }
        
        // Frame increase, if any gl calls made
        // TODO: move to capture mode?
        var statistics = this.statistics;
        var totalCalls = statistics.totalCalls;
        if (totalCalls.frame > 0) {
            statistics.frameCount++;
            this.frameNumber++;
            
            totalCalls.total += totalCalls.frame;
            totalCalls.frame = 0;
            
            // Sum up call counters
            var allCallCountersLength = this.allCallCounters.length;
            for (var n = 0; n < allCallCountersLength; n++) {
                var counter = this.allCallCounters[n];
                counter.total += counter.frame;
                counter.frame = 0;
            }
        }
    };
    
    // Queue a capture request (next frame)
    DebuggerImpl.prototype.queueCaptureRequest = function queueCaptureRequest(request) {
        this.mode.queueRequest(request);
    };
    
    capture.DebuggerImpl = DebuggerImpl;
    
})();
