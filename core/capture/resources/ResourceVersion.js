(function () {
    var resources = glinamespace("gli.capture.data.resources");
    
    var ResourceVersion = function ResourceVersion(versionNumber) {
        this.versionNumber = versionNumber;
        this.parameters = {};
        this.calls = [];
    };
    
    ResourceVersion.prototype.recordCall = function recordCall(name, rawArgs) {
        var call = new gli.capture.data.Call(0, 0, name, rawArgs, null);
        call.complete();
        this.calls.push(call);
    };
    
    ResourceVersion.prototype.getDependentResources = function getDependentResources() {
        var resources = [];
        for (var n = 0; n < this.calls.length; n++) {
            var call = this.calls[n];
            var used = call.resourcesReferenced;
            for (var m = 0; m < used.length; m++) {
                if (resources.indexOf(used[m]) == -1) {
                    resources.push(used);
                }
            }
        }
        return resources;
    };
    
    resources.ResourceVersion = ResourceVersion;
    
})();
