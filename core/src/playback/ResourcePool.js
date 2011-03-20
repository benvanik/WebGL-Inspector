(function () {
    var playback = glinamespace("gli.playback");

    var ResourcePool = function ResourcePool(store, parentPool, options) {
        this.store = store;
        this.parentPool = parentPool;
        this.options = options;

        // Create a canvas and add it to a fragment (required for FF)
        this.canvas = document.createElement("canvas");
        var frag = document.createDocumentFragment();
        frag.appendChild(this.canvas);

        // Get a GL context to use
        this.gl = gli.util.getWebGLContext(canvas, options.attributes);

        this.resources = [];        // [target, target, ...]
        this.resourcesById = {};    // {id: target, id: target, ...}
    };

    ResourcePool.prototype.isCompatible = function isCompatible(options) {
        //
        return false;
    };

    ResourcePool.prototype.getResourceById = function getResourceById(id) {
        var resource = this.resourcesById[id];
        if (resource) {
            return resource;
        } else {
            return this.parentPool.resourcesById[id];
        }
    };

    ResourcePool.prototype.getTarget = function getTarget(resource) {
        var resource = this.getResourceById(resource.id);
        if (!resource) {
            return null;
        }
        return resource.value;
    };

    ResourcePool.prototype.ensureResourceVersion = function ensureResourceVersion(resource, version) {
        var target = this.getResourceById(resource.id);
        target.ensureVersion(version, this.options);
    };

    ResourcePool.prototype.discard = function discard() {
        for (var n = 0; n < this.resources.length; n++) {
            var target = this.resources[n];
            target.discard();
        }
        this.resources.length = 0;
        this.resourcesById = {};
    };

    playback.ResourcePool = ResourcePool;

})();
