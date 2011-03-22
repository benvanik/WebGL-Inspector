(function () {
    var tools = glinamespace("gli.playback.tools");
    
    var BufferChecker = function BufferChecker() {
        this.super.call(this);
    };
    glisubclass(gli.playback.tools.Tool, BufferChecker);
    
    tools.BufferChecker = BufferChecker;
    
})();
