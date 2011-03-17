(function () {
    var modes = glinamespace("gli.capture.modes");
    
    var StatisticsMode = function StatisticsMode(impl) {
        glisubclass(gli.capture.modes.Mode, this, [impl]);
    };
    
    // Begin a frame
    StatisticsMode.prototype.beginFrame = function beginFrame() {
    };
    
    // End a frame
    StatisticsMode.prototype.endFrame = function endFrame() {
    };
    
    modes.StatisticsMode = StatisticsMode;
    
})();
