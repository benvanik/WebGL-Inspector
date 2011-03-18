(function () {
    var data = glinamespace("gli.capture.data");
    
    var Call = function Call(ordinal, type, name, rawArgs) {
        this.ordinal = ordinal;
        this.type = type;
        this.name = name;

        // Clone args
        var args = [];
        for (var n = 0; n < rawArgs.length; n++) {
            var sarg = rawArgs[n];
            var darg = sarg;
            if (sarg) {
                if (sarg.sourceUniformName) {
                    // Uniform location
                    darg = sarg;
                } else if (gli.util.isWebGLResource(sarg)) {
                    // WebGL resource reference
                    darg = sarg;
                } else {
                    // Generic arg
                    darg = gli.util.clone(sarg);
                }
            }
            args[n] = darg;
        }
        this.args = args;
        
        // Set on completion
        this.duration = 0;
        this.result = null;
        this.error = null;
        this.stack = null;
        
        // Hopefully right before issue
        this.time = (new Date()).getTime();
    };
    
    Call.prototype.complete = function complete(endTime, result, error, stack) {
        this.duration = endTime - this.time;
        
        // TODO: set? would need to sanitize like arguments
        //this.result = result;
        
        this.error = error;
        this.stack = stack;
    };

    Call.prototype.prepareForTransport = function prepareForTransport() {
        for (var n = 0; n < this.args.length; n++) {
            var sarg = this.args[n];
            var darg = sarg;
            if (sarg) {
                if (sarg.sourceUniformName) {
                    darg = {
                        type: "UniformLocation",
                        program: sarg.sourceProgram.id,
                        name: sarg.sourceUniformName
                    };
                } else if (gli.util.isWebGLResource(sarg)) {
                    var tracked = sarg.tracked;
                    darg = {
                        type: tracked.type,
                        id: tracked.id
                    };
                } else if (gli.util.isTypedArray(sarg)) {
                    darg = gli.util.typedArrayToArray(sarg);
                }
            }
            this.args[n] = darg;
        }
    };
    
    data.Call = Call;
    
})();
