(function () {
    var playback = glinamespace("gli.playback");

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

    playback.Mutator = Mutator;

})();
