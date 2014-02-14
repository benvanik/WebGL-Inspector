(function () {
    var ui = glinamespace("gli.ui");
    var divClass = ui.Tab.divClass;

    var StateTab = function (w) {
        var outer = divClass("window-whole-outer");
        var whole = divClass("window-whole");
        whole.appendChild(divClass("window-whole-inner", "scrolling contents"));
        outer.appendChild(whole);
        this.el.appendChild(outer);

        this.stateView = new gli.ui.StateView(w, this.el);

        this.stateView.setState();

        this.refresh = function () {
            this.stateView.setState();
        };
    };

    ui.StateTab = StateTab;
})();
