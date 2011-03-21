(function () {
    var playback = glinamespace("gli.playback");
    
    var ResourceTarget = function ResourceTarget(pool, resource) {
        this.pool = pool;
        this.resource = resource;
        
        this.version = null;
        this.value = null;
        this.dirty = false;
    };

    ResourceTarget.prototype.ensureVersion = function ensureVersion(version) {
        if (!this.dirty && this.version === version) {
            return;
        }

        this.discard();

        this.version = version;
        this.resource.createTarget(this.pool, version, this);
        this.dirty = false;
    };

    ResourceTarget.prototype.discard = function discard() {
        this.resource.deleteTarget(this.pool, this.value);
        this.value = null;
        this.dirty = false;
    };

    playback.ResourceTarget = ResourceTarget;

})();
