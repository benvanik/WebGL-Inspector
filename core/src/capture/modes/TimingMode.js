(function () {
    var modes = glinamespace("gli.capture.modes");
    
    var TimingMode = function TimingMode(impl) {
        glisubclass(gli.capture.modes.Mode, this, [impl]);
    };
    
    // Begin a frame
    TimingMode.prototype.beginFrame = function beginFrame() {
        console.log("begin frame");
    };
    
    // End a frame
    TimingMode.prototype.endFrame = function endFrame() {
        console.log("end frame");
    };
    
    modes.TimingMode = TimingMode;
    
})();
