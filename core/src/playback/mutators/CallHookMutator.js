(function () {
    var mutators = glinamespace("gli.playback.mutators");
    
    var CallHookMutator = function CallHookMutator(target, callback) {
        this.super.call(this, "CallHookMutator");
        
        this.addCallHandler(null, function callHook_wildcard(gl, pool, call) {
            callback.call(target, gl, pool, call);
            return call;
        });
    };
    glisubclass(gli.playback.mutators.Mutator, CallHookMutator);
    
    mutators.CallHookMutator = CallHookMutator;
    
})();
