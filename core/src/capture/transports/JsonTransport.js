(function () {
    var transports = glinamespace("gli.capture.transports");
    
    var JsonTransport = function JsonTransport() {
        var self = this;
        
        var options = {
            streaming: false
        };
        this.super.call(this, options);
        
        this.storage = {
            sessionInfo: {},
            resources: {},
            resourceVersions: {},
            captureFrames: [],
            timingFrames: []
        };

        gli.util.setTimeout(function () {
            self.fireReady();
        }, 0);
    };
    glisubclass(gli.capture.transports.Transport, JsonTransport);
    
    JsonTransport.prototype.isClosed = function isClosed() {
        return !this.storage;
    };

    JsonTransport.prototype.appendSessionInfo = function appendSessionInfo(sessionInfo) {
        if (this.isClosed()) {
            console.log("JsonTransport already closed");
            return;
        }

        this.storage.sessionInfo = sessionInfo;
    };
    
    JsonTransport.prototype.appendResource = function appendResource(resource) {
        if (this.isClosed()) {
            console.log("JsonTransport already closed");
            return;
        }
        
        this.storage.resources[resource.id] = resource;
    };

    JsonTransport.prototype.appendResourceUpdate = function appendResourceUpdate(resource) {
        if (this.isClosed()) {
            console.log("JsonTransport already closed");
            return;
        }
    };

    JsonTransport.prototype.appendResourceDeletion = function appendResourceDeletion(resource) {
        if (this.isClosed()) {
            console.log("JsonTransport already closed");
            return;
        }
    };
    
    JsonTransport.prototype.appendResourceVersion = function appendResourceVersion(resourceId, version) {
        if (this.isClosed()) {
            console.log("JsonTransport already closed");
            return;
        }
        
        var versions = this.storage.resourceVersions[resourceId];
        if (!versions) {
            versions = {};
            this.storage.resourceVersions[resourceId] = versions;
        }
        versions[version.versionNumber] = version;
    };
    
    JsonTransport.prototype.appendCaptureFrame = function appendCaptureFrame(request, frame) {
        if (this.isClosed()) {
            console.log("JsonTransport already closed");
            return;
        }
        
        frame.request = request;
        this.storage.captureFrames.push(frame);
    };
    
    JsonTransport.prototype.appendTimingFrame = function appendTimingFrame(request, frame) {
        if (this.isClosed()) {
            console.log("JsonTransport already closed");
            return;
        }
        
        frame.request = request;
        this.storage.timingFrames.push(frame);
    };
    
    JsonTransport.prototype.prepareCaptureForTransport = function prepareCaptureForTransport() {
        var storage = this.storage;
        var frames = storage.captureFrames;
        
        var destructive = true;
        
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
            resource.prepareForTransport(destructive);
            
            var prunedVersions = {};
            var versions = storage.resourceVersions[id];
            if (versions) {
                var versionNumbers = requiredResources[id];
                for (var n = 0; n < versionNumbers.length; n++) {
                    var versionNumber = versionNumbers[n];
                    var version = versions[versionNumber];
                    version.prepareForTransport(destructive);
                    prunedVersions[versionNumber] = version;
                }
            }
            prunedResourceVersions[id] = prunedVersions;
        }
        storage.resources = prunedResources;
        storage.resourceVersions = prunedResourceVersions;
        
        for (var n = 0; n < frames.length; n++) {
            var frame = frames[n];
            frame.prepareForTransport(destructive);
        }
    };
    
    JsonTransport.prototype.prepareTimingForTransport = function prepareTimingForTransport() {
        var storage = this.storage;
        var frames = storage.timingFrames;
        
        var destructive = true;
        
        for (var n = 0; n < frames.length; n++) {
            var frame = frames[n];
            frame.prepareForTransport(destructive);
        }
    };
    
    JsonTransport.prototype.jsonify = function jsonify() {
        if (this.isClosed()) {
            console.log("JsonTransport already closed");
            return null;
        }
        
        this.prepareCaptureForTransport();
        this.prepareTimingForTransport();
        
        var storage = this.storage;
        this.storage = null;
        
        return storage;
    };
    
    transports.JsonTransport = JsonTransport;
    
})();
