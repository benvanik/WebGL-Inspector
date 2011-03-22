(function () {
    var tools = glinamespace("gli.playback.tools");
    
    var VertexFormatChecker = function VertexFormatChecker() {
        this.super.call(this);
    };
    glisubclass(gli.playback.tools.Tool, VertexFormatChecker);
    
    tools.VertexFormatChecker = VertexFormatChecker;
    
})();
