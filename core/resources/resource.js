(function () {

    var Resource = function (gl, target) {
        this.gl = gl;
        this.id = null;
        this.target = target;
        this.status = Resource.ALIVE;

        target.trackedObject = this;

        this.markDead = function () {
            this.status = Resource.DEAD;
            this.target = null; // TODO: hang onto it?
        };
    };

    Resource.ALIVE = 0;
    Resource.DEAD = 1;

    gli.Resource = Resource;

})();
