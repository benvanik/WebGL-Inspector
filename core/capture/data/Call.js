(function () {
    var data = glinamespace("gli.capture.data");
    
    var Call = function Call(ordinal, type, name, rawArgs, resourceTable) {
        this.ordinal = ordinal;
        this.type = type;
        this.name = name;
        this.args = [];
        
        // Needs to be cleared before transport
        this.resourcesReferenced = [];
        
        // Clone args
        var args = this.args;
        for (var n = 0; n < rawArgs.length; n++) {
            var sarg = rawArgs[n];
            var darg = null;
            if (sarg) {
                if (sarg.sourceUniformName) {
                    // Uniform location
                    // TODO: pull out uniform reference
                    darg = sarg;
                    console.log("need real uniform reference");
                } else {
                    if (gli.util.isWebGLResource(sarg)) {
                        // WebGL resource reference
                        var trackedObject = sarg.trackedObject;
                        
                        // Pull out tracking reference and add to resource table
                        darg = trackedObject.id;
                        this.resourcesReferenced.push(trackedObject);
                        if (resourceTable) {
                            data.Frame.markResourceUsed(resourceTable, trackedObject);
                        }
                    } else {
                        // Generic arg
                        darg = gli.util.clone(sarg);
                    }
                }
            } else {
                darg = sarg;
            }
        }
        
        // Set on completion
        this.duration = 0;
        this.result = null;
        this.error = null;
        this.stack = null;
        
        // Hopefully right before issue
        this.time = (new Date()).getTime();
    };
    
    Call.prototype.complete = function complete(result, error, stack) {
        // Hopefully right after issue
        var time = (new Date()).getTime();
        this.duration = time - this.time;
        
        // TODO: set? would need to sanitize like arguments
        //this.result = result;
        
        this.error = error;
        this.stack = stack;
    };
    
    data.Call = Call;
    
})();
