(function () {
    var resources = glinamespace("gli.playback.resources");

    var Resource = function Resource(session, source) {
        this.id = source.id;
        this.update(source);

        this.versions = [];
    };

    Resource.prototype.update = function update(source) {
        this.alive = source.alive;
        this.type = source.type;
        this.creationStack = source.creationStack;
        this.deletionStack = source.deletionStack;
        this.displayName = source.displayName;
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

    resources.Resource = Resource;

})();
