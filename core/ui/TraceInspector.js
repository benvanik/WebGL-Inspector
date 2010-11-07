(function () {
    var ui = glinamespace("gli.ui");

    var TraceInspector = function (view, w) {
        var self = this;
        this.view = view;
        this.window = w;
        this.elements = {
            view: w.root.getElementsByClassName("window-trace-inspector")[0]
        };
    };

    TraceInspector.prototype.reset = function () {
    };

    ui.TraceInspector = TraceInspector;

})();
