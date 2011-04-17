(function () {
    var trace = glinamespace("gli.ui.tabs.trace");

    var PreviewPane = function PreviewPane(tab, session, controller) {
        var self = this;
        var doc = tab.el.ownerDocument;

        this.session = session;
        this.controller = controller;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-trace-previewpane");

        var viewContainerEl = this.viewContainerEl = doc.createElement("div");
        gli.ui.addClass(viewContainerEl, "gli-trace-previewpane-container");
        el.appendChild(viewContainerEl);

        controller.stateChanged.addListener(this, this.setState);
        controller.frameChanged.addListener(this, this.setFrame);
        controller.frameCleared.addListener(this, this.frameCleared);
        controller.frameStepped.addListener(this, this.frameStepped);

        var surfaceViews = this.surfaceViews = [];
        var canvases = this.canvases = [];

        this.addView("color", "Color", false);
        this.addView("depth", "Depth", false);
        this.addView("stencil", "Stencil", false);

        gli.util.setTimeout(function () {
            self.layout();
        }, 0);
    };

    PreviewPane.prototype.addView = function addView(name, displayName, userView) {
        var surfaceView = new gli.ui.controls.SurfaceView(this.viewContainerEl, {
            name: displayName,
            dropdownList: [],
            transparent: false,
            canClose: userView
        });

        //

        this.surfaceViews[name] = surfaceView;
        this.surfaceViews.push(surfaceView);

        this.canvases[name] = surfaceView.canvas;
        this.canvases.push(surfaceView.canvas);
    };

    PreviewPane.prototype.layout = function layout() {
        console.log("layout");

        var size = this.el.clientHeight;
        if (!size) {
            return;
        }

        var totalWidth = 0;
        for (var n = 0; n < this.surfaceViews.length; n++) {
            var view = this.surfaceViews[n];

            view.el.style.width = size + "px";
            view.el.style.height = size + "px";
            view.setSize(size, size);

            totalWidth += size + 3;
        }

        this.viewContainerEl.style.width = totalWidth + "px";
    };

    PreviewPane.prototype.setState = function setState(state) {
        console.log("set state: " + state);

        for (var n = 0; n < this.surfaceViews.length; n++) {
            var view = this.surfaceViews[n];
            view.invalidate();
        }
    };

    PreviewPane.prototype.setFrame = function setFrame(frame) {
        console.log("set frame: " + frame);
        for (var n = 0; n < this.canvases.length; n++) {
            var canvas = this.canvases[n];

            if (frame) {
                canvas.width = frame.canvasInfo.width;
                canvas.height = frame.canvasInfo.height;

                // TODO: reshape?
            }

            var ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        for (var n = 0; n < this.surfaceViews.length; n++) {
            var view = this.surfaceViews[n];
            view.resetView();
        }
    };

    PreviewPane.prototype.frameCleared = function frameCleared(context) {
        console.log("frame cleared");
        var canvas = this.canvases[context.name];
        if (canvas) {
            var ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        var view = this.surfaceViews[context.name];
        if (view) {
            view.invalidate();
        }
    };

    PreviewPane.prototype.frameStepped = function frameStepped(context) {
        console.log("frame stepped");
        var canvas = this.canvases[context.name];
        if (canvas) {
            context.present(canvas);
        }
        var view = this.surfaceViews[context.name];
        if (view) {
            view.invalidate();
        }
    };

    trace.PreviewPane = PreviewPane;

})();
