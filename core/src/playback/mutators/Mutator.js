(function () {
    var mutators = glinamespace("gli.playback.mutators");

    var Mutator = function Mutator(name) {
        this.name = name;
        this.resourceHandlers = {};
        this.callHandlers = [];
    };

    // pre(pool, version) -> version clone
    // post(pool, version, result)
    // call(pool, call) -> call clone
    Mutator.prototype.addResourceHandler = function addResourceHandler(type, pre, post, call) {
        var typeHandlers = this.resourceHandlers[type];
        if (!typeHandlers) {
            typeHandlers = [];
            this.resourceHandlers[type] = typeHandlers;
        }
        typeHandlers.push({
            pre: pre,
            post: post,
            call: call
        });
    };

    // pre(pool, call) -> call clone
    // post(pool, call)
    Mutator.prototype.addCallHandler = function addCallHandler(pre, post) {
        this.callHandlers.push({
            pre: pre,
            post: post
        });
    };
    
    Mutator.createShaderOverride = function createShaderOverride(shaderType, shaderSource) {
        function shaderOverride_call(pool, call) {
            if (call.name == "shaderSource") {
                if (call.args[0].shaderType === pool.gl[shaderType]) {
                    var clone = call.clone();
                    clone.args[1] = shaderSource;
                    return clone;
                }
            }
            return call;
        };
        
        var mutator = new Mutator("shaderOverride");
        mutator.addResourceHandler("Shader", null, null, shaderOverride_call);
        mutator.addCallHandler(shaderOverride_call, null);
        return mutator
    };

    mutators.Mutator = Mutator;

})();
