(function () {
    var trace = glinamespace("gli.ui.tabs.trace");

    var TraceTab = function TraceTab(w, parentElement) {
        this.super.call(this, parentElement);

        var listingPane = this.listingPane = new gli.ui.tabs.trace.ListingPane(this, w.session, w.controller);

        var previewPane = this.previewPane = new gli.ui.tabs.trace.PreviewPane(this, w.session, w.controller);

        var splitPanel = this.splitPanel = new gli.ui.controls.SplitPanel("traceTab", this.el, previewPane, listingPane, "vertical", 100);
        this.el.appendChild(splitPanel.el);
    };
    glisubclass(gli.ui.Tab, TraceTab);

    TraceTab.prototype.layout = function layout() {
        this.splitPanel.layout();
    };

    trace.TraceTab = TraceTab;

})();
