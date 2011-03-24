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
        
        // 1: setup statistics counters/etc
        this.setupStatistics();
        
        // 2: setup base method implementations
        this.methods = {};
        this.setupMethods();
        
        // 3: setup resource cache
        this.resourceCache = new gli.capture.ResourceCache(this);
        
        // 4: setup modes
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
    
    // Setup statistics
    DebuggerImpl.prototype.setupStatistics = function setupStatistics() {
        var self = this;
        var gl = this.raw;
        
        var CallCounter = function CallCounter(name) {
            this.name = name;
            this.total = 0;
            this.frame = 0;
        };
        
        var ResourceCounter = function ResourceCounter(type) {
            this.type = type;
            this.created = 0;
            this.alive = 0;
            this.createdBytes = 0;
            this.aliveBytes = 0;
        };
        
        this.statistics = {
            frameCount: 0,
            totalCalls: new CallCounter("calls"),
            resources: {},
            calls: {}
        };
        this.allCallCounters = [];
        
        // Resource counters
        var resourceTypes = [
            "Buffer",
            "Framebuffer",
            "Program",
            "Renderbuffer",
            "Shader",
            "Texture"
        ];
        for (var n = 0; n < resourceTypes.length; n++) {
            var name = resourceTypes[n];
            var counter = new ResourceCounter(name);
            this.statistics.resources[name] = counter;
        }
        
        // Call counters (one per method)
        for (var name in gl) {
            if (typeof gl[name] !== 'function') {
                continue;
            }
            
            var counter = new CallCounter(name);
            this.statistics.calls[name] = counter;
            this.allCallCounters.push(counter);            
        }
    };
    
    // Build all the base methods
    DebuggerImpl.prototype.setupMethods = function setupMethods() {
        var self = this;
        var gl = this.raw;
        
        var methods = this.methods;
        
        var totalCalls = this.statistics.totalCalls;
        
        // Grab all methods from the raw gl context
        for (var name in gl) {
            if (typeof gl[name] !== 'function') {
                continue;
            }
            
            var original = gl[name];
            var counter = this.statistics.calls[name];
            
            methods[name] = (function(gl, original, totalCalls, counter) {
                return function baseCall() {
                    totalCalls.frame++;
                    counter.frame++;
                    return original.apply(gl, arguments);
                };
            })(gl, original, totalCalls, counter);
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
        var statistics = this.statistics;
        
        this.inFrame = true;
        
        // Even though we are watching most timing methods, we can't be too safe
        // This will (try) to ensure a termination event ASAP
        gli.util.setTimeout(forceFrameEnd, 0);
        
        this.mode.beginFrame();
    };
    
    // Main end-frame logic
    DebuggerImpl.prototype.endFrame = function endFrame() {
        var statistics = this.statistics;
        
        this.inFrame = false;
        this.mode.endFrame();
        
        // TODO: event?
    };
    
    // Called every frame termination
    DebuggerImpl.prototype.frameTerminator = function frameTerminator() {
        var statistics = this.statistics;
        
        if (this.inFrame) {
            // Frame just ended
            this.endFrame();
        }
        
        // Frame increase, if any gl calls made
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
