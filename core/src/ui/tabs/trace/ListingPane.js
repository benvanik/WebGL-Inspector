(function () {
    var trace = glinamespace("gli.ui.tabs.trace");

    var ListingPane = function ListingPane(tab, session) {
        var self = this;
        var doc = tab.el.ownerDocument;

        this.session = session;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-trace-listingpane");
    };

    trace.ListingPane = ListingPane;

})();
