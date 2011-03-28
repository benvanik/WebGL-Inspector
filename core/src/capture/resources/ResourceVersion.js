(function () {
    var resources = glinamespace("gli.capture.resources");
    
    var ResourceVersion = function ResourceVersion(id, versionNumber) {
        this.id = id;
        this.versionNumber = versionNumber;
        this.calls = [];
        
        // To be used only by the resource capture routines
        this.captureCache = {};
        this.dependentResourceIds = {};
    };
    
    ResourceVersion.prototype.prepareForTransport = function prepareForTransport(destructive) {
        if (destructive) {
            // Drop cache
            delete this.captureCache;
            delete this.dependentResourceIds;
        }
    };
    
    ResourceVersion.prototype.clone = function clone(versionNumber) {
        var clone = new ResourceVersion(this.id, versionNumber);
        clone.calls = this.calls.slice();
        gli.util.deepCloneInto(clone.captureCache, this.captureCache);
        return clone;
    };
    
    ResourceVersion.prototype.recordCall = function recordCall(name, rawArgs) {
        var call = new gli.capture.data.Call(0, 0, name, rawArgs);
        call.complete();
        
        // Find dependent resources
        for (var n = 0; n < call.args.length; n++) {
            var arg = call.args[n];
            if (arg && arg.gliType && arg.gliType !== "UniformLocation") {
                if (arg.id == this.id) {
                    // Ignore self
                    continue;
                }
                this.dependentResourceIds[arg.id] = true;
            }
        }
        
        this.calls.push(call);
    };
    
    resources.ResourceVersion = ResourceVersion;
    
})();
