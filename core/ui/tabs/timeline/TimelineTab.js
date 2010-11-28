(function () {
    var ui = glinamespace("gli.ui");

    var TimelineTab = function (w) {
        this.el.innerHTML =
            '<div class="window-right-outer">' +
            '    <div class="window-right">' +
            '        <canvas class="gli-reset timeline-canvas"></canvas>' +
            '    </div>' +
            '    <div class="window-left">' +
            '    </div>' +
            '</div>';

        this.timelineView = new gli.ui.TimelineView(w, this.el);

        this.lostFocus.addListener(this, function () {
            this.timelineView.suspendUpdating();
        });
        this.gainedFocus.addListener(this, function () {
            this.timelineView.resumeUpdating();
        });
    };

    ui.TimelineTab = TimelineTab;
})();
