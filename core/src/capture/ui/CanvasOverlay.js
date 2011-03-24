(function () {
    var ui = glinamespace("gli.capture.ui");

    var CanvasOverlay = function CanvasOverlay(canvas, gl, notifier) {
        this.canvas = canvas;
        this.gl = gl;
        this.ext = gl.getExtension("GLI_debugger");
        this.notifier = notifier;
    };
    
    CanvasOverlay.prototype.requestCapture = function requestCapture(count) {
        var self = this;
        
        function captureCompleted(frame) {
            self.notifier.postMessage("captured frame " + frame.frameNumber);
        };
        
        for (var n = 0; n < count; n++) {
            this.ext.requestCapture(captureCompleted);
        }
    };
    
    ui.CanvasOverlay = CanvasOverlay;
    
})();
