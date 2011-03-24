(function () {
    var capture = glinamespace("gli.capture");
    
    var CaptureHost = function CaptureHost() {
        this.notifier = new gli.capture.ui.Notifier();
        
        this.contexts = [];
        
        this.attachKeyboardHandlers();
    };
    
    CaptureHost.prototype.registerContext = function registerContext(gl) {
        var ordinal = this.contexts.length;
        this.contexts.push(gl);
        
        // Setup overlay
        gl.overlay = new gli.capture.ui.CanvasOverlay(ordinal, gl.canvas, gl, this.notifier);
    };
    
    CaptureHost.prototype.getMostActiveContext = function getMostActiveContext() {
        // TODO: last use time? most used? etc?
        var mostActive = null;
        for (var n = 0; n < this.contexts.length; n++) {
            var gl = this.contexts[n];
            if (!mostActive) {
                mostActive = gl;
            } else {
                if (gl.creationTime > mostActive.creationTime) {
                    mostActive = gl;
                }
            }
        }
        return mostActive;
    };
    
    CaptureHost.prototype.attachKeyboardHandlers = function attachKeyboardHandlers() {
        var self = this;
        document.addEventListener("keydown", function keydownHandler(e) {
            var handled = false;
            switch (e.keyCode) {
            case 122: // F10
                console.log("F10");
                handled = true;
                break;
            case 123: // F12
                var gl = self.getMostActiveContext();
                if (gl) {
                    var count = e.shiftKey ? 10 : 1;
                    gl.overlay.requestCapture(count);
                    handled = true;
                }
                break;
            };
            if (handled) {
                e.preventDefault();
                e.stopPropagation();
            }
            return handled;
        }, false);
    };
    
    capture.CaptureHost = CaptureHost;
    
})();
