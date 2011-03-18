(function () {
    var transports = glinamespace("gli.capture.transports");
    
    var JsonTransport = function JsonTransport() {
        var options = {
            streaming: false
        };
        glisubclass(gli.capture.transports.Transport, this, [options]);
        
        this.storage = {
            resources: {},
            resourceVersions: {},
            captureFrames: [],
            timingFrames: []
        };
    };
    
    JsonTransport.prototype.appendResource = function appendResource(resource) {
        this.storage.resources[resource.id] = resource;
    };
    
    JsonTransport.prototype.appendResourceVersion = function appendResourceVersion(resource, version) {
        var versions = this.storage.resourceVersions[resource.id];
        if (!versions) {
            versions = {};
            this.storage.resourceVersions[resource.id] = versions;
        }
        versions[version.versionNumber] = version;
    };
    
    JsonTransport.prototype.appendResourceDeletion = function appendResourceDeletion(resource) {
    };
    
    JsonTransport.prototype.appendCaptureFrame = function appendCaptureFrame(request, frame) {
        this.storage.captureFrames.push({
            request: request,
            frame: frame
        });
    };
    
    JsonTransport.prototype.appendTimingFrame = function appendTimingFrame(request, frame) {
        this.storage.timingFrames.push({
            request: request,
            frame: frame
        });
    };
    
    JsonTransport.prototype.prepareCaptureForTransport = function prepareCaptureForTransport() {
        var frames = this.captureFrames;
        
        // Determine all required resources and their required versions
        var requiredResources = {};
        for (var n = 0; n < frames.length; n++) {
            var frame = frames[n];
            for (var m = 0; m < frame.initialResources.length; m++) {
                var ref = frame.initialResources[m];
                var res = requiredResources[ref.id];
                if (!res) {
                    res = [];
                    requiredResources[ref.id] = res;
                }
                if (res.indexOf(ref.version) == -1) {
                    res.push(ref.version);
                }
            }
        }
        
        // Prune the resource tables
        var prunedResources = {};
        var prunedResourceVersions = {};
        for (var id in requiredResources) {
            var resource = this.resources[id];
            if (!resource) {
                console.log("Missing resource!");
                continue;
            }
            prunedResources.push(resource);
            resource.prepareForTransport();
            
            var prunedVersions = {};
            var versions = this.resourceVersions[id];
            if (versions) {
                var versionNumbers = requiredResources[id];
                for (var n = 0; n < versionNumbers.length; n++) {
                    var versionNumber = versionNumbers[n];
                    var version = versions[versionNumber];
                    version.prepareForTransport();
                    prunedVersions[versionNumber] = version;
                }
            }
            prunedResourceVersions[id] = prunedVersions;
        }
        this.storage.resources = prunedResources;
        this.storage.resourceVersions = prunedResourceVersions;
        
        for (var n = 0; n < frames.length; n++) {
            var frame = frames[n];
            frame.prepareForTransport();
        }
    };
    
    JsonTransport.prototype.prepareTimingForTransport = function prepareTimingForTransport() {
        var frames = this.timingFrames;
        
        for (var n = 0; n < frames.length; n++) {
            var frame = frames[n];
            frame.prepareForTransport();
        }
    };
    
    JsonTransport.prototype.stringify = function stringify() {
        this.prepareCaptureForTransport();
        this.prepareTimingForTransport();
        console.log(this.storage);
        console.log(JSON.stringify(this.storage));
    };
    
    transports.JsonTransport = JsonTransport;
    
})();
