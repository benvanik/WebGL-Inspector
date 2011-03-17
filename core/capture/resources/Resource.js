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
        this.currentVersion = new resources.ResourceVersion(this.versionNumber);
        this.version.push(this.currentVersion);
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
        if (!this.dirty) {
            this.versionNumber++;
            this.currentVersion = new resources.ResourceVersion(this.versionNumber);
            this.version.push(this.currentVersion);
            this.dirty = true;
        } else {
            if (reset) {
                this.versionNumber++;
                this.currentVersion = new resources.ResourceVersion(this.versionNumber);
                this.version.push(this.currentVersion);
            }
        }
    };
    
    Resource.prototype.markDeleted = function markDeleted(stack) {
        this.alive = false;
        this.deletionStack = stack;
        
        this.target = null;
    };
    
    Resource.buildRecorder = function buildRecorder(methods, name, getTracked, doesReset, additional) {
        var original = methods[name];
        methods[name] = function recorder() {
            var tracked;
            if (getTracked) {
                tracked = getTracked(this, arguments);
            } else {
                tracked = arguments[0] ? arguments[0].tracked : null;
            }
            if (!tracked) {
                return;
            }
            tracked.markDirty(doesReset);
            if (additional) {
                additional(this, tracked);
            }
            tracked.currentVersion.recordCall(name, arguments);
            return original.apply(this, arguments);
        };
    };
    
    resources.Buffer = Buffer;
    
})();
