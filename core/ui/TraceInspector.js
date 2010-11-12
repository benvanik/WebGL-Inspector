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

        var canvas = this.canvas = document.createElement("canvas");
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
