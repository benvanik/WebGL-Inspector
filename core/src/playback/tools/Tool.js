(function () {
    var tools = glinamespace("gli.playback.tools");
    
    var Tool = function Tool() {
    };
    
    Tool.TARGET_RESOURCE = 0x0001;
    Tool.TARGET_CAPTURE_FRAME = 0x0002;
    Tool.TARGET_TIMING_FRAME = 0x0004;
    
    tools.Tool = Tool;
    
})();
