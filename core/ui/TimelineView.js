(function () {
    var ui = glinamespace("gli.ui");

    var TimelineView = function (w, elementRoot) {
        var self = this;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-right-inner")[0]
        };
    };

    ui.TimelineView = TimelineView;
})();
