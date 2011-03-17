(function () {
    var data = glinamespace("gli.capture.data");
    
    var Call = function Call(ordinal, type, name, rawArgs, resourceTable) {
        this.ordinal = ordinal;
        this.type = type;
        this.name = name;
        
        this.resourcesUsed = [];

        // Clone args
        var args = [];
        for (var n = 0; n < rawArgs.length; n++) {
            var sarg = rawArgs[n];
            var darg = null;
            if (sarg) {
                if (sarg.sourceUniformName) {
                    // Uniform location
                    darg = sarg;
                } else {
                    if (gli.util.isWebGLResource(sarg)) {
                        // WebGL resource reference
                        darg = sarg;

                        // Pull out tracking reference and add to resource table
                        var tracked = sarg.tracked;
                        this.resourcesUsed.push(tracked);
                        if (resourceTable) {
                            data.Frame.markResourceUsed(resourceTable, tracked);
                        }
                    } else {
                        // Generic arg
                        darg = gli.util.clone(sarg);
                    }
                }
            } else {
                darg = sarg;
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
        delete this.resourcesUsed;

        for (var n = 0; n < this.args.length; n++) {
            var arg = this.args[n];
            if (arg) {
                if (arg.sourceUniformName) {
                    this.args[n] = {
                        type: "UniformLocation",
                        program: arg.sourceProgram.id,
                        name: arg.sourceUniformName
                    };
                } else if (gli.util.isWebGLResource(arg)) {
                    var tracked = arg.tracked;
                    this.args[n] = {
                        type: tracked.type,
                        id: tracked.id
                    };
                } else if (gli.util.isTypedArray(arg)) {
                    this.args[n] = gli.util.typedArrayToArray(arg);
                }
            }
        }
    };
    
    data.Call = Call;
    
})();
