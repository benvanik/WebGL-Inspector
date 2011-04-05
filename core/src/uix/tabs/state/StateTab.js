(function () {
    var ui = glinamespace("gli.ui");

    var StateTab = function (w) {
        this.el.innerHTML =
            '<div class="window-whole-outer">' +
            '    <div class="window-whole">' +
            '       <div class="window-whole-inner">' +
            '           <!-- scrolling contents -->' +
            '       </div>' +
            '    </div>' +
            '</div>';

        this.stateView = new gli.ui.StateView(w, this.el);

        this.stateView.setState();

        this.refresh = function () {
            this.stateView.setState();
        };
    };

    ui.StateTab = StateTab;
})();
