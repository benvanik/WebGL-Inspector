(function () {
    var modes = glinamespace("gli.capture.modes");
    
    var Mode = function Mode(impl) {
        this.impl = impl;
        this.context = impl.context;
        this.methods = impl.methods.slice();
    };
    
    // Attach to the current context
    Mode.prototype.attach = function attach() {
        for (var name in this.methods) {
            this.context[name] = this.methods[name];
        }
    };
    
    // Unattach from the current context
    Mode.prototype.unattach = function unattach() {
        for (var name in this.methods) {
            delete this.context[name];
        }
    };
    
    modes.Mode = Mode;
    
})();
