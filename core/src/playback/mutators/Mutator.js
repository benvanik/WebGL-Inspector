(function () {
    var mutators = glinamespace("gli.playback.mutators");

    var Mutator = function Mutator(name) {
        this.name = name;
        
        // Type : {
        //    pre: [call, call, ...]
        //    post: [call, call, ...]
        // }
        this.resourceHandlers = {};
        // name : {
        //    pre: [call, call, ...]
        //    post: [call, call, ...]
        // }
        this.callHandlers = {};
        
        this.locked = false;
    };
    
    Mutator.createMutationTable = function createMutationTable(mutators) {
        var table = {
            resources: {
                // type : { pre: [binding, binding, ...], post: [binding, binding, ...] }
            },
            calls: {
                // name : { pre: [binding, binding, ...], post: [binding, binding, ...] }
            }
        };
        
        for (var n = 0; n < mutators.length; n++) {
            var mutator = mutators[n];
            mutator.locked = true;
            
            for (var name in mutator.resourceHandlers) {
                var allHandlers = table.resources[name];
                if (!allHandlers) {
                    allHandlers = {
                        pre: [],
                        post: []
                    };
                    table.resources[name] = allHandlers;
                }
                var handlers = mutator.resourceHandlers[name];
                for (var m = 0; m < handlers.pre.length; m++) {
                    allHandlers.pre.push({
                        mutator: mutator,
                        handler: handlers.pre[m]
                    });
                }
                for (var m = 0; m < handlers.post.length; m++) {
                    allHandlers.post.push({
                        mutator: mutator,
                        handler: handlers.post[m]
                    });
                }
            }
            
            for (var name in mutator.callHandlers) {
                var allHandlers = table.calls[name];
                if (!allHandlers) {
                    allHandlers = {
                        pre: [],
                        post: []
                    };
                    table.calls[name] = allHandlers;
                }
                var handlers = mutator.callHandlers[name];
                for (var m = 0; m < handlers.pre.length; m++) {
                    allHandlers.pre.push({
                        mutator: mutator,
                        handler: handlers.pre[m]
                    });
                }
                for (var m = 0; m < handlers.post.length; m++) {
                    allHandlers.post.push({
                        mutator: mutator,
                        handler: handlers.post[m]
                    });
                }
            }
        }
        
        return table;
    };

    // pre(pool, version) -> version clone
    // post(pool, version, result)
    Mutator.prototype.addResourceHandler = function addResourceHandler(type, pre, post) {
        if (this.locked) {
            console.log("ignore mutator manipulation - already cached");
            return;
        }
        var typeHandlers = this.resourceHandlers[type];
        if (!typeHandlers) {
            typeHandlers = {
                pre: [],
                post: []
            };
            this.resourceHandlers[type] = typeHandlers;
        }
        if (pre) {
            typeHandlers.pre.push(pre);
        }
        if (post) {
            typeHandlers.post.push(post);
        }
    };

    // pre(pool, call) -> call clone
    // post(pool, call)
    Mutator.prototype.addCallHandler = function addCallHandler(name, pre, post) {
        if (this.locked) {
            console.log("ignore mutator manipulation - already cached");
            return;
        }
        var callHandlers = this.callHandlers[name];
        if (!callHandlers) {
            callHandlers = {
                pre: [],
                post: []
            };
            this.callHandlers[name] = callHandlers;
        }
        if (pre) {
            callHandlers.pre.push(pre);
        }
        if (post) {
            callHandlers.post.push(post);
        }
    };
    
    Mutator.prototype.addCallHandlers = function addCallHandlers(callHandlers) {
        if (this.locked) {
            console.log("ignore mutator manipulation - already cached");
            return;
        }
        for (var name in callHandlers) {
            var handlers = callHandlers[name];
            this.addCallHandler(name, handlers.pre, handlers.post);
        }
    };
    
    mutators.Mutator = Mutator;

})();
