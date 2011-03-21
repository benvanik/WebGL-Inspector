(function () {
    var playback = glinamespace("gli.playback");

    var ResourcePool = function ResourcePool(store, parentPool, options, mutators) {
        this.store = store;
        this.parentPool = parentPool;
        this.options = options;
        this.mutators = mutators || [];
        
        if (parentPool) {
            // Steal parent canvas/gl
            this.canvas = parentPool.canvas;
            this.gl = parentPool.gl;
        } else {
            // Create a canvas and add it to a fragment (required for FF)
            this.canvas = document.createElement("canvas");
            var frag = document.createDocumentFragment();
            frag.appendChild(this.canvas);

            // Get a GL context to use
            this.gl = gli.util.getWebGLContext(this.canvas, options.attributes);
        }

        this.resources = [];        // [target, target, ...]
        this.resourcesById = {};    // {id: target, id: target, ...}

        // Cache for perf
        this.mutatedTypes = {};
        for (var n = 0; n < this.mutators.length; n++) {
            var mutator = this.mutators[n];
            var typeHandlers = mutator.resourceHandlers;
            for (var type in typeHandlers) {
                this.mutatedTypes[type] = true;
            }
        }
    };

    ResourcePool.prototype.cloneResourceLocal = function cloneResourceLocal(id) {
        var resource = this.store.getResourceById(id);
        if (!resource) {
            return;
        }

        var target = new gli.playback.ResourceTarget(this, resource);
        this.resources.push(target);
        this.resourcesById[id] = target;
        return target;
    };

    ResourcePool.prototype.getResourceById = function getResourceById(id, localOnly) {
        var target = this.resourcesById[id];
        if (target) {
            // Found
            return target;
        } else if (!localOnly && this.parentPool) {
            // Look in parent (we don't need our own version)
            return this.parentPool.getResourceById(id);
        } else {
            // Clone resource local
            return this.cloneResourceLocal(id);
        }
    };

    ResourcePool.prototype.getTargetValue = function getTargetValue(resource) {
        var target = this.getResourceById(resource.id);
        if (!target) {
            return null;
        }
        return target.value;
    };

    ResourcePool.prototype.ensureResourceVersion = function ensureResourceVersion(resource, version) {
        var localOnly = !!this.mutatedTypes[resource.type];
        var target = this.getResourceById(resource.id, localOnly);
        target.ensureVersion(version);
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
