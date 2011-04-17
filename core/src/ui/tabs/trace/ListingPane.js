(function () {
    var trace = glinamespace("gli.ui.tabs.trace");

    var ListingPane = function ListingPane(tab, session, controller) {
        var self = this;
        var doc = tab.el.ownerDocument;

        this.session = session;
        this.controller = controller;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-trace-listingpane");

        var miniBar = this.miniBar = new gli.ui.controls.MiniBar(el);
        var leftBar = miniBar.addSegment("controls", "left");
        {
            leftBar.addButton("run", "Playback entire frame (F9)").clicked.addListener(this, function () {
                this.controller.run();
            });
            leftBar.addButton("step-forward", "Step forward one call (F8)").clicked.addListener(this, function () {
                this.controller.step(1);
            });
            leftBar.addButton("step-back", "Step backward one call (F6)").clicked.addListener(this, function () {
                this.controller.step(-1);
            });
            leftBar.addButton("step-until-draw", "Skip to the next draw call (F7)").clicked.addListener(this, function () {
                this.controller.runUntilDraw();
            });
            //leftBar.addButton("step-until-error", "Run until an error occurs").clicked.addListener(this, function () {
            //    this.controller.runUntilError();
            //});
            leftBar.addButton("restart", "Restart from the beginning of the frame (F10)").clicked.addListener(this, function () {
                this.controller.seek(null);
            });
        }
        var rightBar = miniBar.addSegment("editing", "right");
        {
        }

        controller.stateChanged.addListener(this, this.setState);
        controller.frameChanged.addListener(this, this.setFrame);
        controller.frameCleared.addListener(this, this.frameCleared);
        controller.frameStepped.addListener(this, this.frameStepped);
    };

    ListingPane.prototype.setState = function setState(state) {
        var enableControls = false;

        switch (state) {
            case "disabled":
                enableControls = false;
                break;
            case "loading":
                enableControls = false;
                break;
            case "ready":
                enableControls = true;
                break;
        }

        this.miniBar.enabled = enableControls;
    };

    ListingPane.prototype.setFrame = function setFrame(frame) {
    };

    ListingPane.prototype.frameCleared = function frameCleared(context) {
    };

    ListingPane.prototype.frameStepped = function frameStepped(context) {
    };

    trace.ListingPane = ListingPane;

})();
