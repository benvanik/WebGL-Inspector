(function () {
    var trace = glinamespace("gli.ui.tabs.trace");

    var PreviewPane = function PreviewPane(tab, session, controller) {
        var self = this;
        var doc = tab.el.ownerDocument;

        this.session = session;
        this.controller = controller;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-trace-previewpane");

        controller.stateChanged.addListener(this, this.setState);
        controller.frameChanged.addListener(this, this.setFrame);
        controller.frameCleared.addListener(this, this.frameCleared);
        controller.frameStepped.addListener(this, this.frameStepped);

        var canvases = this.canvases = [];

        function createCanvas(name) {
            var canvas = canvases[name] = doc.createElement("canvas");
            canvases.push(canvas);
            gli.ui.addClass(canvas, "gli-trace-preview-canvas");
            canvas.width = 100;
            canvas.height = 100;
            el.appendChild(canvas);
        };
        createCanvas("color");
        createCanvas("depth");
        createCanvas("stencil");
    };

    PreviewPane.prototype.layout = function layout() {
        // TODO: canvases?
    };

    PreviewPane.prototype.setState = function setState(state) {
        console.log("set state: " + state);
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
    };

    PreviewPane.prototype.frameCleared = function frameCleared(context) {
        console.log("frame cleared");
        var canvas = this.canvases[context.name];
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    PreviewPane.prototype.frameStepped = function frameStepped(context) {
        console.log("frame stepped");
        var canvas = this.canvases[context.name];
        context.present(canvas);
    };

    trace.PreviewPane = PreviewPane;

})();
