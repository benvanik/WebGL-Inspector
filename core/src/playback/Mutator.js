(function () {
    var playback = glinamespace("gli.playback");

    var Mutator = function Mutator(name) {
        this.name = name;
        this.resourceHandlers = {};
        this.callHandlers = [];
    };

    Mutator.prototype.getMutatedResourceTypes = function getMutatedResourceTypes() {
        var types = [];
        for (var name in this.resourceHandlers) {
            types.push(name);
        }
        return types;
    };

    Mutator.prototype.addResourceHandler = function addResourceHandler(type, pre, post) {
        var typeHandlers = this.resourceHandlers[type];
        if (!typeHandlers) {
            typeHandlers = [];
            this.resourceHandlers[type] = typeHandlers;
        }
        typeHandlers.push({
            pre: pre,
            post: post
        });
    };

    Mutator.prototype.addCallHandler = function addCallHandler(pre, post) {
        this.callHandlers.push({
            pre: pre,
            post: post
        });
    };

    playback.Mutator = Mutator;

})();
