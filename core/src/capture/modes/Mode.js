(function () {
    var modes = glinamespace("gli.capture.modes");
    
    var Mode = function Mode(impl) {
        this.impl = impl;
        this.context = impl.context;
        this.methods = {};
        for (var name in impl.methods) {
            this.methods[name] = impl.methods[name];
        }
        
        this.requests = [];
        this.currentRequest = null;
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
    
    Mode.prototype.queueRequest = function queueRequest(request) {
        this.requests.push(request);
    };
    
    Mode.prototype.preFrame = function preFrame() {
        if (this.currentRequest) {
            // In a request
            return true;
        } else if (this.requests.length) {
            // Shift off the next request
            this.currentRequest = this.requests.shift();
            return true;
        } else {
            // Do NOT capture
            return false;
        }
    };
    
    Mode.prototype.postFrame = function postFrame(frame) {
        var request = this.currentRequest;
        this.currentRequest = null;
        return request;
    };
    
    modes.Mode = Mode;
    
})();
