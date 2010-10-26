(function () {

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

    gli = gli || {};
    gli.ui = gli.ui || {};
    gli.ui.TraceInspector = TraceInspector;

})();
