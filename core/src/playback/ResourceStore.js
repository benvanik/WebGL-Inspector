(function () {
    var playback = glinamespace("gli.playback");

    var ResourceStore = function ResourceStore(session) {
        this.session = session;

        this.resources = [];        // [res, res, ...]
        this.resourcesById = {};    // id : res
        this.resourcesByType = {};  // type : [res, res, ...]

        this.resourceAdded = new gli.util.EventSource("resourceAdded");
        this.resourceUpdated = new gli.util.EventSource("resourceUpdated");
        this.resourceDeleted = new gli.util.EventSource("resourceDeleted");
        this.resourceVersionAdded = new gli.util.EventSource("resourceVersionAdded");

        this.pools = [];
        this.basePool = new gli.playback.ResourcePool(this, null, {
            // options
        }, null);
    };

    ResourceStore.prototype.getAllResources = function getAllResources() {
        return this.resources.slice();
    };
    
    ResourceStore.prototype.getResourceById = function getResourceById(id) {
        return this.resourcesById[id];
    };

    ResourceStore.prototype.getResourceVersion = function getResourceVersion(id, versionNumber) {
        var resource = this.getResourceById(id);
        for (var n = 0; n < resource.versions.length; n++) {
            var version = resource.versions[n];
            if (version.versionNumber === versionNumber) {
                return version;
            }
        }
        return null;
    };
    
    ResourceStore.prototype.getResourcesByType = function getResourcesByType(type) {
        var typed = this.resourcesByType[type];
        if (typed) {
            return typed.slice();
        } else {
            return [];
        }
    };
    
    ResourceStore.prototype.getBuffers = function getBuffers() {
        return this.getResourcesByType("Buffer");
    };

    ResourceStore.prototype.getFramebuffers = function getFramebuffers() {
        return this.getResourcesByType("Framebuffer");
    };
    
    ResourceStore.prototype.getPrograms = function getPrograms() {
        return this.getResourcesByType("Program");
    };

    ResourceStore.prototype.getRenderbuffers = function getRenderbuffers() {
        return this.getResourcesByType("Renderbuffer");
    };

    ResourceStore.prototype.getShaders = function getShaders() {
        return this.getResourcesByType("Shader");
    };
    
    ResourceStore.prototype.getTextures = function getTextures() {
        return this.getResourcesByType("Texture");
    };

    ResourceStore.prototype.addResource = function addResource(sourceResource) {
        var ctor = gli.playback.resources[sourceResource.type];
        var resource = new ctor(this.session, sourceResource);

        this.resources.push(resource);
        this.resourcesById[resource.id] = resource;
        var typed = this.resourcesByType[resource.type];
        if (typed) {
            typed.push(resource);
        } else {
            typed = [resource];
            this.resourcesByType[resource.type] = typed;
        }

        this.resourceAdded.fire(resource);
    };

    ResourceStore.prototype.updateResource = function updateResource(sourceResource) {
        var resource = this.getResourceById(resource.id);
        resource.update(sourceResource);

        this.resourceUpdated.fire(resource);
    };

    ResourceStore.prototype.deleteResource = function deleteResource(resourceId) {
        var resource = this.getResourceById(resourceId);
        resource.alive = false;

        this.resourceDeleted.fire(resource);
    };
    
    ResourceStore.prototype.addResourceVersion = function addResourceVersion(resourceId, sourceVersion) {
        var version = new gli.playback.resources.ResourceVersion(this.session, sourceVersion);

        var resource = this.getResourceById(resourceId);
        resource.versions.push(version);

        this.resourceVersionAdded.fire(resource, version);
    };

    ResourceStore.prototype.allocatePool = function allocatePool(options, mutators) {
        var pool = new gli.playback.ResourcePool(this, this.basePool, options, mutators);
        this.pools.push(pool);
        return pool;
    };

    ResourceStore.prototype.discardPool = function discardPool(pool) {
        pool.discard();
        this.pools.splice(this.pools.indexOf(pool), 1);
    };

    ResourceStore.prototype.discard = function discard() {
        for (var n = 0; n < this.pools.length; n++) {
            this.pools[n].discard();
        }
        this.pools.length = 0;
        this.basePool.discard();
    };

    playback.ResourceStore = ResourceStore;

})();
