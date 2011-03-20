(function () {
    var playback = glinamespace("gli.playback");

    var ResourceCache = function ResourceCache(session) {
        this.session = session;

        this.resources = [];        // [res, res, ...]
        this.resourcesById = {};    // id : res
        this.resourcesByType = {};  // type : [res, res, ...]

        this.resourceAdded = new gli.util.EventSource("resourceAdded");
        this.resourceUpdated = new gli.util.EventSource("resourceUpdated");
        this.resourceDeleted = new gli.util.EventSource("resourceDeleted");
        this.resourceVersionAdded = new gli.util.EventSource("resourceVersionAdded");
    };

    ResourceCache.prototype.getAllResources = function getAllResources() {
        return this.resources.slice();
    };
    
    ResourceCache.prototype.getResourceById = function getResourceById(id) {
        return this.resourcesById[id];
    };

    ResourceCache.prototype.getResourceVersion = function getResourceVersion(id, versionNumber) {
        var resource = this.getResourceById(id);
        for (var n = 0; n < resource.versions.length; n++) {
            var version = resource.versions[n];
            if (version.versionNumber === versionNumber) {
                return version;
            }
        }
        return null;
    };
    
    ResourceCache.prototype.getResourcesByType = function getResourcesByType(type) {
        var typed = this.resourcesByType[type];
        if (typed) {
            return typed.slice();
        } else {
            return [];
        }
    };
    
    ResourceCache.prototype.getBuffers = function getBuffers() {
        return this.getResourcesByType("Buffer");
    };

    ResourceCache.prototype.getFramebuffers = function getFramebuffers() {
        return this.getResourcesByType("Framebuffer");
    };
    
    ResourceCache.prototype.getPrograms = function getPrograms() {
        return this.getResourcesByType("Program");
    };

    ResourceCache.prototype.getRenderbuffers = function getRenderbuffers() {
        return this.getResourcesByType("Renderbuffer");
    };

    ResourceCache.prototype.getShaders = function getShaders() {
        return this.getResourcesByType("Shader");
    };
    
    ResourceCache.prototype.getTextures = function getTextures() {
        return this.getResourcesByType("Texture");
    };

    ResourceCache.prototype.addResource = function addResource(sourceResource) {
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

    ResourceCache.prototype.updateResource = function updateResource(sourceResource) {
        var resource = this.getResourceById(resource.id);
        resource.update(sourceResource);

        this.resourceUpdated.fire(resource);
    };

    ResourceCache.prototype.deleteResource = function deleteResource(resourceId) {
        var resource = this.getResourceById(resourceId);
        resource.alive = false;

        this.resourceDeleted.fire(resource);
    };
    
    ResourceCache.prototype.addResourceVersion = function addResourceVersion(resourceId, sourceVersion) {
        var version = new gli.playback.resources.ResourceVersion(this.session, sourceVersion);

        var resource = this.getResourceById(resourceId);
        resource.versions.push(version);

        this.resourceVersionAdded.fire(resource, version);
    };

    playback.ResourceCache = ResourceCache;

})();
