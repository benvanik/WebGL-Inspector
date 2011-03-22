(function () {
    var tools = glinamespace("gli.playback.tools");
    
    var StallChecker = function StallChecker() {
    };
    glisubclass(gli.playback.tools.Tool, StallChecker);
    
    tools.StallChecker = StallChecker;
    
})();
