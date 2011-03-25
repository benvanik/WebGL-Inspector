(function () {
    var playback = glinamespace("gli.playback");
    
    var ResourceTarget = function ResourceTarget(resource) {
        this.resource = resource;
        
        this.version = null;
        this.value = null;
        this.dirty = false;
    };

    ResourceTarget.prototype.ensureVersion = function ensureVersion(pool, version) {
        if (!this.dirty && this.version === version) {
            return;
        }

        this.discard(pool);

        this.version = version;
        this.resource.createTarget(pool, version, this);
        if (this.value) {
            this.value.target = this;
        }
        this.dirty = false;
    };

    ResourceTarget.prototype.discard = function discard(pool) {
        if (this.value) {
            this.value.target = null;
            this.resource.deleteTarget(pool, this.value);
            this.value = null;
        }
        this.dirty = false;
    };

    ResourceTarget.prototype.markDirty = function markDirty(gl) {
        this.dirty = true;
    };

    playback.ResourceTarget = ResourceTarget;

})();
