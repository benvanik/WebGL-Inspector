(function () {
    var modes = glinamespace("gli.capture.modes");
    
    var CaptureMode = function CaptureMode(impl) {
        glisubclass(gli.modes.Mode, this, [impl]);
    };
    
    // Begin a frame
    CaptureMode.prototype.beginFrame = function beginFrame() {
    };
    
    // End a frame
    CaptureMode.prototype.endFrame = function endFrame() {
    };
    
    modes.CaptureMode = CaptureMode;
    
})();
