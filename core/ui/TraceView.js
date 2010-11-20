(function () {
    var ui = glinamespace("gli.ui");

    var TraceMinibar = function (view, w, elementRoot) {
        var self = this;
        this.view = view;
        this.window = w;
        this.elements = {
            bar: elementRoot.getElementsByClassName("trace-minibar")[0]
        };
        this.buttons = {};

        this.controller = w.controller;

        this.controller.stepCompleted.addListener(this, function () {
            if (w.controller.callIndex == 0) {
                self.lastCallIndex = null;
            } else {
                self.lastCallIndex = w.controller.callIndex - 1;
            }
        });

        var buttonHandlers = {};

        function addButton(bar, name, tip, callback) {
            var el = w.document.createElement("div");
            el.className = "trace-minibar-button trace-minibar-button-disabled trace-minibar-command-" + name;

            el.title = tip;
            el.innerHTML = " ";

            el.onclick = function () {
                callback.apply(self);
            };
            buttonHandlers[name] = callback;

            bar.appendChild(el);

            self.buttons[name] = el;
        };

        addButton(this.elements.bar, "run", "Playback entire frame (F9)", function () {
            this.controller.stepUntilEnd();
            this.refreshState();
        });
        addButton(this.elements.bar, "step-forward", "Step forward one call (F8)", function () {
            if (this.controller.stepForward() == false) {
                this.controller.reset();
                this.controller.openFrame(this.view.frame);
            }
            this.refreshState();
        });
        addButton(this.elements.bar, "step-back", "Step backward one call (F6)", function () {
            this.controller.stepBackward();
            this.refreshState();
        });
        addButton(this.elements.bar, "step-until-draw", "Run until the next draw call (F7)", function () {
            this.controller.stepUntilDraw();
            this.refreshState();
        });
        /*
        addButton(this.elements.bar, "step-until-error", "Run until an error occurs", function () {
        alert("step-until-error");
        this.controller.stepUntilError();
        this.refreshState();
        });
        */
        addButton(this.elements.bar, "restart", "Restart from the beginning of the frame (F10)", function () {
            this.controller.openFrame(this.view.frame);
            this.refreshState();
        });

        w.document.addEventListener("keydown", function (event) {
            var handled = false;
            switch (event.keyCode) {
                case 117: // F6
                    buttonHandlers["step-back"].apply(self);
                    handled = true;
                    break;
                case 118: // F7
                    buttonHandlers["step-until-draw"].apply(self);
                    handled = true;
                    break;
                case 119: // F8
                    buttonHandlers["step-forward"].apply(self);
                    handled = true;
                    break;
                case 120: // F9
                    buttonHandlers["run"].apply(self);
                    handled = true;
                    break;
                case 121: // F10
                    buttonHandlers["restart"].apply(self);
                    handled = true;
                    break;
            };

            if (handled) {
                event.preventDefault();
                event.stopPropagation();
            }
        }, false);

        //this.update();
    };
    TraceMinibar.prototype.refreshState = function (ignoreScroll) {
        //var newState = new gli.StateCapture(this.replaygl);
        this.view.traceListing.setActiveCall(this.lastCallIndex, ignoreScroll);
        //this.window.stateHUD.showState(newState);
        //this.window.outputHUD.refresh();
    };
    TraceMinibar.prototype.stepUntil = function (callIndex) {
        if (this.controller.callIndex > callIndex) {
            this.controller.reset();
            this.controller.openFrame(this.view.frame);
            this.controller.stepUntil(callIndex);
        } else {
            this.controller.stepUntil(callIndex);
        }
        this.refreshState();
    };
    TraceMinibar.prototype.reset = function () {
        this.update();
    };
    TraceMinibar.prototype.update = function () {
        var self = this;

        if (this.view.frame) {
            this.controller.reset();
            this.controller.runFrame(this.view.frame);
        } else {
            this.controller.reset();
            // TODO: clear canvas
            console.log("would clear canvas");
        }

        function toggleButton(name, enabled) {
            var el = self.buttons[name];
            if (el) {
                if (enabled) {
                    el.className = el.className.replace("trace-minibar-button-disabled", "trace-minibar-button-enabled");
                } else {
                    el.className = el.className.replace("trace-minibar-button-enabled", "trace-minibar-button-disabled");
                }
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

        //this.window.outputHUD.refresh();
    };

    var TraceView = function (w, elementRoot) {
        var self = this;
        var context = w.context;
        this.window = w;
        this.elements = {};

        this.minibar = new TraceMinibar(this, w, elementRoot);
        this.traceListing = new gli.ui.TraceListing(this, w, elementRoot);

        this.inspector = new gli.ui.SurfaceInspector(this, w, elementRoot, {
            title: 'Replay Preview',
            selectionName: 'Buffer',
            selectionValues: null /* set later */
        });
        this.inspector.querySize = function () {
            return [context.canvas.width, context.canvas.height];
        };
        this.inspector.reset = function () {
            this.layout();
        };
        this.inspector.canvas.style.display = "";

        w.controller.setOutput(this.inspector.canvas);

        // TODO: watch for parent canvas size changes and update
        this.inspector.canvas.width = context.canvas.width;
        this.inspector.canvas.height = context.canvas.height;

        this.frame = null;
    };

    TraceView.prototype.setInspectorWidth = function (newWidth) {
        var document = this.window.document;

        //.window-trace-outer margin-left: -480px !important; /* -2 * window-inspector.width */
        //.window-trace margin-left: 240px !important;
        //.trace-minibar right: 240px; /* window-trace-inspector */
        //.trace-listing right: 240px; /* window-trace-inspector */
        document.getElementsByClassName("window-trace-outer")[0].style.marginLeft = (-2 * newWidth) + "px !important";
        document.getElementsByClassName("window-trace")[0].style.marginLeft = newWidth + "px !important";
        document.getElementsByClassName("window-trace-inspector")[0].style.width = newWidth + "px";
        document.getElementsByClassName("trace-minibar")[0].style.right = newWidth + "px !important";
        document.getElementsByClassName("trace-listing")[0].style.right = newWidth + "px !important";
    };

    TraceView.prototype.layout = function () {
        this.inspector.layout();
    };

    TraceView.prototype.reset = function () {
        this.frame = null;

        this.minibar.reset();
        this.traceListing.reset();
        this.inspector.reset();
    };

    TraceView.prototype.setFrame = function (frame) {
        this.reset();
        this.frame = frame;

        this.traceListing.setFrame(frame);
        this.minibar.update();
        this.traceListing.scrollToCall(0);
    };
    
    TraceView.prototype.stepUntil = function(callIndex) {
        this.minibar.stepUntil(callIndex);
    };

    TraceView.prototype.getScrollState = function () {
        return {
            listing: this.traceListing.getScrollState()
        };
    };

    TraceView.prototype.setScrollState = function (state) {
        if (!state) {
            return;
        }
        this.traceListing.setScrollState(state.listing);
    };

    ui.TraceView = TraceView;
})();
