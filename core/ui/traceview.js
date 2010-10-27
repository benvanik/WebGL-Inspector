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
        this.replaygl = replaygl;
        this.replay = new gli.Replay(w.context, replaygl);

        this.replay.onStep = function (replay, frame, callIndex) {
            self.lastCallIndex = callIndex;
        };

        function addButton(bar, name, tip, callback) {
            var el = document.createElement("div");
            el.className = "trace-minibar-button trace-minibar-button-disabled trace-minibar-command-" + name;

            el.title = tip;
            el.innerHTML = " ";

            el.onclick = function () {
                callback.apply(self);
            };

            bar.appendChild(el);

            self.buttons[name] = el;
        };

        addButton(this.elements.bar, "run", "Playback entire frame", function () {
            this.replay.stepUntilEnd();
            this.refreshState();
        });
        addButton(this.elements.bar, "step-forward", "Step forward one call", function () {
            if (this.replay.stepForward() == false) {
                this.replay.reset();
                this.replay.beginFrame(this.view.frame);
            }
            this.refreshState();
        });
        addButton(this.elements.bar, "step-back", "Step backward one call", function () {
            this.replay.stepBack();
            this.refreshState();
        });
        addButton(this.elements.bar, "step-until-error", "Run until an error occurs", function () {
            alert("step-until-error");
            this.replay.stepUntilError();
            this.refreshState();
        });
        addButton(this.elements.bar, "step-until-draw", "Run until the next draw call", function () {
            alert("step-until-draw");
            this.replay.stepUntilDraw();
            this.refreshState();
        });
        addButton(this.elements.bar, "restart", "Restart from the beginning of the frame", function () {
            this.replay.beginFrame(this.view.frame);
            this.refreshState();
        });

        this.update();
    };
    TraceMinibar.prototype.refreshState = function () {
        var newState = new gli.StateCapture(this.replaygl);
        this.view.traceListing.setActiveCall(this.lastCallIndex);
        this.window.stateHUD.showState(newState);
        this.window.outputHUD.refresh();
    };
    TraceMinibar.prototype.stepUntil = function (callIndex) {
        if (this.replay.callIndex > callIndex) {
            this.replay.reset();
            this.replay.beginFrame(this.view.frame);
            this.replay.stepUntil(callIndex);
        } else {
            this.replay.stepUntil(callIndex);
        }
        this.refreshState();
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

        this.window.outputHUD.refresh();
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
        this.traceListing.scrollToCall(0);
    };

    gli = gli || {};
    gli.ui = gli.ui || {};
    gli.ui.TraceView = TraceView;

})();
