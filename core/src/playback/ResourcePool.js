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

            // Setup captures (only do once on a context)
            var resourceTypes = [
                "Buffer",
                "Framebuffer",
                "Program",
                "Renderbuffer",
                "Shader",
                "Texture"
            ];
            for (var n = 0; n < resourceTypes.length; n++) {
                var name = resourceTypes[n];
                var type = gli.playback.resources[name];
                type.setupCaptures(this);
            }
        }

        this.resources = [];        // [target, target, ...]
        this.resourcesById = {};    // {id: target, id: target, ...}
        
        // Create a combined mutation table
        // Needs to be in order of pool (0->N) and then in order of the given list (0->M)
        // Do some fancy shuffling to make that so
        var allMutators = this.mutators.slice().reverse();
        var parent = parentPool;
        while (parent) {
            allMutators = allMutators.concat(parent.mutators.slice().reverse());
            parent = parent.parentPool;
        }
        allMutators.reverse();
        this.mutationTable = gli.playback.mutators.Mutator.createMutationTable(allMutators);
    };

    ResourcePool.prototype.cloneResourceLocal = function cloneResourceLocal(id) {
        var resource = this.store.getResourceById(id);
        if (!resource) {
            return;
        }

        var target = new gli.playback.ResourceTarget(resource);
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
        var localOnly = !!this.mutationTable.resources[resource.type];
        var target = this.getResourceById(resource.id, localOnly);
        target.ensureVersion(this, version);
    };

    ResourcePool.prototype.discard = function discard() {
        for (var n = 0; n < this.resources.length; n++) {
            var target = this.resources[n];
            target.discard(this);
        }
        this.resources.length = 0;
        this.resourcesById = {};
    };
    
    playback.ResourcePool = ResourcePool;

})();
