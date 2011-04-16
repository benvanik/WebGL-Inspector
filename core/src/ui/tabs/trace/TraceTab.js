(function () {
    var trace = glinamespace("gli.ui.tabs.trace");

    var TraceTab = function TraceTab(w, parentElement) {
        this.super.call(this, parentElement);
    };
    glisubclass(gli.ui.Tab, TraceTab);

    trace.TraceTab = TraceTab;

})();
