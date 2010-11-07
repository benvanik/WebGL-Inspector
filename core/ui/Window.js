(function () {
    var ui = glinamespace("gli.ui");
    
    var Window = function (context) {
        this.context = context;
        document.writeln("hi");
    };
    
    Window.prototype.appendFrame = function(frame) {
        alert("append frame");
    };

    ui.Window = Window;
})();
