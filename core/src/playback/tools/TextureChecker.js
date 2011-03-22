(function () {
    var tools = glinamespace("gli.playback.tools");
    
    var TextureChecker = function TextureChecker() {
        this.super.call(this);
    };
    glisubclass(gli.playback.tools.Tool, TextureChecker);
    
    tools.TextureChecker = TextureChecker;
    
})();
