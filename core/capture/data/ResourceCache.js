(function () {
    var data = glinamespace("gli.capture.data");
    
    var ResourceCache = function ResourceCache(impl) {
        this.impl = impl;
        this.context = impl.context;
        
        this.resources = [];        // [res, res, ...]
        this.resourcesById = {};    // id : res
        this.resourcesByType = {};  // type : [res, res, ...]
        
        this.setupCaptures();
    };
    
    ResourceCache.prototype.fireResourceCreated = function fireResourceCreated(resource) {
    };
    
    ResourceCache.prototype.fireResourceModified = function fireResourceModified(resource) {
    };
    
    ResourceCache.prototype.fireResourceDeleted = function fireResourceDeleted(resource) {
    };
    
    ResourceCache.prototype.setupCaptures = function setupCaptures() {
        var self = this;
        var methods = this.impl.methods;
        var options = this.context.options;
        
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
                var target = original_create.apply(this, arguments);
                if (!target) {
                    return target;
                }
                
                // Counters
                counter.created++;
                counter.alive++;
                
                // Add tracked type
                var tracked = new data.resources[typeName](this, arguments, target, generateStack());
                target.tracked = tracked;
                self.registerResource(tracked);
                
                // Fire event
                self.fireResourceCreated(tracked);
                
                return result;
            };
            
            // Delete
            var original_delete = methods["delete" + typeName];
            methods["delete" + typeName] = function deleteType(target) {
                var tracked = target.tracked;
                if (tracked) {
                    // Counters
                    counter.alive--;
                    
                    // Handle deletion
                    tracked.markDeleted(generateStack());
                    
                    // Fire event
                    self.fireResourceDeleted(tracked);
                }
                
                return original_delete.apply(this, arguments);
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
            
            var type = data.resources[name];
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
        return this.getResourcesByType("WebGLBuffer");
    };
    
    ResourceCache.prototype.getPrograms = function getPrograms() {
        return this.getResourcesByType("WebGLProgram");
    };
    
    ResourceCache.prototype.getTextures = function getTextures() {
        return this.getResourcesByType("WebGLTexture");
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
    
    data.ResourceCache = ResourceCache;
    
})();
