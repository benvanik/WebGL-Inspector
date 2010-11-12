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
        });

        var canvas = this.canvas = document.createElement("canvas");
        canvas.className = "gli-reset";
        canvas.width = context.canvas.width;
        canvas.height = context.canvas.height;
        this.elements.view.appendChild(canvas);
        w.controller.setOutput(canvas);

        // TODO: track source canvas resize

        canvas.style.width = "100%";
        canvas.style.height = "100%";
        //canvas.height = context.canvas.height / context.canvas.width * 80;
    };

    TraceInspector.prototype.reset = function () {
    };

    ui.TraceInspector = TraceInspector;

})();
