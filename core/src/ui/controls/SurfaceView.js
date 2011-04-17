(function () {
    var controls = glinamespace("gli.ui.controls");

    // options : {
    //     name: "Target",
    //     dropdownList: ["A", "B", ...],
    //     transparent: true/false,
    //     canClose: true/false
    // }

    var SurfaceView = function SurfaceView(parentElement, options) {
        var self = this;
        var doc = this.doc = parentElement.ownerDocument;

        this.options = options;

        var el = this.el = doc.createElement("div");
        gli.ui.addClass(el, "gli-surfaceview");
        parentElement.appendChild(el);

        var toolsEl = this.toolsEl = doc.createElement("div");
        gli.ui.addClass(toolsEl, "gli-surfaceview-tools");
        el.appendChild(toolsEl);

        {
            var toolsLeftEl = doc.createElement("div");
            gli.ui.addClass(toolsLeftEl, "gli-surfaceview-tools-left");
            toolsEl.appendChild(toolsLeftEl);

            var nameEl = doc.createElement("span");
            nameEl.innerHTML = options.name || "";
            toolsLeftEl.appendChild(nameEl);

            if (this.options.dropdownList) {
                // TODO: dropdown list
            }

            var toolsRightEl = doc.createElement("div");
            gli.ui.addClass(toolsRightEl, "gli-surfaceview-tools-right");
            toolsEl.appendChild(toolsRightEl);

            function addButton(name, tip, callback) {
                var buttonEl = doc.createElement("div");
                gli.ui.addClass(buttonEl, "gli-surfaceview-button");
                gli.ui.addClass(buttonEl, "gli-surfaceview-command-" + name);
                buttonEl.title = tip;
                buttonEl.innerHTML = " ";
                toolsRightEl.appendChild(buttonEl);

                buttonEl.addEventListener("click", function (e) {
                    callback.call(self);
                    e.preventDefault();
                    e.stopPropagation();
                }, false);
            };
            addButton("fit", "Zoom to fit view", function () {
                zoomView.zoomToFit(true);
            });
            addButton("native", "Zoom to native size", function () {
                zoomView.zoomAboutPoint(undefined, undefined, 1);
            });
            if (this.options.canClose) {
                addButton("close", "Close view", function () {
                    console.log("close");
                });
            }
        }

        var outerEl = doc.createElement("div");
        gli.ui.addClass(outerEl, "gli-surfaceview-outer");
        el.appendChild(outerEl);

        var innerEl = doc.createElement("div");
        gli.ui.addClass(innerEl, "gli-surfaceview-inner");
        outerEl.appendChild(innerEl);

        var canvas = this.canvas = doc.createElement("canvas");

        var zoomView = this.zoomView = new gli.ui.controls.ZoomView(innerEl, {
            drawGrid: true
        });
        zoomView.layout();
        zoomView.setContent(canvas);

        var infoEl = doc.createElement("div");
        gli.ui.addClass(infoEl, "gli-surfaceview-info");
        el.appendChild(infoEl);

        function getLocationString(x, y) {
            var width = canvas.width;
            var height = canvas.height;
            var tx = String(Math.round(x / width * 10000) / 10000);
            var ty = String(Math.round(y / height * 10000) / 10000);
            if (tx.length == 1) {
                tx += ".0000";
            }
            while (tx.length < 6) {
                tx += "0";
            }
            if (ty.length == 1) {
                ty += ".0000";
            }
            while (ty.length < 6) {
                ty += "0";
            }
            return Math.floor(x) + ", " + Math.floor(y) + " (" + tx + ", " + ty + ")";
        };

        var lastX = 0;
        var lastY = 0;
        function updatePixelPreview(x, y) {
            pixelCanvas.style.display = "none";

            var pctx = pixelCanvas.getContext("2d");
            pctx.clearRect(0, 0, 1, 1);

            if ((x === null) || (y === null)) {
                pixelLocationEl.innerHTML = "";
                pixelColorEl.innerHTML = "";
                return;
            }

            lastX = x;
            lastY = y;

            // Draw preview in the pixel canvas
            pixelCanvas.style.display = "";
            pctx.drawImage(canvas, x, y, 1, 1, 0, 0, 1, 1);

            pixelLocationEl.innerHTML = getLocationString(x, y);

            var imageData = null;
            try {
                imageData = pctx.getImageData(0, 0, 1, 1);
            } catch (e) {
                // Likely a security error
            }
            if (imageData) {
                var r = imageData.data[0];
                var g = imageData.data[1];
                var b = imageData.data[2];
                var a = imageData.data[3];
                pixelColorEl.innerHTML = r + ", " + g + ", " + b + ", " + a;
            } else {
                pixelColorEl.innerHTML = "(unable to read)";
            }
        };

        {
            var pixelInfoEl = doc.createElement("div");
            gli.ui.addClass(pixelInfoEl, "gli-surfaceview-pixel-info");
            infoEl.appendChild(pixelInfoEl);

            var pixelCanvas = this.pixelCanvas = doc.createElement("canvas");
            pixelCanvas.width = 1;
            pixelCanvas.height = 1;
            pixelCanvas.style.display = "none";
            gli.ui.addClass(pixelCanvas, "gli-surfaceview-pixel-canvas");
            pixelInfoEl.appendChild(pixelCanvas);

            var pixelColorEl = this.pixelColorEl = doc.createElement("div");
            gli.ui.addClass(pixelColorEl, "gli-surfaceview-pixel-color");
            pixelInfoEl.appendChild(pixelColorEl);

            var pixelLocationEl = this.pixelLocationEl = doc.createElement("div");
            gli.ui.addClass(pixelLocationEl, "gli-surfaceview-pixel-location");
            pixelInfoEl.appendChild(pixelLocationEl);
        }

        zoomView.clicked.addListener(this, function (x, y, sx, sy, button) {
            console.log("clicked zoom view at " + sx + ", " + sy);
        });
        zoomView.mouseMove.addListener(this, function (x, y, sx, sy) {
            var sourceX = null;
            var sourceY = null;
            if (sx >= 0 && sx < canvas.width) {
                sourceX = sx;
            }
            if (sy >= 0 && sy < canvas.height) {
                sourceY = sy;
            }
            updatePixelPreview(sourceX, sourceY);
        });
        zoomView.mouseOut.addListener(this, function () {
            updatePixelPreview(null, null);
        });
    };

    SurfaceView.prototype.resetView = function resetView() {
        this.zoomView.zoomToFit(false);
    };

    SurfaceView.prototype.setSize = function setSize(width, height) {
        this.zoomView.layout();
        this.zoomView.invalidate();
    };

    SurfaceView.prototype.invalidate = function invalidate() {
        this.zoomView.invalidate();
    };

    controls.SurfaceView = SurfaceView;

})();
