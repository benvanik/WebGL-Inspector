(function () {
    var replay = glinamespace("gli.replay");

    var Resource = function (sourceResource) {
        this.id = sourceResource.id;
        this.status = sourceResource.status;

        this.target = null;

        this.creationFrameNumber = sourceResource.creationFrameNumber;
        this.creationStack = sourceResource.creationStack;
        this.deletionStack = sourceResource.deletionStack;

        this.currentVersion = null;
    };

    Resource.ALIVE = 0;
    Resource.DEAD = 1;

    Resource.prototype.restoreVersion = function (gl, version) {
        if (this.currentVersion != version) {
            this.currentVersion = version;

            this.dispose(gl);
            this.target = this.createTarget(gl, version);
        } else {
            // Already at the current version
        }
    };

    Resource.prototype.dispose = function (gl) {
        if (this.target) {
            this.deleteTarget(gl, this.target);
            this.target = null;
        }
    };

    Resource.prototype.createTarget = function (gl, version) {
        console.log("unimplemented createTarget");
        return null;
    };

    Resource.prototype.deleteTarget = function (gl, target) {
        console.log("unimplemented deleteTarget");
    };

    replay.Resource = Resource;

})();
