(function () {
    var trace = glinamespace("gli.ui.tabs.trace");

    var TraceTab = function TraceTab(w, parentElement) {
        this.super.call(this, parentElement);

        this.currentFrame = null;

        var listingPane = this.listingPane = new gli.ui.tabs.trace.ListingPane(this, w.session);

        var previewPane = this.previewPane = new gli.ui.tabs.trace.PreviewPane(this, w.session);

        var splitPanel = this.splitPanel = new gli.ui.controls.SplitPanel("traceTab", this.el, listingPane, previewPane, "vertical");
        this.el.appendChild(splitPanel.el);
    };
    glisubclass(gli.ui.Tab, TraceTab);

    TraceTab.prototype.setFrame = function setFrame(frame) {
        if (this.currentFrame) {
            this.listingPane.setFrame(null);
            this.previewPane.setFrame(null);
            this.currentFrame = null;
        }

        this.currentFrame = frame;
        if (frame) {
            this.listingPane.setFrame(frame);
            this.previewPane.setFrame(frame);
        }
    };

    trace.TraceTab = TraceTab;

})();
