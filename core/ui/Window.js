(function () {
    var ui = glinamespace("gli.ui");
    
    var Window = function (context) {
        this.context = context;
        document.writeln("hi");
    };

    ui.Window = Window;
})();
