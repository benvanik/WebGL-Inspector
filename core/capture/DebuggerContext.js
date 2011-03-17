(function () {
    var capture = glinamespace("gli.capture");
    
    // A modified context contains:
    // + raw: original context
    // + debuggerAttached: true
    // + debuggerImpl: {stuff}
    // + All values from original context
    // + All functions from original context
    
    var DebuggerContext = function DebuggerContext(gl, options) {
        this.raw = gl;
        this.options = options;
        
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
        this.debuggerImpl = new capture.DebuggerImpl(this);
    };
    
    // Wrap a rawl gl context 
    capture.debugContext = function debugContext(gl, options) {
        // Ignore if already wrapped
        if (rawgl.debuggerWrapper) {
            return rawgl.debuggerWrapper;
        }
        
        var wrapper = new DebuggerContext(gl, options);
        if (!wrapper) {
            return null;
        }
        
        rawgl.debuggerWrapper = wrapper;
        return wrapper;
    };
    
})();
