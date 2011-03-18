(function () {
    var capture = glinamespace("gli.capture");
    
    var ResourceCache = function ResourceCache(impl) {
        this.impl = impl;
        this.context = impl.context;
        
        this.resources = [];        // [res, res, ...]
        this.resourcesById = {};    // id : res
        this.resourcesByType = {};  // type : [res, res, ...]
        
        this.setupCaptures();
    };
    
    ResourceCache.prototype.fireResourceCreated = function fireResourceCreated(resource) {
        console.log("resource created");
    };
    
    ResourceCache.prototype.fireResourceModified = function fireResourceModified(resource) {
        console.log("resource modified");
    };
    
    ResourceCache.prototype.fireResourceDeleted = function fireResourceDeleted(resource) {
        console.log("resource deleted");
    };
    
    ResourceCache.prototype.setupCaptures = function setupCaptures() {
        var self = this;
        var methods = this.impl.methods;
        var options = this.impl.options;
        
        var generateStack;
        if (options.resourceStacks) {
            generateStack = function () {
                // Generate stack trace
                var stack = printStackTrace();
                // ignore garbage
                stack = stack.slice(4);
                // Fix up our type
                stack[0] = stack[0].replace("[object Object].", "gl.");
                return stack;
            };
        } else {
            generateStack = function () { return null; }
        }
        
        function captureCreateDelete(typeName) {
            var counter = self.impl.statistics.resources[typeName];
            
            // Create
            var original_create = methods["create" + typeName];
            methods["create" + typeName] = function createType() {
                var gl = this.raw;
                
                var target = original_create.apply(gl, arguments);
                if (!target) {
                    return target;
                }
                
                // Counters
                counter.created++;
                counter.alive++;
                
                // Add tracked type
                var tracked = new capture.data.resources[typeName](this, arguments, target, generateStack());
                target.tracked = tracked;
                self.registerResource(tracked);
                
                return target;
            };
            
            // Delete
            var original_delete = methods["delete" + typeName];
            methods["delete" + typeName] = function deleteType(target) {
                var gl = this.raw;
                
                var tracked = target.tracked;
                if (tracked) {
                    // Counters
                    counter.alive--;
                    
                    // Handle deletion
                    tracked.markDeleted(generateStack());
                    
                    // Fire event
                    self.fireResourceDeleted(tracked);
                }
                
                return original_delete.apply(gl, arguments);
            };
        };
        
        // Setup all resources
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
            
            captureCreateDelete(name);
            
            var type = capture.data.resources[name];
            type.setupCaptures(this.impl);
        }
    };
    
    ResourceCache.prototype.getAllResources = function getAllResources() {
        return this.resources.slice();
    };
    
    ResourceCache.prototype.getResourcesByType = function getResourcesByType(type) {
        var typed = this.resourcesByType[type];
        if (typed) {
            return typed.slice();
        } else {
            return [];
        }
    };
    
    ResourceCache.prototype.getResourceById = function getResourceById(id) {
        return this.resourcesById[id];
    };
    
    ResourceCache.prototype.getBuffers = function getBuffers() {
        return this.getResourcesByType("Buffer");
    };
    
    ResourceCache.prototype.getPrograms = function getPrograms() {
        return this.getResourcesByType("Program");
    };
    
    ResourceCache.prototype.getTextures = function getTextures() {
        return this.getResourcesByType("Texture");
    };
    
    ResourceCache.prototype.registerResource = function registerResource(resource) {
        this.resources.push(resource);
        this.resourcesById[resource.id] = resource;
        var typed = this.resourcesByType[resource.type];
        if (typed) {
            typed.push(resource);
        } else {
            typed = [resource];
            this.resourcesByType[resource.type] = typed;
        }
        
        // TODO: fire event
        console.log("registerResource " + resource);
        
        this.fireResourceCreated(resource);
        
        this.registerResourceVersion(resource, resource.currentVersion);
    };
    
    ResourceCache.prototype.registerResourceVersion = function registerResourceVersion(resource, version) {
        // TODO: fire event
        console.log("registerResourceVersion " + resource + ":" + version);
        
        this.fireResourceModified(resource);
    };
    
    ResourceCache.prototype.processUpdates = function processUpdates() {
    };
    
    ResourceCache.prototype.captureVersions = function captureVersions() {
        var objs = [];
        for (var n = 0; n < this.resources.length; n++) {
            var resource = this.resources[n];
            objs.push({
                id: resource.id,
                version: resource.captureVersion()
            });
        }
        return objs;
    };
    
    capture.ResourceCache = ResourceCache;
    
})();
