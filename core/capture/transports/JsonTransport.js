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
        frame.request = request;
        this.storage.captureFrames.push(frame);
    };
    
    JsonTransport.prototype.appendTimingFrame = function appendTimingFrame(request, frame) {
        frame.request = request;
        this.storage.timingFrames.push(frame);
    };
    
    JsonTransport.prototype.prepareCaptureForTransport = function prepareCaptureForTransport() {
        var storage = this.storage;
        var frames = storage.captureFrames;
        
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
            var resource = storage.resources[id];
            if (!resource) {
                console.log("Missing resource!");
                continue;
            }
            prunedResources[id] = resource;
            resource.prepareForTransport();
            
            var prunedVersions = {};
            var versions = storage.resourceVersions[id];
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
        storage.resources = prunedResources;
        storage.resourceVersions = prunedResourceVersions;
        
        for (var n = 0; n < frames.length; n++) {
            var frame = frames[n];
            frame.prepareForTransport();
        }
    };
    
    JsonTransport.prototype.prepareTimingForTransport = function prepareTimingForTransport() {
        var storage = this.storage;
        var frames = storage.timingFrames;
        
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
