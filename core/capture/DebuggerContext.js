(function () {
    var capture = glinamespace("gli.capture");
    
    var DebuggerContext = function DebuggerContext(canvas, rawgl, options) {
        
    };
    
    capture.debugContext = function debugContext(canvas, rawgl, options) {
        // Ignore if already wrapped
        if (rawgl._parentWrapper) {
            return rawgl._parentWrapper;
        }
        
        var wrapper = new DebuggerContext(canvas, rawgl, options);
        if (!wrapper) {
            return null;
        }
        
        rawgl._parentWrapper = wrapper;
        return wrapper;
    };
    
})();
