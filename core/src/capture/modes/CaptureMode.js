(function () {
    var modes = glinamespace("gli.capture.modes");
    
    var CaptureMode = function CaptureMode(impl) {
        this.super.call(this, impl);
        
        this.currentFrame = null;
        
        this.setupCaptures();
    };
    glisubclass(gli.capture.modes.Mode, CaptureMode);
    
    function generateStack() {
        // Generate stack trace
        var stackResult = printStackTrace();
        // ignore garbage
        stackResult = stackResult.slice(4);
        // Fix up our type
        stackResult[0] = stackResult[0].replace("[object Object].", "gl.");
        return stackResult;
    };
    
    CaptureMode.prototype.wrapMethod = function wrapMethod(name, original) {
        var self = this;
        var impl = this.impl;
        var options = this.impl.options;
        var gl = this.impl.raw;
        var errorMap = this.impl.errorMap;
        
        return function captureCall() {
            // First call of the frame
            if (!impl.inFrame) {
                impl.beginFrame();
            }
            
            // Switch off if we are in frame or out (to reduce branching overhead)
            var result;
            if (self.currentFrame) {
                // PRE:
                var frame = self.currentFrame;
                
                // Ignore all errors
                if (!options.ignoreErrors) {
                    while (gl.getError() != this.NO_ERROR);
                }
                
                // Grab stack, if desired
                var stack = (options.resourceStacks ? generateStack() : null);
                
                // NOTE: for timing purposes this should be the last thing before the actual call is made
                var call = frame.allocateCall(0, name, arguments);
                
                // SELF:
                var startTime = frame.interval.microseconds();
                result = original.apply(gl, arguments);
                var endTime = frame.interval.microseconds();
                
                // Grab errors ASAP (in case we mess with them)
                var error = gl.NO_ERROR;
                if (!options.ignoreErrors) {
                    error = gl.getError();
                }
                
                // POST:
                if (error != gl.NO_ERROR) {
                    stack = stack || generateStack();
                    errorMap[error] = true;
                }
                
                // Complete call
                call.complete(endTime - startTime, result, error, stack);
                frame.completeCall(call);
            } else {
                // Normal call
                result = original.apply(gl, arguments);
                
                // Grab errors ASAP (in case we mess with them)
                var error = gl.NO_ERROR;
                if (!options.ignoreErrors) {
                    error = gl.getError();
                }
                
                // Add error to map
                if (error != gl.NO_ERROR) {
                    errorMap[error] = true;
                }
            }
            
            return result;
        };
    };
    
    CaptureMode.prototype.setupCaptures = function setupCaptures() {
        var gl = this.impl.raw;
        var methods = this.methods;
        
        for (var name in gl) {
            if (typeof gl[name] !== 'function') {
                continue;
            }
            
            var original = methods[name];
            methods[name] = this.wrapMethod(name, original);
        }
    };
    
    // Begin a frame
    CaptureMode.prototype.beginFrame = function beginFrame() {
        var gl = this.impl.raw;
        
        if (!this.preFrame()) {
            return;
        }
        
        var frame = new gli.capture.data.CaptureFrame(gl, this.impl.frameNumber, this.impl.resourceCache);
        this.currentFrame = frame;
    };
    
    // End a frame
    CaptureMode.prototype.endFrame = function endFrame() {
        var frame = this.currentFrame;
        this.currentFrame = null;
        
        if (frame) {
            var request = this.postFrame(frame);
            
            this.impl.session.appendCaptureFrame(request, frame);
            
            if (request.callback) {
                request.callback(frame);
            }
        }
    };
    
    modes.CaptureMode = CaptureMode;
    
})();
