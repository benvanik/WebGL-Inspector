(function () {
    var ui = glinamespace("gli.ui");

    var PerformanceView = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-whole-inner")[0]
        };
    };

    ui.PerformanceView = PerformanceView;
})();
