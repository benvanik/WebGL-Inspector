(function () {
    var tools = glinamespace("gli.playback.tools");
    
    var StallChecker = function StallChecker() {
        this.super.call(this);
    };
    glisubclass(gli.playback.tools.Tool, StallChecker);
    
    tools.StallChecker = StallChecker;
    
})();
