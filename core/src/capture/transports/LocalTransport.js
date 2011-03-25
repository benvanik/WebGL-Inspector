(function () {
    var transports = glinamespace("gli.capture.transports");
    
    var LocalTransport = function LocalTransport() {
        var options = {
            streaming: true
        };
        this.super.call(this, options);

        this.events = {
            appendSessionInfo: new gli.util.EventSource("appendSessionInfo"),
            appendResource: new gli.util.EventSource("appendResource"),
            appendResourceUpdate: new gli.util.EventSource("appendResourceUpdate"),
            appendResourceDeletion: new gli.util.EventSource("appendResourceDeletion"),
            appendResourceVersion: new gli.util.EventSource("appendResourceVersion"),
            appendCaptureFrame: new gli.util.EventSource("appendCaptureFrame"),
            appendTimingFrame: new gli.util.EventSource("appendTimingFrame")
        };
        
        // Until this is set to true cache all events
        this.isAttached = false;
        this.queue = [];
    };
    glisubclass(gli.capture.transports.Transport, LocalTransport);
    
    LocalTransport.prototype.attach = function attach() {
        this.isAttached = true;
        for (var n = 0; n < this.queue.length; n++) {
            var item = this.queue[n];
            item.apply(this);
        }
        this.queue.length = 0;
    };
    
    LocalTransport.prototype.isClosed = function isClosed() {
        return false;
    };

    LocalTransport.prototype.appendSessionInfo = function appendSessionInfo(sessionInfo) {
        if (this.isAttached) {
            this.events.appendSessionInfo.fire(sessionInfo);
        } else {
            this.queue.push(function () {
                this.events.appendSessionInfo.fire(sessionInfo);
            });
        }
    };
    
    LocalTransport.prototype.appendResource = function appendResource(resource) {
        resource.prepareForTransport(false);
        if (this.isAttached) {
            this.events.appendResource.fire(resource);
        } else {
            this.queue.push(function () {
                this.events.appendResource.fire(resource);
            });
        }
    };

    LocalTransport.prototype.appendResourceUpdate = function appendResourceUpdate(resource) {
        resource.prepareForTransport(false);
        if (this.isAttached) {
            this.events.appendResourceUpdate.fire(resource);
        } else {
            this.queue.push(function () {
                this.events.appendResourceUpdate.fire(resource);
            });
        }
    };
    
    LocalTransport.prototype.appendResourceDeletion = function appendResourceDeletion(resourceId) {
        if (this.isAttached) {
            this.events.appendResourceDeletion.fire(resourceId);
        } else {
            this.queue.push(function () {
                this.events.appendResourceDeletion.fire(resourceId);
            });
        }
    };
    
    LocalTransport.prototype.appendResourceVersion = function appendResourceVersion(resourceId, version) {
        version.prepareForTransport(false);
        if (this.isAttached) {
            this.events.appendResourceVersion.fire(resourceId, version);
        } else {
            this.queue.push(function () {
                this.events.appendResourceVersion.fire(resourceId, version);
            });
        }
    };
    
    LocalTransport.prototype.appendCaptureFrame = function appendCaptureFrame(request, frame) {
        frame.prepareForTransport(false);
        if (this.isAttached) {
            this.events.appendCaptureFrame.fire(request, frame);
        } else {
            this.queue.push(function () {
                this.events.appendCaptureFrame.fire(request, frame);
            });
        }
    };
    
    LocalTransport.prototype.appendTimingFrame = function appendTimingFrame(request, frame) {
        frame.prepareForTransport(false);
        if (this.isAttached) {
            this.events.appendTimingFrame.fire(request, frame);
        } else {
            this.queue.push(function () {
                this.events.appendTimingFrame.fire(request, frame);
            });
        }
    };
    
    transports.LocalTransport = LocalTransport;
    
})();
