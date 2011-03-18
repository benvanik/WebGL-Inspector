(function () {
    var capture = glinamespace("gli.capture");
    
    // A modified context contains:
    // + raw: original context
    // + debuggerAttached: true
    // + impl: {stuff}
    // + All values from original context
    // + All functions from original context
    
    var DebuggerContext = function DebuggerContext(gl, transport, options) {
        this.raw = gl;
        
        // Clone all properties
        for (var propertyName in gl) {
            if (typeof gl[propertyName] === 'function') {
                // Functions
                // Ignored here - done via mode attachment
            } else {
                // Enums/constants/etc
                this[propertyName] = gl[propertyName];
            }
        }
        
        // Setup debugger private implementation
        this.debuggerAttached = true;
        this.impl = new capture.DebuggerImpl(this, transport, options);
    };
    
    // Wrap a rawl gl context 
    capture.debugContext = function debugContext(gl, options) {
        // Ignore if already wrapped
        if (gl.debuggerWrapper) {
            return gl.debuggerWrapper;
        }
        
        // Default options
        options = options || {};
        var cleanOptions = {
            resourceStacks: (options.resourceStacks !== undefined) ? options.resourceStacks : false,
            mode: (options.mode !== undefined) ? options.mode : "capture"
        };
        
        // Setup transport
        var transport = new gli.capture.transports.DebugTransport();
        
        var wrapper = new DebuggerContext(gl, transport, cleanOptions);
        if (!wrapper) {
            return null;
        }
        
        gl.debuggerWrapper = wrapper;
        return wrapper;
    };
    
})();
