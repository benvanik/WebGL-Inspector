(function () {

    var TraceMinibar = function (view, w) {
        var self = this;
        this.view = view;
        this.window = w;
        this.elements = {
            bar: w.root.getElementsByClassName("trace-minibar")[0]
        };
        this.buttons = {};

        // Pull out the canvas from the OutputHUD and set up the replay controller
        var canvas = w.outputHUD.canvas;
        var replaygl = null;
        try {
            replaygl = canvas.getContext("experimental-webgl");
        } catch (e) {
        }
        this.replay = new gli.Replay(w.context, replaygl);

        this.replay.onStep = function (replay, frame, callIndex) {
            self.view.traceListing.setActiveCall(callIndex);
        };

        function addButton(bar, name, callback) {
            var el = document.createElement("div");
            el.className = "trace-minibar-button trace-minibar-button-disabled";

            // TODO: style
            el.innerHTML = name;

            el.onclick = function () {
                callback.apply(self);
            };

            bar.appendChild(el);

            self.buttons[name] = el;
        };

        function refreshState() {
            var newState = new gli.StateCapture(replaygl);
            self.window.stateHUD.showState(newState);
        };

        addButton(this.elements.bar, "run", function () {
            this.replay.stepUntilEnd();
            refreshState();
        });
        addButton(this.elements.bar, "step-forward", function () {
            if (this.replay.step() == false) {
                this.replay.reset();
                this.replay.beginFrame(this.view.frame);
                refreshState();
            }
        });
        addButton(this.elements.bar, "step-back", function () {
            this.replay.stepBack();
            refreshState();
        });
        addButton(this.elements.bar, "step-until-error", function () {
            alert("step-until-error");
            this.replay.stepUntilError();
            refreshState();
        });
        addButton(this.elements.bar, "step-until-draw", function () {
            alert("step-until-draw");
            this.replay.stepUntilDraw();
            refreshState();
        });
        addButton(this.elements.bar, "restart", function () {
            this.replay.beginFrame(this.view.frame);
            refreshState();
        });

        this.update();
    };
    TraceMinibar.prototype.stepUntil = function (callIndex) {
        if (this.replay.callIndex > callIndex) {
            this.replay.reset();
            this.replay.beginFrame(this.view.frame);
            this.replay.stepUntil(callIndex);
        } else {
            this.replay.stepUntil(callIndex);
        }
    };
    TraceMinibar.prototype.update = function () {
        var self = this;

        if (this.view.frame) {
            this.replay.reset();
            this.replay.runFrame(this.view.frame);
        } else {
            this.replay.reset();
            // TODO: clear canvas
            console.log("would clear canvas");
        }

        function toggleButton(name, enabled) {
            var el = self.buttons[name];
            if (enabled) {
                el.className = el.className.replace("trace-minibar-button-disabled", "trace-minibar-button-enabled");
            } else {
                el.className = el.className.replace("trace-minibar-button-enabled", "trace-minibar-button-disabled");
            }
        };

        for (var n in this.buttons) {
            toggleButton(n, false);
        }

        toggleButton("run", true);
        toggleButton("step-forward", true);
        toggleButton("step-back", true);
        toggleButton("step-until-error", true);
        toggleButton("step-until-draw", true);
        toggleButton("restart", true);
    };

    var TraceView = function (w) {
        var self = this;
        this.window = w;
        this.elements = {};

        this.minibar = new TraceMinibar(this, w);
        this.traceListing = new gli.ui.TraceListing(this, w);
        this.inspector = new gli.ui.TraceInspector(this, w);

        this.frame = null;
    };

    TraceView.prototype.reset = function () {
        this.minibar.update();
        this.traceListing.reset();
        this.inspector.reset();

        this.frame = null;
    };

    TraceView.prototype.setFrame = function (frame) {
        this.reset();
        this.frame = frame;

        this.traceListing.setFrame(frame);
        this.minibar.update();
    };

    gli.ui = gli.ui || {};
    gli.ui.TraceView = TraceView;

})();
