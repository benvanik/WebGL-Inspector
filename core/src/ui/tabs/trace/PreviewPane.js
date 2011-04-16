(function () {
    var trace = glinamespace("gli.ui.tabs.trace");

    var PreviewPane = function PreviewPane(tab, session) {
        var self = this;
        var doc = tab.el.ownerDocument;

        this.session = session;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-trace-previewpane");
    };

    trace.PreviewPane = PreviewPane;

})();
