(function () {

    var Resource = function (gl, stack, target) {
        this.gl = gl;
        this.id = null;
        this.target = target;
        this.status = Resource.ALIVE;

        target.trackedObject = this;

        this.mirror = null;

        this.creationStack = stack;
        this.deletionStack = null;
        this.uploadStack = null; // ??

        this.markDead = function (stack) {
            this.status = Resource.DEAD;
            //this.target = null; // TODO: hang onto it?
            this.deletionStack = stack;
        };
    };

    Resource.ALIVE = 0;
    Resource.DEAD = 1;

    gli = gli || {};
    gli.Resource = Resource;

})();
