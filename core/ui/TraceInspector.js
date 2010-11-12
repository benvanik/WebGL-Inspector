(function () {
    var ui = glinamespace("gli.ui");



    var TraceInspector = function (view, w, elementRoot) {
        var self = this;
        var context = w.context;
        this.view = view;
        this.window = w;
        this.elements = {
            view: elementRoot.getElementsByClassName("window-trace-inspector")[0]
        };

        this.elements.view.style.width = "240px";

        this.splitter = new gli.controls.SplitterBar(this.elements.view, "vertical", 50, 800, "splitter-inspector", function (newWidth) {
            view.setInspectorWidth(newWidth);
            self.layout();
        });

        var canvas = this.canvas = document.createElement("canvas");
        canvas.className = "gli-reset trace-inspector-canvas";
        canvas.width = context.canvas.width;
        canvas.height = context.canvas.height;
        this.elements.view.appendChild(canvas);
        w.controller.setOutput(canvas);

        // TODO: track source canvas resize

        setTimeout(function () {
            // TODO: auto resize on startup to canvas size
            var parentHeight = self.elements.view.clientHeight;

            var newWidth = (canvas.width / canvas.height) * parentHeight;
            newWidth = Math.max(50, newWidth);
            newWidth = Math.min(window.innerWidth - 800, newWidth);
            view.setInspectorWidth(newWidth);

            self.layout();
        }, 0);
    };

    TraceInspector.prototype.layout = function () {
        var context = this.window.context;

        var parentWidth = this.elements.view.clientWidth;
        var parentHeight = this.elements.view.clientHeight;
        var parentar = parentHeight / parentWidth;
        var ar = context.canvas.height / context.canvas.width;

        var width;
        var height;
        if (ar * parentWidth < parentHeight) {
            width = parentWidth;
            height = (ar * parentWidth);
        } else {
            height = parentHeight;
            width = (parentHeight / ar);
        }
        this.canvas.style.width = width + "px";
        this.canvas.style.height = height + "px";

        this.canvas.style.left = ((parentWidth / 2) - (width / 2)) + "px";
        this.canvas.style.top = ((parentHeight / 2) - (height / 2)) + "px";
    };

    TraceInspector.prototype.reset = function () {
    };

    ui.TraceInspector = TraceInspector;

})();
