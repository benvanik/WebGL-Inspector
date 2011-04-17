(function () {
    var ui = glinamespace("gli.ui");

    var ContextController = function ContextController(w, session) {
        var self = this;
        var doc = w.doc;

        this.session = session;
        this.frame = null;

        this.stateChanged = new gli.util.EventSource("stateChanged");
        this.frameChanged = new gli.util.EventSource("frameChanged");
        this.frameCleared = new gli.util.EventSource("frameCleared");
        this.frameStepped = new gli.util.EventSource("frameStepped");

        this.contexts = [];

        var colorContext = this.colorContext = new gli.playback.PlaybackContext(session, {
            ignoreCrossDomainContent: false
        }, [
        // mutators
        ]);
        colorContext.name = "color";
        colorContext.enabled = true;
        colorContext.showInteractive = true;
        this.contexts["color"] = colorContext;
        this.contexts.push(colorContext);

        var depthContext = this.depthContext = new gli.playback.PlaybackContext(session, {
            ignoreCrossDomainContent: true
        }, [
            new gli.playback.mutators.DepthOutputMutator()
        ]);
        depthContext.name = "depth";
        depthContext.enabled = true;
        depthContext.showInteractive = false;
        this.contexts["depth"] = depthContext;
        this.contexts.push(depthContext);

        var stencilContext = this.stencilContext = new gli.playback.PlaybackContext(session, {
            ignoreCrossDomainContent: true
        }, [
        //new gli.playback.mutators.StencilOutputMutator()
        ]);
        stencilContext.name = "stencil";
        stencilContext.enabled = false;
        stencilContext.showInteractive = false;
        this.contexts["stencil"] = stencilContext;
        this.contexts.push(stencilContext);

        this.readyCount = 0;
        function contextReady(context) {
            this.readyCount--;
            if (this.readyCount == 0) {
                this.stateChanged.fire("ready");
                this.frameChanged.fire(context.frame);
                gli.ui.endInteractive();
                this.run();
            }
        };

        function preFrame(context, frame) {
            this.frameCleared.fire(context);
        };

        function stepped(context) {
            this.frameStepped.fire(context);
        };

        for (var n = 0; n < this.contexts.length; n++) {
            var context = this.contexts[n];
            context.ready.addListener(this, contextReady);
            context.preFrame.addListener(this, preFrame);
            context.stepped.addListener(this, stepped);
        }

        this.pendingCallIndex = null;
        gli.ui.interactiveModeEnded.addListener(this, function () {
            if (this.pendingCallIndex) {
                for (var n = 0; n < this.contexts.length; n++) {
                    var context = this.contexts[n];
                    context.seek(this.pendingCallIndex);
                }
                this.pendingCallIndex = null;
            }
        });

        this.stateChanged.fireDeferred("disabled");
    };

    ContextController.prototype.setFrame = function setFrame(frame) {
        if (!frame) {
            for (var n = 0; n < this.contexts.length; n++) {
                var context = this.contexts[n];
                context.setFrame(null);
            }
            this.stateChanged.fire("disabled");
            this.frameChanged.fire(null);
            return;
        }

        this.frame = frame;
        this.readyCount = this.contexts.length;

        gli.ui.beginInteractive();

        this.stateChanged.fire("loading");
        this.frameChanged.fire(null);

        for (var n = 0; n < this.contexts.length; n++) {
            var context = this.contexts[n];
            context.setFrame(frame);
        }
    };

    ContextController.prototype.seek = function seek(callIndex) {
        for (var n = 0; n < this.contexts.length; n++) {
            var context = this.contexts[n];
            if (!context.enabled) {
                continue;
            }

            if (gli.ui.isInteractive() && !context.showInteractive) {
                this.pendingCallIndex = callIndex;
                continue;
            }

            context.seek(callIndex);
        }
    };

    ContextController.prototype.step = function step(direction) {
        for (var n = 0; n < this.contexts.length; n++) {
            var context = this.contexts[n];
            if (!context.enabled) {
                continue;
            }

            if (gli.ui.isInteractive() && !context.showInteractive) {
                // TODO: compute
                //    this.pendingCallIndex = null;
                //    continue;
            }

            context.step(direction);
        }
    };

    ContextController.prototype.run = function run(untilCallIndex) {
        for (var n = 0; n < this.contexts.length; n++) {
            var context = this.contexts[n];
            if (!context.enabled) {
                continue;
            }

            if (gli.ui.isInteractive() && !context.showInteractive) {
                // TODO: compute
                //    this.pendingCallIndex = null;
                //    continue;
            }

            context.run(untilCallIndex);
        }
    };

    ContextController.prototype.runUntilDraw = function runUntilDraw() {
        for (var n = 0; n < this.contexts.length; n++) {
            var context = this.contexts[n];
            if (!context.enabled) {
                continue;
            }

            if (gli.ui.isInteractive() && !context.showInteractive) {
                // TODO: compute
                //    this.pendingCallIndex = null;
                //    continue;
            }

            context.runUntilDraw();
        }
    };

    ui.ContextController = ContextController;

})();
