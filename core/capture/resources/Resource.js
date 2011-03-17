(function () {
    var resources = glinamespace("gli.capture.data.resources");
    
    var uniqueId = 0;
    
    var Resource = function Resource(resourceCache, rawArgs, target, stack, type) {
        this.id = String(uniqueId++);
        this.alive = true;
        this.type = type;
        
        this.creationStack = stack;
        this.deletionStack = null;
        
        this.versionNumber = 0;
        this.dirty = true;
        
        this.displayName = null;
        
        // NOTE: will need to be removed before transport
        this.target = target;  
        
        this.versions = [];
        this.previousVersion = null;
        this.currentVersion = new resources.ResourceVersion(this.versionNumber);
        this.versions.push(this.currentVersion);
    };
    
    Resource.prototype.getName = function getName() {
        if (this.displayName) {
            return this.displayName;
        } else {
            return this.type + " " + this.id;
        }
    };
    
    Resource.prototype.setName = function setName(name, ifNeeded) {
        if (ifNeeded && this.displayName) {
            return;
        }
        this.displayName = name;
    };
    
    Resource.prototype.captureVersion = function captureVersion() {
        this.dirty = false;
        return this.versionNumber;
    };
    
    Resource.prototype.markDirty = function markDirty(reset) {
        if (this.dirty) {
            // Already dirty
            if (reset) {
                this.versionNumber++;
                this.previousVersion = this.currentVersion;
                this.currentVersion = this.previousVersion.clone(this.versionNumber);
                this.versions.push(this.currentVersion);
                this.dirty = true;
            }
        } else {
            this.versionNumber++;
            this.previousVersion = this.currentVersion;
            this.currentVersion = this.previousVersion.clone(this.versionNumber);
            this.versions.push(this.currentVersion);
            this.dirty = true;
        }
    };
    
    Resource.prototype.markDeleted = function markDeleted(stack) {
        this.alive = false;
        this.deletionStack = stack;
        
        this.target = null;
    };
    
    Resource.buildRecorder = function buildRecorder(methods, name, getTracked, resetCalls, additional) {
        var original = methods[name];
        methods[name] = function recorder() {
            var tracked;
            if (getTracked) {
                tracked = getTracked(this.raw, arguments);
            } else {
                tracked = arguments[0] ? arguments[0].tracked : null;
            }
            if (!tracked) {
                return;
            }
            
            // Mark dirty
            tracked.markDirty(!!resetCalls);
            var version = tracked.currentVersion;
            
            // Remove any reset calls
            if (resetCalls && resetCalls.length) {
                var newCalls = [];
                for (var n = 0; n < version.calls.length; n++) {
                    var call = version.calls[n];
                    if (resetCalls.indexOf(call.name) == -1) {
                        // Keep
                        newCalls.push(call);
                    }
                }
                version.calls = newCalls;
            }
            
            // Record calls
            if (additional) {
                additional(this.raw, tracked);
            }
            version.recordCall(name, arguments);
            
            // Call original
            return original.apply(this, arguments);
        };
    };
    
    resources.Resource = Resource;
    
})();
