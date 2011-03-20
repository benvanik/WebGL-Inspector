(function () {
    var playback = glinamespace("gli.playback");
    
    var ResourceTarget = function ResourceTarget(resource) {
        this.resource = resource;
        
        this.version = null;
        this.value = null;
        this.dirty = false;
    };

    ResourceTarget.prototype.ensureVersion = function ensureVersion(version, options) {
        if (!this.dirty && this.version === version) {
            return;
        }

        this.discard();

        this.version = version;
        this.value = this.resource.createTarget(version, options);
        this.dirty = false;
    };

    ResourceTarget.prototype.discard = function discard() {
        this.resource.deleteTarget(this.value);
        this.value = null;
        this.dirty = false;
    };

    playback.ResourceTarget = ResourceTarget;

})();
