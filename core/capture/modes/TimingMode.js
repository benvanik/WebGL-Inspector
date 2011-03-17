(function () {
    var modes = glinamespace("gli.capture.modes");
    
    var TimingMode = function TimingMode(impl) {
        glisubclass(gli.capture.modes.Mode, this, [impl]);
    };
    
    // Begin a frame
    TimingMode.prototype.beginFrame = function beginFrame() {
    };
    
    // End a frame
    TimingMode.prototype.endFrame = function endFrame() {
    };
    
    modes.TimingMode = TimingMode;
    
})();
