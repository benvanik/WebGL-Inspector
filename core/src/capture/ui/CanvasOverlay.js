(function () {
    var ui = glinamespace("gli.capture.ui");

    var CanvasOverlay = function CanvasOverlay(ordinal, canvas, gl, notifier) {
        this.ordinal = ordinal;
        this.canvas = canvas;
        this.gl = gl;
        this.ext = gl.getExtension("GLI_debugger");
        this.notifier = notifier;

        this.applyUI();
    };

    CanvasOverlay.prototype.applyUI = function applyUI() {
        var self = this;
        var canvas = this.canvas;
        var document = canvas.ownerDocument;

        var div = this.div = document.createElement("div");
        div.style.zIndex = 99999;
        div.style.position = "absolute";
        div.style.right = "5px";
        div.style.top = String(5 + (this.ordinal * 30)) + "px";
        div.style.padding = "5px";
        div.style.border = "1px solid red";

        div.style.backgroundColor = "rgba(0,0,0,0.8)";

        div.style.color = "red";
        div.style.fontSize = "8pt";
        div.style.fontFamily = "Monaco, 'Andale Mono', 'Monotype.com', monospace";
        div.style.fontWeight = "bold";

        div.style.cursor = "pointer";
        div.style.webkitUserSelect = "none";
        div.style.mozUserSelect = "none";

        div.title = "Capture frame(s) ([shift-]F12)";
        div.innerHTML = "Capture";

        document.body.appendChild(div);

        div.addEventListener("click", function (e) {
            var count = e.shiftKey ? 10 : 1;
            self.requestCapture(count);
        }, false);
    };

    CanvasOverlay.prototype.requestCapture = function requestCapture(count) {
        var self = this;

        function captureCompleted(frame) {
            self.notifier.postMessage("captured frame " + frame.frameNumber);
        };

        for (var n = 0; n < count; n++) {
            this.ext.requestCapture(captureCompleted);
        }
    };

    ui.CanvasOverlay = CanvasOverlay;

})();
