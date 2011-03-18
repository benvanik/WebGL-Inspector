(function () {
    var resources = glinamespace("gli.capture.data.resources");
    
    var ResourceVersion = function ResourceVersion(versionNumber) {
        this.versionNumber = versionNumber;
        this.calls = [];
    };
    
    ResourceVersion.prototype.clone = function clone(versionNumber) {
        var clone = new ResourceVersion(versionNumber);
        clone.calls = this.calls.slice();
        return clone;
    };
    
    ResourceVersion.prototype.recordCall = function recordCall(name, rawArgs) {
        var call = new gli.capture.data.Call(0, 0, name, rawArgs);
        call.complete();
        this.calls.push(call);
    };
    
    ResourceVersion.prototype.getDependentResources = function getDependentResources(self) {
        var resources = [];
        for (var n = 0; n < this.calls.length; n++) {
            var call = this.calls[n];
            for (var m = 0; m < call.args.length; m++) {
                var arg = call.args[m];
                if (arg && gli.util.isWebGLResource(arg)) {
                    var tracked = arg.tracked;
                    if (tracked === self) {
                        continue;
                    }
                    if (resources.indexOf(tracked) == -1) {
                        resources.push(tracked);
                    }
                }
            }
        }
        return resources;
    };
    
    ResourceVersion.prototype.prepareForTransport = function prepareForTransport() {
    };
    
    resources.ResourceVersion = ResourceVersion;
    
})();
