(function () {
    var host = glinamespace("gli.host");
    var resources = glinamespace("gli.resources");

    function setCaptures(cache, context) {
        var gl = context; //.rawgl;

        var generateStack;
        if (context.options.resourceStacks) {
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
            var originalCreate = gl["create" + typeName];
            gl["create" + typeName] = function () {
                var result = originalCreate.apply(gl, arguments);
                var tracked = new resources[typeName](gl, context.frameNumber, generateStack(), result, arguments);
                cache.registerResource(tracked);
                return result;
            };
            var originalDelete = gl["delete" + typeName];
            gl["delete" + typeName] = function () {
                var tracked = arguments[0].trackedObject;
                tracked.markDeleted(generateStack());
                originalDelete.apply(gl, arguments);
            };
        };

        captureCreateDelete("Buffer");
        captureCreateDelete("Framebuffer");
        captureCreateDelete("Program");
        captureCreateDelete("Renderbuffer");
        captureCreateDelete("Shader");
        captureCreateDelete("Texture");

        resources.Buffer.setCaptures(gl);
        resources.Framebuffer.setCaptures(gl);
        resources.Program.setCaptures(gl);
        resources.Renderbuffer.setCaptures(gl);
        resources.Shader.setCaptures(gl);
        resources.Texture.setCaptures(gl);
    };

    var ResourceCache = function (context) {
        this.context = context;

        this.resources = [];
        
        this.resourceRegistered = new gli.EventSource("resourceRegistered");

        setCaptures(this, context);
    };

    ResourceCache.prototype.registerResource = function (resource) {
        this.resources.push(resource);
        this.resourceRegistered.fire(resource);
    };

    ResourceCache.prototype.captureVersions = function () {
        var allResources = [];
        for (var n = 0; n < this.resources.length; n++) {
            var resource = this.resources[n];
            allResources.push({
                resource: resource,
                value: resource.captureVersion()
            });
        }
        return allResources;
    };

    ResourceCache.prototype.getResources = function (name) {
        var selectedResources = [];
        for (var n = 0; n < this.resources.length; n++) {
            var resource = this.resources[n];
            var typename = glitypename(resource.target);
            if (typename == name) {
                selectedResources.push(resource);
            }
        }
        return selectedResources;
    };

    //(typename.indexOf("WebGLFramebuffer") >= 0) ||
    //(typename.indexOf("WebGLRenderbuffer") >= 0) ||
    //(typename.indexOf("WebGLShader") >= 0) ||

    ResourceCache.prototype.getTextures = function () {
        return this.getResources("WebGLTexture");
    };

    ResourceCache.prototype.getBuffers = function () {
        return this.getResources("WebGLBuffer");
    };

    ResourceCache.prototype.getPrograms = function () {
        return this.getResources("WebGLProgram");
    };

    host.ResourceCache = ResourceCache;
})();
